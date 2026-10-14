-- Review source fragments for the approved canonical team Beverage migration.
-- No team is finalized automatically. The verification script performs no database I/O.
create function private.valid_beverage_rules(value jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select value is not null and jsonb_typeof(value)='object'
   and value ?& array['strikeout','solo','bandSolo','grandSlam','overLimit','insidePark','multiRun']
   and not exists(select 1 from jsonb_object_keys(value) k where not k=any(array['strikeout','solo','bandSolo','grandSlam','overLimit','insidePark','multiRun']))
   and not exists(select 1 from jsonb_each(value) e where jsonb_typeof(e.value)<>'number' or e.value::text !~ '^-?[0-9]{1,3}$' or abs((e.value::text)::integer)>100);
$$;
revoke all on function private.valid_beverage_rules(jsonb) from public,anon,authenticated;

create table private.team_beverage_settings (
 team_id uuid primary key references public.teams(id),
 revision bigint not null default 0 check(revision between 0 and 9007199254740990),
 rules jsonb check(rules is null or private.valid_beverage_rules(rules)),
 finalized_by uuid references auth.users(id),
 finalized_at timestamptz,
 check((rules is null and finalized_by is null and finalized_at is null) or (rules is not null and finalized_by is not null and finalized_at is not null))
);
create index team_beverage_finalizer_idx on private.team_beverage_settings(finalized_by);
create table private.beverage_commands (
 team_id uuid not null references public.teams(id), command_id uuid not null,
 actor_id uuid not null references auth.users(id), operation text not null check(operation in ('finalize','participation')),
 payload jsonb not null, response jsonb not null,
 accepted_revision bigint not null check(accepted_revision between 1 and 9007199254740990),
 created_at timestamptz not null default clock_timestamp(),
 primary key(team_id,command_id), unique(team_id,accepted_revision)
);
create index beverage_commands_actor_idx on private.beverage_commands(actor_id);
create table private.beverage_participation_events (
 team_id uuid not null, player_id uuid not null, revision bigint not null,
 participating boolean not null, command_id uuid not null,
 primary key(team_id,player_id,revision),
 foreign key(team_id,player_id) references public.team_players(team_id,id),
 foreign key(team_id,command_id) references private.beverage_commands(team_id,command_id)
);
create index beverage_events_command_idx on private.beverage_participation_events(team_id,command_id);
alter table private.team_beverage_settings enable row level security;
alter table private.beverage_commands enable row level security;
alter table private.beverage_participation_events enable row level security;
revoke all on private.team_beverage_settings,private.beverage_commands,private.beverage_participation_events from public,anon,authenticated;
create trigger beverage_commands_immutable before update or delete on private.beverage_commands for each row execute function private.reject_scoring_history_change();
create trigger beverage_events_immutable before update or delete on private.beverage_participation_events for each row execute function private.reject_scoring_history_change();

create function private.protect_team_beverage_settings() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Team Beverage history is retained'; end if;
 if new.team_id<>old.team_id or new.revision<>old.revision+1
   or (old.rules is not null and (new.rules is distinct from old.rules or new.finalized_by is distinct from old.finalized_by or new.finalized_at is distinct from old.finalized_at)) then
   raise exception 'Finalized team Beverage Rules cannot change' using errcode='22023';
 end if;
 return new;
end $$;
revoke all on function private.protect_team_beverage_settings() from public,anon,authenticated;
create trigger team_beverage_settings_guard before update or delete on private.team_beverage_settings for each row execute function private.protect_team_beverage_settings();

-- Revision zero means legacy participation, preserving every existing play.
alter table public.scoring_plays add column beverage_revision bigint not null default 0 check(beverage_revision between 0 and 9007199254740990);
alter table public.scoring_play_revisions add column beverage_participating boolean not null default true;
create function private.capture_beverage_revision() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 insert into private.team_beverage_settings(team_id) values(new.team_id) on conflict do nothing;
 select revision into strict new.beverage_revision from private.team_beverage_settings where team_id=new.team_id for update;
 return new;
end $$;
create function private.capture_beverage_participation() returns trigger
language plpgsql security invoker set search_path='' as $$
declare boundary bigint;
begin
 select beverage_revision into strict boundary from public.scoring_plays where (team_id,day_id,game_id,id)=(new.team_id,new.day_id,new.game_id,new.play_id);
 select e.participating into new.beverage_participating from private.beverage_participation_events e
 where e.team_id=new.team_id and e.player_id=new.player_id and e.revision<=boundary order by e.revision desc limit 1;
 new.beverage_participating:=coalesce(new.beverage_participating,true);
 return new;
end $$;
revoke all on function private.capture_beverage_revision(),private.capture_beverage_participation() from public,anon,authenticated;
create trigger scoring_play_beverage_capture before insert on public.scoring_plays for each row execute function private.capture_beverage_revision();
create trigger scoring_revision_beverage_capture before insert on public.scoring_play_revisions for each row execute function private.capture_beverage_participation();

create function private.read_team_beverage(p_team uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s private.team_beverage_settings%rowtype; player uuid; participating boolean;
begin
 if auth.uid() is null or not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 select id into player from public.team_players where team_id=p_team and user_id=auth.uid() and not is_guest;
 select * into s from private.team_beverage_settings where team_id=p_team;
 select e.participating into participating from private.beverage_participation_events e where e.team_id=p_team and e.player_id=player order by e.revision desc limit 1;
 return jsonb_build_object('teamId',p_team,'revision',coalesce(s.revision,0),'finalized',s.rules is not null,'rules',s.rules,'canToggle',player is not null,'participating',coalesce(participating,true));
end $$;

create function private.change_team_beverage(p_team uuid,p_command uuid,p_expected bigint,p_change jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s private.team_beverage_settings%rowtype; prior private.beverage_commands%rowtype; player uuid; result jsonb; operation text;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 perform 1 from public.team_memberships where team_id=p_team and user_id=actor and active for share;
 if not found then raise exception 'Team access denied' using errcode='42501'; end if;
 if p_command is null or p_expected is null or p_expected<0 or p_expected>=9007199254740990 or p_change is null or jsonb_typeof(p_change)<>'object' then raise exception 'Invalid Beverage change' using errcode='22023'; end if;
 operation:=p_change->>'type';
 if operation='participation' then
   if p_change is distinct from jsonb_build_object('type','participation','participating',p_change->'participating') or jsonb_typeof(p_change->'participating') is distinct from 'boolean' then raise exception 'Choose participation explicitly' using errcode='22023'; end if;
   select id into player from public.team_players where team_id=p_team and user_id=actor and not is_guest;
   if not found then raise exception 'Your account-linked player is required' using errcode='42501'; end if;
 elsif operation='finalize' then
   if p_change is distinct from jsonb_build_object('type','finalize','rules',p_change->'rules') or not private.valid_beverage_rules(p_change->'rules') then raise exception 'Explicit team Beverage Rules required' using errcode='22023'; end if;
 else raise exception 'Invalid Beverage change' using errcode='22023'; end if;
 insert into private.team_beverage_settings(team_id) values(p_team) on conflict do nothing;
 select * into strict s from private.team_beverage_settings where team_id=p_team for update;
 select * into prior from private.beverage_commands where team_id=p_team and command_id=p_command;
 if found then
   if prior.actor_id<>actor or prior.payload<>p_change then raise exception 'Beverage command ID reused' using errcode='22023'; end if;
   return prior.response || jsonb_build_object('duplicate',true);
 end if;
 if s.revision<>p_expected then return jsonb_build_object('status','conflict','revision',s.revision); end if;
 if operation='finalize' then
   if s.rules is not null then raise exception 'Team Beverage Rules are already finalized' using errcode='22023'; end if;
   -- Serialize against scoring starts via the settings lock; never rewrite game rules.
   if exists(select 1 from public.scoring_games g join public.scoring_rule_versions r on r.id=coalesce(g.corrected_rules_id,g.rules_id) where g.team_id=p_team and not g.completed and
     jsonb_build_object('strikeout',r.strikeout,'solo',r.solo,'bandSolo',r.band_solo,'grandSlam',r.grand_slam,'overLimit',r.over_limit,'insidePark',r.inside_park,'multiRun',r.multi_run)<>p_change->'rules') then
     raise exception 'Complete games with different Beverage rules before finalizing' using errcode='55000';
   end if;
   update private.team_beverage_settings set revision=revision+1,rules=p_change->'rules',finalized_by=actor,finalized_at=clock_timestamp() where team_id=p_team;
 else update private.team_beverage_settings set revision=revision+1 where team_id=p_team;
 end if;
 result:=jsonb_build_object('status','accepted','duplicate',false,'revision',s.revision+1);
 insert into private.beverage_commands(team_id,command_id,actor_id,operation,payload,response,accepted_revision) values(p_team,p_command,actor,operation,p_change,result,s.revision+1);
 if operation='participation' then
   insert into private.beverage_participation_events(team_id,player_id,revision,participating,command_id) values(p_team,player,s.revision+1,(p_change->>'participating')::boolean,p_command);
 end if;
 return result;
end $$;
revoke all on function private.read_team_beverage(uuid),private.change_team_beverage(uuid,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function private.read_team_beverage(uuid),private.change_team_beverage(uuid,uuid,bigint,jsonb) to authenticated;
create function public.da_read_team_beverage(p_team uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_team_beverage(p_team) $$;
create function public.da_change_team_beverage(p_team uuid,p_command uuid,p_expected bigint,p_change jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.change_team_beverage(p_team,p_command,p_expected,p_change) $$;
revoke all on function public.da_read_team_beverage(uuid),public.da_change_team_beverage(uuid,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.da_read_team_beverage(uuid),public.da_change_team_beverage(uuid,uuid,bigint,jsonb) to authenticated;
