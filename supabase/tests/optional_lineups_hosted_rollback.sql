-- Hosted RPC verification. Synthetic identities and records exist only in this
-- transaction. No emails, credentials, personal records or persistent fixtures.
begin;
do $$
declare
  actor uuid := gen_random_uuid(); peer uuid := gen_random_uuid();
  team uuid := gen_random_uuid(); other_team uuid := gen_random_uuid();
  season uuid := gen_random_uuid(); other_season uuid := gen_random_uuid();
  player uuid := gen_random_uuid(); guest uuid := gen_random_uuid(); foreign_player uuid := gen_random_uuid();
  cup uuid := gen_random_uuid(); game uuid := gen_random_uuid(); second_game uuid := gen_random_uuid(); ordered_game uuid := gen_random_uuid();
  day uuid := gen_random_uuid(); second_day uuid := gen_random_uuid(); ordered_day uuid := gen_random_uuid();
  command uuid := gen_random_uuid(); play uuid := gen_random_uuid();
  view jsonb; g jsonb; result jsonb; change jsonb; setup jsonb; rules jsonb;
  revision bigint; tournament_revision bigint; i integer;
begin
  insert into auth.users(id) values(actor),(peer);
  insert into public.teams(id,name,created_by) values(team,'Optional-lineup rollback test',actor),(other_team,'Other rollback test',peer);
  insert into public.team_memberships(team_id,user_id,is_captain) values(team,actor,false),(other_team,peer,false);
  insert into public.team_seasons(id,team_id,name,created_by) values(season,team,'Synthetic rollback season',actor),(other_season,other_team,'Other rollback season',peer);
  insert into public.team_players(id,team_id,user_id,display_name,is_guest) values(player,team,actor,'Synthetic Player',false),(guest,team,null,'Synthetic Guest',true),(foreign_player,other_team,null,'Other Synthetic Guest',true);
  perform set_config('request.jwt.claim.sub',actor::text,true);
  execute 'set local role authenticated';
  perform public.da_create_scoring_competition(team,season,cup,'Tournament','Synthetic rollback cup',2,2);
  rules := jsonb_build_object('version','Synthetic rollback rules','fenceLimit',2,'board',jsonb_build_object('strikeout',1,'solo',1,'bandSolo',-1,'grandSlam',-1,'overLimit',1,'insidePark',-1,'multiRun',0));
  view := public.da_read_scoring_season(team,season,'Overall');
  if view->'capabilities'->>'manualBatting' <> 'true' then raise exception 'Manual capability missing'; end if;
  tournament_revision := (view->'tournaments'->0->>'revision')::bigint;
  setup := jsonb_build_object('type','start','gameId',game,'kind','Tournament','opponent','Synthetic opponent','battingMode','manual','lineup','[]'::jsonb,'rules',rules,'bands','{}'::jsonb);
  result := public.da_start_scoring_game(team,season,day,date '2026-10-13',cup,gen_random_uuid(),0,tournament_revision,setup);
  if result->>'status' <> 'accepted' then raise exception 'Manual start failed'; end if;
  view := public.da_read_scoring_season(team,season,'Overall');
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
  if g->'lineup' <> '[]'::jsonb or g->'game'->>'batting_mode' <> 'manual' then raise exception 'Manual game fabricated a lineup'; end if;
  revision := (g->>'dayRevision')::bigint; tournament_revision := (g->>'tournamentRevision')::bigint;
  change := jsonb_build_object('type','score','gameId',game,'playId',play,'playerId',player,'outcome','Fence HR','runs',1,'rbi',1);
  begin
    perform public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),revision,tournament_revision,change);
    raise exception 'First Band was not required';
  exception when sqlstate '22023' then null; end;
  change := change || jsonb_build_object('firstGameBand',true);
  result := public.da_apply_scoring_game_change(team,season,day,game,command,revision,tournament_revision,change);
  if result->>'status' <> 'accepted' then raise exception 'Manual score failed'; end if;
  result := public.da_apply_scoring_game_change(team,season,day,game,command,revision,tournament_revision,change);
  if result->>'duplicate' <> 'true' then raise exception 'Retry was not idempotent'; end if;
  begin
    perform public.da_apply_scoring_game_change(team,season,day,game,command,revision,tournament_revision,change || jsonb_build_object('runs',2,'rbi',2));
    raise exception 'Changed command fingerprint accepted';
  exception when sqlstate '22023' then null; end;
  result := public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),revision,tournament_revision,change || jsonb_build_object('playId',gen_random_uuid()));
  if result->>'status' <> 'conflict' then raise exception 'Stale command accepted'; end if;
  for i in 1..2 loop
    view := public.da_read_scoring_season(team,season,'Overall');
    select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
    result := public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,
      jsonb_build_object('type','score','gameId',game,'playId',gen_random_uuid(),'playerId',player,'outcome','Fence HR','runs',1,'rbi',1));
    if result->>'status' <> 'accepted' then raise exception 'Repeated manual player failed'; end if;
  end loop;
  view := public.da_read_scoring_season(team,season,'Overall');
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
  if jsonb_array_length(g->'evaluation'->'rows') <> 3 or (g->'evaluation'->>'fenceUsed')::integer <> 2 or (g->'evaluation'->'rows'->0->>'delta')::integer <> -1 or g->'evaluation'->'rows'->2->>'official' <> 'OLHR' then raise exception 'HR limit/credit/replay changed'; end if;
  begin
    perform public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,
      jsonb_build_object('type','score','gameId',game,'playId',gen_random_uuid(),'playerId',foreign_player,'outcome','Hit','runs',0,'rbi',0));
    raise exception 'Foreign player accepted';
  exception when sqlstate '22023' then null; end;
  perform public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,
    jsonb_build_object('type','score','gameId',game,'playId',gen_random_uuid(),'playerId',guest,'outcome','Hit','runs',0,'rbi',0,'firstGameBand',false));
  view := public.da_read_scoring_season(team,season,'Overall');
  tournament_revision := (view->'tournaments'->0->>'revision')::bigint;
  setup := setup || jsonb_build_object('gameId',second_game);
  perform public.da_start_scoring_game(team,season,second_day,date '2026-10-14',cup,gen_random_uuid(),0,tournament_revision,setup);
  view := public.da_read_scoring_season(team,season,'Overall');
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=second_game::text;
  if (g->'game'->>'tournament_game_number')::integer <> 2 then raise exception 'Continuation number changed'; end if;
  perform public.da_apply_scoring_game_change(team,season,second_day,second_game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,
    jsonb_build_object('type','score','gameId',second_game,'playId',gen_random_uuid(),'playerId',player,'outcome','Fence HR','runs',1,'rbi',1));
  view := public.da_read_scoring_season(team,season,'Overall');
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=second_game::text;
  if (g->'evaluation'->>'fenceUsed')::integer <> 1 or (g->'evaluation'->'rows'->0->>'delta')::integer <> -1 or g->'lineup' <> '[]'::jsonb then raise exception 'Game 2 HR reset/Band carry failed'; end if;
  -- An old ordered client omits battingMode; its next batter still advances.
  setup := jsonb_build_object('type','start','gameId',ordered_game,'kind','League','opponent','Synthetic ordered opponent','lineup',jsonb_build_array(player,guest),'rules',rules,'bands',jsonb_build_object(player::text,false,guest::text,false));
  perform public.da_start_scoring_game(team,season,ordered_day,date '2026-10-15',null,gen_random_uuid(),0,null,setup);
  view := public.da_read_scoring_season(team,season,'Overall');
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=ordered_game::text;
  perform public.da_apply_scoring_game_change(team,season,ordered_day,ordered_game,gen_random_uuid(),(g->>'dayRevision')::bigint,null,
    jsonb_build_object('type','score','gameId',ordered_game,'playId',gen_random_uuid(),'playerId',player,'outcome','Hit','runs',0,'rbi',0));
  view := public.da_read_scoring_season(team,season,'Overall');
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=ordered_game::text;
  if g->'game'->>'batting_mode' <> 'ordered' or (g->'game'->>'next_batter_position')::integer <> 1 then raise exception 'Legacy ordered advancement changed'; end if;
  begin perform public.da_read_scoring_season(other_team,other_season,'Overall'); raise exception 'Cross-team read accepted'; exception when sqlstate '42501' then null; end;
  begin perform public.da_read_scoring_season(team,other_season,'Overall'); raise exception 'Cross-season read accepted'; exception when sqlstate '22023' then null; end;
  execute 'reset role';
  update public.team_seasons set archived=true where id=season and team_id=team;
  execute 'set local role authenticated';
  begin
    perform public.da_apply_scoring_game_change(team,season,ordered_day,ordered_game,gen_random_uuid(),(g->>'dayRevision')::bigint,null,
      jsonb_build_object('type','score','gameId',ordered_game,'playId',gen_random_uuid(),'playerId',guest,'outcome','Hit','runs',0,'rbi',0));
    raise exception 'Archived write accepted';
  exception when sqlstate '55000' then null; end;
  execute 'reset role';
end $$;
rollback;
select 'PASS: manual/legacy ordered RPCs, explicit atomic Bands, retries/fingerprints/conflicts, guests, team/season isolation, HR/credit/replay, Game 2 Band carry/reset, archived denial. All synthetic rows rolled back; no real Auth/browser acceptance claimed.' as verification;
