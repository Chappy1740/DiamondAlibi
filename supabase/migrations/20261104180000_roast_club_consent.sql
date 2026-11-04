-- Roast Club consent. Entirely separate from Beverage Board participation.
-- Server-authoritative and append-only. Every player is opted OUT until the
-- account-linked player chooses otherwise; absence of a row means "no".
-- Consent is scoped to a team player (team boundary); it is not season-specific.

create table private.roast_club_commands (
 team_id uuid not null references public.teams(id), command_id uuid not null,
 actor_id uuid not null references auth.users(id),
 payload jsonb not null, response jsonb not null,
 created_at timestamptz not null default clock_timestamp(),
 primary key(team_id,command_id)
);
create index roast_club_commands_actor_idx on private.roast_club_commands(actor_id);

create table private.roast_club_consent_events (
 team_id uuid not null, player_id uuid not null,
 revision bigint not null check(revision between 1 and 9007199254740990),
 opted_in boolean not null, command_id uuid not null,
 created_at timestamptz not null default clock_timestamp(),
 primary key(team_id,player_id,revision),
 foreign key(team_id,player_id) references public.team_players(team_id,id),
 foreign key(team_id,command_id) references private.roast_club_commands(team_id,command_id)
);
create index roast_club_events_command_idx on private.roast_club_consent_events(team_id,command_id);

alter table private.roast_club_commands enable row level security;
alter table private.roast_club_consent_events enable row level security;
revoke all on private.roast_club_commands,private.roast_club_consent_events from public,anon,authenticated;
create trigger roast_club_commands_immutable before update or delete on private.roast_club_commands for each row execute function private.reject_scoring_history_change();
create trigger roast_club_events_immutable before update or delete on private.roast_club_consent_events for each row execute function private.reject_scoring_history_change();

-- Reads the caller's own choice plus the team's currently effective opt-ins.
-- A player counts only while an account-linked, non-guest player still has an
-- ACTIVE membership; otherwise consent fails closed. Only opted-in ids are returned.
create function private.read_roast_club(p_team uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare player uuid; opted jsonb;
begin
 if auth.uid() is null or not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 select id into player from public.team_players where team_id=p_team and user_id=auth.uid() and not is_guest;
 select coalesce(jsonb_agg(l.player_id order by l.player_id),'[]'::jsonb) into opted from (
   select distinct on (e.player_id) e.player_id, e.opted_in
   from private.roast_club_consent_events e
   join public.team_players tp on tp.team_id=e.team_id and tp.id=e.player_id and not tp.is_guest
   join public.team_memberships m on m.team_id=tp.team_id and m.user_id=tp.user_id and m.active
   where e.team_id=p_team
   order by e.player_id, e.revision desc
 ) l where l.opted_in;
 return jsonb_build_object('teamId',p_team,'canToggle',player is not null,
   'optedIn',player is not null and opted ? player::text,'optedInPlayerIds',opted);
end $$;

-- Only the caller's own account-linked player can change their own participation.
-- There is deliberately no parameter naming any other player.
create function private.change_roast_club(p_team uuid,p_command uuid,p_opted_in boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); player uuid; prior private.roast_club_commands%rowtype; rev bigint; payload jsonb; result jsonb;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_command is null or p_opted_in is null then raise exception 'Choose Roast Club participation explicitly' using errcode='22023'; end if;
 perform 1 from public.team_memberships where team_id=p_team and user_id=actor and active for share;
 if not found then raise exception 'Team access denied' using errcode='42501'; end if;
 select id into player from public.team_players where team_id=p_team and user_id=actor and not is_guest for no key update;
 if not found then raise exception 'Your account-linked player is required' using errcode='42501'; end if;
 payload:=jsonb_build_object('type','roast-club','optedIn',p_opted_in);
 select * into prior from private.roast_club_commands where team_id=p_team and command_id=p_command;
 if found then
   if prior.actor_id<>actor or prior.payload<>payload then raise exception 'Roast Club command ID reused' using errcode='22023'; end if;
   return prior.response || jsonb_build_object('duplicate',true);
 end if;
 select coalesce(max(revision),0)+1 into rev from private.roast_club_consent_events where team_id=p_team and player_id=player;
 result:=jsonb_build_object('status','accepted','duplicate',false,'optedIn',p_opted_in,'revision',rev);
 insert into private.roast_club_commands(team_id,command_id,actor_id,payload,response) values(p_team,p_command,actor,payload,result);
 insert into private.roast_club_consent_events(team_id,player_id,revision,opted_in,command_id) values(p_team,player,rev,p_opted_in,p_command);
 return result;
end $$;

revoke all on function private.read_roast_club(uuid),private.change_roast_club(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function private.read_roast_club(uuid),private.change_roast_club(uuid,uuid,boolean) to authenticated;
create function public.da_read_roast_club(p_team uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_roast_club(p_team) $$;
create function public.da_change_roast_club(p_team uuid,p_command uuid,p_opted_in boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.change_roast_club(p_team,p_command,p_opted_in) $$;
revoke all on function public.da_read_roast_club(uuid),public.da_change_roast_club(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.da_read_roast_club(uuid),public.da_change_roast_club(uuid,uuid,boolean) to authenticated;
