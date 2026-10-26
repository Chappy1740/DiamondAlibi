-- Local-only preparation; hosted application requires explicit approval.
-- Reversible archive state, never row deletion. Existing season archive RPC is reused.
begin;
do $$ begin
 if md5(pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure))<>'183bd19b34ebbe0f2ca675f1e29dd8b1' then raise exception 'Season read definition changed; review archive migration before applying'; end if;
end $$;
alter table public.scoring_tournaments add column archived boolean not null default false;

create function private.archive_scoring_tournament(p_team uuid,p_season uuid,p_tournament uuid,p_command uuid,p_expected bigint,p_archived boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); parent_archived boolean; t public.scoring_tournaments%rowtype; prior private.scoring_tournament_commands%rowtype; payload jsonb;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 perform 1 from public.team_memberships where team_id=p_team and user_id=actor and active for share;
 if not found then raise exception 'Team access denied' using errcode='42501'; end if;
 if p_command is null or p_expected is null or p_expected<0 or p_expected>=9007199254740990 or p_archived is null then raise exception 'Explicit archive choice and revision required' using errcode='22023'; end if;
 -- Use the established season/tournament lock order for all scoring writes.
 select archived into parent_archived from public.team_seasons where team_id=p_team and id=p_season for update;
 if not found then raise exception 'Season context unavailable' using errcode='22023'; end if;
 if parent_archived then raise exception 'Restore the season first' using errcode='55000'; end if;
 select * into t from public.scoring_tournaments where (team_id,season_id,id)=(p_team,p_season,p_tournament) for update;
 if not found then raise exception 'Tournament context unavailable' using errcode='22023'; end if;
 select * into prior from private.scoring_tournament_commands where (team_id,season_id,tournament_id,command_id)=(p_team,p_season,p_tournament,p_command);
 if found then
   if prior.actor_id<>actor or prior.expected_revision<>p_expected or prior.payload->>'type' is distinct from 'archiveTournament' or prior.payload->'archived' is distinct from to_jsonb(p_archived) then raise exception 'Archive command ID reused' using errcode='22023'; end if;
   return jsonb_build_object('status','accepted','duplicate',true,'revision',prior.accepted_revision,'archived',p_archived);
 end if;
 if t.revision<>p_expected then return jsonb_build_object('status','conflict','revision',t.revision,'archived',t.archived); end if;
 payload:=jsonb_build_object('type','archiveTournament','beforeArchived',t.archived,'archived',p_archived);
 insert into private.scoring_tournament_commands(team_id,season_id,tournament_id,command_id,actor_id,expected_revision,accepted_revision,payload)
 values(p_team,p_season,p_tournament,p_command,actor,p_expected,p_expected+1,payload);
 update public.scoring_tournaments set archived=p_archived,revision=revision+1 where (team_id,season_id,id)=(p_team,p_season,p_tournament);
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'tournament.archive_state',p_tournament);
 return jsonb_build_object('status','accepted','duplicate',false,'revision',p_expected+1,'archived',p_archived);
end $$;
revoke all on function private.archive_scoring_tournament(uuid,uuid,uuid,uuid,bigint,boolean) from public,anon,authenticated;
grant execute on function private.archive_scoring_tournament(uuid,uuid,uuid,uuid,bigint,boolean) to authenticated;
create function public.da_archive_scoring_tournament(p_team uuid,p_season uuid,p_tournament uuid,p_command uuid,p_expected bigint,p_archived boolean)
returns jsonb language sql security invoker set search_path='' as $$select private.archive_scoring_tournament(p_team,p_season,p_tournament,p_command,p_expected,p_archived)$$;
revoke all on function public.da_archive_scoring_tournament(uuid,uuid,uuid,uuid,bigint,boolean) from public,anon,authenticated;
grant execute on function public.da_archive_scoring_tournament(uuid,uuid,uuid,uuid,bigint,boolean) to authenticated;

