-- Owner explicitly approved live application, push, publication and deployment on 2026-10-14.
-- Team creator manages defaults for NEW games. Existing game rules/history remain.
begin;
do $$ begin
 if md5(pg_get_functiondef('private.read_team_beverage(uuid)'::regprocedure))<>'7508ced92e5df2896df7b75ad5fdcf44'
 or md5(pg_get_functiondef('private.change_team_beverage(uuid,uuid,bigint,jsonb)'::regprocedure))<>'12d7dd2488ec49c2ac9b91fdecc8080c'
 or md5(pg_get_functiondef('private.protect_team_beverage_settings()'::regprocedure))<>'128ba24de2cd081ef3b40dd2f80c722a' then
 raise exception 'Unexpected Beverage definitions; review before applying'; end if;
end $$;
alter table private.beverage_commands drop constraint beverage_commands_operation_check;
alter table private.beverage_commands add constraint beverage_commands_operation_check check(operation in ('finalize','replace','participation'));
alter table private.beverage_commands add column previous_rules jsonb check(previous_rules is null or private.valid_beverage_rules(previous_rules));

create or replace function private.protect_team_beverage_settings() returns trigger
language plpgsql security invoker set search_path='' as $$
declare c private.beverage_commands%rowtype;
begin
 if tg_op='DELETE' then raise exception 'Team Beverage history is retained'; end if;
 if new.team_id<>old.team_id or new.revision<>old.revision+1 then raise exception 'Invalid team Beverage revision' using errcode='22023'; end if;
 select * into c from private.beverage_commands where team_id=new.team_id and accepted_revision=new.revision;
 if not found then raise exception 'Accepted Beverage command required' using errcode='22023'; end if;
 if new.rules is distinct from old.rules or new.finalized_by is distinct from old.finalized_by or new.finalized_at is distinct from old.finalized_at then
   if c.operation<>(case when old.rules is null then 'finalize' else 'replace' end)
     or new.rules is null or not private.valid_beverage_rules(new.rules)
     or c.payload->'rules' is distinct from new.rules or c.previous_rules is distinct from old.rules
     or c.actor_id is distinct from new.finalized_by or c.created_at is distinct from new.finalized_at
     or not exists(select 1 from public.teams t join public.team_memberships m on m.team_id=t.id and m.user_id=t.created_by and m.active where t.id=new.team_id and t.created_by=c.actor_id) then
     raise exception 'Manager rule command required' using errcode='42501';
   end if;
 elsif c.operation<>'participation' then raise exception 'Rule change must be explicit' using errcode='22023'; end if;
 return new;
end $$;

create or replace function private.read_team_beverage(p_team uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s private.team_beverage_settings%rowtype; player uuid; participating boolean; locker text; manager boolean;
begin
 if auth.uid() is null or not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 select id into player from public.team_players where team_id=p_team and user_id=auth.uid() and not is_guest;
 select * into s from private.team_beverage_settings where team_id=p_team;
 select e.participating into participating from private.beverage_participation_events e where e.team_id=p_team and e.player_id=player order by e.revision desc limit 1;
 select display_name into locker from public.team_players where team_id=p_team and user_id=s.finalized_by;
 select exists(select 1 from public.teams where id=p_team and created_by=auth.uid()) into manager;
 return jsonb_build_object('teamId',p_team,'revision',coalesce(s.revision,0),'finalized',s.rules is not null,'rules',s.rules,'canToggle',player is not null,'participating',coalesce(participating,true),
   'management',jsonb_build_object('canEdit',manager,'lockedBy',case when s.rules is not null then coalesce(locker,'Former team member') else null end,'lockedAt',s.finalized_at));
end $$;

create or replace function private.change_team_beverage(p_team uuid,p_command uuid,p_expected bigint,p_change jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s private.team_beverage_settings%rowtype; prior private.beverage_commands%rowtype; player uuid; result jsonb; operation text; accepted_at timestamptz;
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
 elsif operation in ('finalize','replace') then
   if not exists(select 1 from public.teams where id=p_team and created_by=actor) then raise exception 'Only the team creator can manage Beverage Rules' using errcode='42501'; end if;
   if p_change is distinct from jsonb_build_object('type',operation,'rules',p_change->'rules') or not private.valid_beverage_rules(p_change->'rules') then raise exception 'Explicit team Beverage Rules required' using errcode='22023'; end if;
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
   if exists(select 1 from public.scoring_games g join public.scoring_rule_versions r on r.id=coalesce(g.corrected_rules_id,g.rules_id) where g.team_id=p_team and not g.completed and
     jsonb_build_object('strikeout',r.strikeout,'solo',r.solo,'bandSolo',r.band_solo,'grandSlam',r.grand_slam,'overLimit',r.over_limit,'insidePark',r.inside_park,'multiRun',r.multi_run)<>p_change->'rules') then
     raise exception 'Complete games with different Beverage rules before finalizing' using errcode='55000';
   end if;
 elsif operation='replace' then
   if s.rules is null then raise exception 'Finalize team Beverage Rules first' using errcode='22023'; end if;
   if s.rules=p_change->'rules' then raise exception 'Choose a different rule amount' using errcode='22023'; end if;
 end if;
 accepted_at:=clock_timestamp();
 result:=jsonb_build_object('status','accepted','duplicate',false,'revision',s.revision+1);
 insert into private.beverage_commands(team_id,command_id,actor_id,operation,payload,response,accepted_revision,created_at,previous_rules)
 values(p_team,p_command,actor,operation,p_change,result,s.revision+1,accepted_at,case when operation='replace' then s.rules else null end);
 if operation in ('finalize','replace') then
   update private.team_beverage_settings set revision=revision+1,rules=p_change->'rules',finalized_by=actor,finalized_at=accepted_at where team_id=p_team;
 else
   update private.team_beverage_settings set revision=revision+1 where team_id=p_team;
   insert into private.beverage_participation_events(team_id,player_id,revision,participating,command_id) values(p_team,player,s.revision+1,(p_change->>'participating')::boolean,p_command);
 end if;
 return result;
end $$;
-- Existing public invoker wrappers keep their signatures. No direct table access.
revoke all on function private.protect_team_beverage_settings() from public,anon,authenticated;
revoke all on function private.read_team_beverage(uuid),private.change_team_beverage(uuid,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function private.read_team_beverage(uuid),private.change_team_beverage(uuid,uuid,bigint,jsonb) to authenticated;
commit;
