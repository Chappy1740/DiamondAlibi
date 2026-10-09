-- REVIEW ONLY: pending live approval. Preserve existing tournaments with NULL guarantee.
-- Guarantee describes tournament setup; it does not cap recorded games or alter scoring/Bands.
alter table public.scoring_tournaments add column guaranteed_games integer check (guaranteed_games in (2,3));

create function private.create_scoring_tournament(p_team uuid,p_season uuid,p_id uuid,p_name text,p_guaranteed_games integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); active_member boolean; archived_season boolean; existing public.scoring_tournaments%rowtype;
begin
  if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select active into active_member from public.team_memberships where team_id=p_team and user_id=actor for share;
  if not found or not active_member then raise exception 'Team access denied' using errcode='42501'; end if;
  select archived into archived_season from public.team_seasons where team_id=p_team and id=p_season for update;
  if not found then raise exception 'Season context unavailable' using errcode='22023'; end if;
  if archived_season then raise exception 'Archived season writes are paused' using errcode='55000'; end if;
  if p_guaranteed_games is null or p_guaranteed_games not in (2,3) then raise exception 'Choose 2-game or 3-game guaranteed' using errcode='22023'; end if;
  if p_id is null or p_name is null or char_length(trim(p_name)) not between 1 and 200 then raise exception 'Tournament ID and name required' using errcode='22023'; end if;
  select * into existing from public.scoring_tournaments where id=p_id;
  if found then
    if existing.team_id<>p_team or existing.season_id<>p_season or existing.name<>trim(p_name) or existing.guaranteed_games is distinct from p_guaranteed_games then raise exception 'Tournament ID already used for another setup' using errcode='22023'; end if;
    return jsonb_build_object('id',p_id,'duplicate',true,'revision',existing.revision);
  end if;
  insert into public.scoring_tournaments(id,team_id,season_id,name,guaranteed_games) values(p_id,p_team,p_season,trim(p_name),p_guaranteed_games);
  insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'create_scoring_tournament',p_id);
  return jsonb_build_object('id',p_id,'duplicate',false,'revision',0);
end $$;
revoke all on function private.create_scoring_tournament(uuid,uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function private.create_scoring_tournament(uuid,uuid,uuid,text,integer) to authenticated;
create function public.da_create_scoring_tournament(p_team uuid,p_season uuid,p_id uuid,p_name text,p_guaranteed_games integer)
returns jsonb language sql security invoker set search_path='' as $$select private.create_scoring_tournament(p_team,p_season,p_id,p_name,p_guaranteed_games)$$;
revoke all on function public.da_create_scoring_tournament(uuid,uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.da_create_scoring_tournament(uuid,uuid,uuid,text,integer) to authenticated;

create or replace function private.read_scoring_season(p_team uuid,p_season uuid,p_scope text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare games jsonb; tournaments jsonb; overall jsonb; board jsonb;
begin
  if auth.uid() is null or not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
  -- All queries share this statement's snapshot. No client-derived totals.
  overall:=private.scoring_season_totals(p_team,p_season,'Overall');
  select coalesce(jsonb_object_agg(key,value->'board'),'{}') into board from jsonb_each(overall);
  select coalesce(jsonb_agg(jsonb_build_object('game',to_jsonb(g),'playedOn',d.played_on,'dayRevision',d.revision,
    'tournamentRevision',t.revision,'lineup',coalesce((select jsonb_agg(l.player_id order by l.position) from public.scoring_lineups l where (l.team_id,l.day_id,l.game_id)=(g.team_id,g.day_id,g.id)),'[]'),
    'rules',to_jsonb(r),'evaluation',private.scoring_game_evaluation(g.team_id,g.day_id,g.id)) order by d.played_on,g.id),'[]') into games
    from public.scoring_games g join public.scoring_game_days d on d.id=g.day_id
    join public.scoring_rule_versions r on r.id=g.rules_id
    left join public.scoring_tournaments t on t.id=g.tournament_id
    where g.team_id=p_team and g.season_id=p_season;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'revision',revision,'guaranteedGames',guaranteed_games) order by name,id),'[]') into tournaments from public.scoring_tournaments where team_id=p_team and season_id=p_season;
  return jsonb_build_object('teamId',p_team,'seasonId',p_season,'scope',p_scope,'totals',private.scoring_season_totals(p_team,p_season,p_scope),'board',board,'games',games,'tournaments',tournaments);
end $$;
