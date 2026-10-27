-- Optional venue-local time for Game 1 only. No invented historical times.
begin;
do $$ begin
 if md5(replace(pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure),chr(13),''))<>'7f765220c81dde114a9a7044627e7592' then
   raise exception 'Season read definition changed; review start time migration';
 end if;
end $$;
alter table public.scoring_tournaments
  add column first_game_time text check (first_game_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column first_game_zone text not null default 'America/Chicago'
    check (first_game_zone in ('America/Chicago','America/New_York','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','Pacific/Honolulu','UTC'));

create function private.set_tournament_start_time(p_team uuid,p_season uuid,p_tournament uuid,p_command uuid,p_expected bigint,p_time text,p_zone text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); parent_archived boolean; t public.scoring_tournaments%rowtype; prior private.scoring_tournament_commands%rowtype; payload jsonb;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 perform 1 from public.team_memberships where team_id=p_team and user_id=actor and active for share;
 if not found then raise exception 'Team access denied' using errcode='42501'; end if;
 if p_command is null or p_expected is null or p_expected<0 or p_expected>=9007199254740990
   or (p_time is not null and p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
   or p_zone is null or p_zone not in ('America/Chicago','America/New_York','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','Pacific/Honolulu','UTC')
 then raise exception 'Valid start time, time zone and revision required' using errcode='22023'; end if;
 -- Existing writes take membership, season, then tournament locks in this order.
 select archived into parent_archived from public.team_seasons where team_id=p_team and id=p_season for update;
 if not found then raise exception 'Season context unavailable' using errcode='22023'; end if;
 if parent_archived then raise exception 'Restore the season first' using errcode='55000'; end if;
 select * into t from public.scoring_tournaments where (team_id,season_id,id)=(p_team,p_season,p_tournament) for update;
 if not found then raise exception 'Tournament context unavailable' using errcode='22023'; end if;
 if t.archived then raise exception 'Restore the tournament first' using errcode='55000'; end if;
 select * into prior from private.scoring_tournament_commands where (team_id,season_id,tournament_id,command_id)=(p_team,p_season,p_tournament,p_command);
 if found then
   if prior.actor_id<>actor or prior.expected_revision<>p_expected or prior.payload->>'type' is distinct from 'tournamentStartTime'
     or prior.payload->'time' is distinct from coalesce(to_jsonb(p_time),'null'::jsonb) or prior.payload->>'zone' is distinct from p_zone
   then raise exception 'Start time command ID reused' using errcode='22023'; end if;
   return jsonb_build_object('status','accepted','duplicate',true,'revision',prior.accepted_revision);
 end if;
 if t.revision<>p_expected then return jsonb_build_object('status','conflict','revision',t.revision); end if;
 payload:=jsonb_build_object('type','tournamentStartTime','beforeTime',t.first_game_time,'beforeZone',t.first_game_zone,'time',p_time,'zone',p_zone);
 insert into private.scoring_tournament_commands(team_id,season_id,tournament_id,command_id,actor_id,expected_revision,accepted_revision,payload)
 values(p_team,p_season,p_tournament,p_command,actor,p_expected,p_expected+1,payload);
 update public.scoring_tournaments set first_game_time=p_time,first_game_zone=p_zone,revision=revision+1 where (team_id,season_id,id)=(p_team,p_season,p_tournament);
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'tournament.start_time',p_tournament);
 return jsonb_build_object('status','accepted','duplicate',false,'revision',p_expected+1);
end $$;
revoke all on function private.set_tournament_start_time(uuid,uuid,uuid,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function private.set_tournament_start_time(uuid,uuid,uuid,uuid,bigint,text,text) to authenticated;
create function public.da_set_tournament_start_time(p_team uuid,p_season uuid,p_tournament uuid,p_command uuid,p_expected bigint,p_time text,p_zone text)
returns jsonb language sql security invoker set search_path='' as $$select private.set_tournament_start_time(p_team,p_season,p_tournament,p_command,p_expected,p_time,p_zone)$$;
revoke all on function public.da_set_tournament_start_time(uuid,uuid,uuid,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.da_set_tournament_start_time(uuid,uuid,uuid,uuid,bigint,text,text) to authenticated;

-- Extend the existing authorized snapshot without replacing its scoring logic.
-- Fail closed on source drift, before committing the schema/RPC changes above.
do $$
declare definition text; expected text;
begin
 definition:=pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure);
 expected:=$needle$'fenceLimit',fence_limit,'archived',archived)$needle$;
 if strpos(definition,expected)=0 or strpos(definition,$needle$'tournamentArchive',true)$needle$)=0 then
   raise exception 'Season read definition changed; review start time migration';
 end if;
 definition:=replace(definition,expected,$needle$'fenceLimit',fence_limit,'archived',archived,'firstGameTime',first_game_time,'firstGameZone',first_game_zone)$needle$);
 definition:=replace(definition,$needle$'tournamentArchive',true)$needle$,$needle$'tournamentArchive',true,'tournamentStartTime',true)$needle$);
 execute definition;
end $$;
commit;