-- Enforce read-only at the database layer, including stale clients and direct RPC calls.
-- Existing scoring functions already lock season then tournament; archive uses the same order.
create function private.require_unarchived_tournament() returns trigger
language plpgsql security invoker set search_path='' as $$
declare row_data jsonb; team uuid; tournament uuid; frozen boolean;
begin
 row_data:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 team:=(row_data->>'team_id')::uuid;
 if tg_table_name in ('scoring_games','scoring_tournament_bands') then tournament:=(row_data->>'tournament_id')::uuid;
 else select tournament_id into tournament from public.scoring_games where team_id=team and id=(row_data->>'game_id')::uuid; end if;
 if tournament is not null then
   select archived into frozen from public.scoring_tournaments where team_id=team and id=tournament;
   if frozen then raise exception 'Tournament is archived; restore it before scoring' using errcode='55000'; end if;
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function private.require_unarchived_tournament() from public,anon,authenticated;
create trigger tournament_archive_game_guard before insert or update on public.scoring_games for each row execute function private.require_unarchived_tournament();
create trigger tournament_archive_play_guard before insert on public.scoring_plays for each row execute function private.require_unarchived_tournament();
create trigger tournament_archive_revision_guard before insert on public.scoring_play_revisions for each row execute function private.require_unarchived_tournament();
create trigger tournament_archive_lineup_guard before insert or update or delete on public.scoring_lineups for each row execute function private.require_unarchived_tournament();
create trigger tournament_archive_band_guard before insert or update on public.scoring_tournament_bands for each row execute function private.require_unarchived_tournament();

create function private.protect_archived_tournament_defaults() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.archived and new.archived and (new.name,new.fence_limit,new.guaranteed_games) is distinct from (old.name,old.fence_limit,old.guaranteed_games) then raise exception 'Tournament is archived' using errcode='55000'; end if;
 return new;
end $$;
revoke all on function private.protect_archived_tournament_defaults() from public,anon,authenticated;
create trigger tournament_archive_defaults_guard before update on public.scoring_tournaments for each row execute function private.protect_archived_tournament_defaults();

create or replace function private.read_scoring_season(p_team uuid,p_season uuid,p_scope text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare games jsonb; tournaments jsonb; leagues jsonb; overall jsonb; board jsonb;
begin
  if auth.uid() is null or not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
  -- All queries share this statement's snapshot. No client-derived totals.
  overall:=private.scoring_season_totals(p_team,p_season,'Overall');
  select coalesce(jsonb_object_agg(key,value->'board'),'{}') into board from jsonb_each(overall);
  select coalesce(jsonb_agg(jsonb_build_object('game',to_jsonb(g),'playedOn',d.played_on,'dayRevision',d.revision,
    'tournamentRevision',t.revision,'lineup',coalesce((select jsonb_agg(l.player_id order by l.position) from public.scoring_lineups l where (l.team_id,l.day_id,l.game_id)=(g.team_id,g.day_id,g.id)),'[]'),
    'rules',to_jsonb(r),'evaluation',private.scoring_game_evaluation(g.team_id,g.day_id,g.id)) order by d.played_on,g.id),'[]') into games
    from public.scoring_games g join public.scoring_game_days d on d.id=g.day_id
    join public.scoring_rule_versions r on r.id=coalesce(g.corrected_rules_id,g.rules_id)
    left join public.scoring_tournaments t on t.id=g.tournament_id
    where g.team_id=p_team and g.season_id=p_season;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'revision',revision,'guaranteedGames',guaranteed_games,'fenceLimit',fence_limit,'archived',archived) order by name,id),'[]') into tournaments from public.scoring_tournaments where team_id=p_team and season_id=p_season;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'fenceLimit',fence_limit) order by name,id),'[]') into leagues from public.scoring_leagues where team_id=p_team and season_id=p_season;
  return jsonb_build_object('teamId',p_team,'seasonId',p_season,'scope',p_scope,'totals',private.scoring_season_totals(p_team,p_season,p_scope),'board',board,'games',games,'tournaments',tournaments,'leagues',leagues,'beverage',private.read_team_beverage(p_team),'capabilities',jsonb_build_object('manualBatting',true,'teamBeverage',true,'tournamentArchive',true));
end $$;
-- Existing RLS, direct-write denial and private/public RPC ACLs remain in force.
commit;
