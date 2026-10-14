-- Hosted RPC verification using random synthetic identities only. No emails,
-- credentials, existing teams/games or persistent test records. Always ROLLBACK.
begin;
do $$
declare
 actor uuid:=gen_random_uuid(); peer uuid:=gen_random_uuid();
 team uuid:=gen_random_uuid(); other_team uuid:=gen_random_uuid();
 season uuid:=gen_random_uuid(); other_season uuid:=gen_random_uuid();
 player uuid:=gen_random_uuid(); other_player uuid:=gen_random_uuid();
 cup uuid:=gen_random_uuid(); game uuid:=gen_random_uuid(); day uuid:=gen_random_uuid();
 out_command uuid:=gen_random_uuid(); opted_out_play uuid:=gen_random_uuid();
 rules jsonb; setup jsonb; view jsonb; g jsonb; result jsonb; preference jsonb;
 revision bigint; tournament_revision bigint; i integer; captured boolean;
begin
 insert into auth.users(id) values(actor),(peer);
 insert into public.teams(id,name,created_by) values(team,'Beverage rollback-only synthetic team',actor),(other_team,'Beverage rollback-only other team',peer);
 insert into public.team_memberships(team_id,user_id,is_captain) values(team,actor,false),(other_team,peer,false);
 insert into public.team_seasons(id,team_id,name,created_by) values(season,team,'Beverage rollback-only season',actor),(other_season,other_team,'Beverage rollback-only other season',peer);
 insert into public.team_players(id,team_id,user_id,display_name,is_guest) values(player,team,actor,'Synthetic Beverage Player',false),(other_player,other_team,peer,'Other Synthetic Beverage Player',false);
 perform set_config('request.jwt.claim.sub',actor::text,true);
 execute 'set local role authenticated';
 rules:=jsonb_build_object('strikeout',1,'solo',1,'bandSolo',-1,'grandSlam',-1,'overLimit',1,'insidePark',-1,'multiRun',0);
 preference:=public.da_read_team_beverage(team);
 if preference->>'participating' is distinct from 'true' or preference->>'finalized' is distinct from 'false' then raise exception 'Initial Beverage state incorrect'; end if;
 result:=public.da_change_team_beverage(team,gen_random_uuid(),0,jsonb_build_object('type','finalize','rules',rules));
 if result->>'status' is distinct from 'accepted' then raise exception 'Team finalization failed'; end if;
 begin
  perform public.da_change_team_beverage(team,gen_random_uuid(),1,jsonb_build_object('type','finalize','rules',rules));
  raise exception 'Finalized rules changed';
 exception when sqlstate '22023' then null; end;
 begin
  perform public.da_change_team_beverage(team,gen_random_uuid(),1,jsonb_build_object('type','participation','participating',false,'playerId',other_player));
  raise exception 'Submitted player identity accepted';
 exception when sqlstate '22023' then null; end;
 begin
  perform public.da_read_team_beverage(other_team);
  raise exception 'Other team readable';
 exception when insufficient_privilege then null; end;
 perform public.da_create_scoring_competition(team,season,cup,'Tournament','Beverage rollback-only cup',2,2);
 view:=public.da_read_scoring_season(team,season,'Overall');
 if view->'capabilities'->>'teamBeverage' is distinct from 'true' then raise exception 'Beverage capability missing'; end if;
 tournament_revision:=(view->'tournaments'->0->>'revision')::bigint;
 setup:=jsonb_build_object('type','start','gameId',game,'kind','Tournament','opponent','Synthetic Beverage opponent','battingMode','manual','lineup','[]'::jsonb,'rules',jsonb_build_object('version','Synthetic Beverage rules','fenceLimit',2,'board',rules),'bands','{}'::jsonb);
 result:=public.da_start_scoring_game(team,season,day,date '2026-10-13',cup,gen_random_uuid(),0,tournament_revision,setup);
 if result->>'status' is distinct from 'accepted' then raise exception 'Synthetic game failed'; end if;
 view:=public.da_read_scoring_season(team,season,'Overall');
 select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
 result:=public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','score','gameId',game,'playId',gen_random_uuid(),'playerId',player,'outcome','Fence HR','runs',1,'rbi',1,'firstGameBand',true));
 if result->>'status' is distinct from 'accepted' then raise exception 'Participating Band HR failed'; end if;
 view:=public.da_read_scoring_season(team,season,'Overall');
 if (view->'board'->>player::text)::integer is distinct from -1 then raise exception 'Negative credit missing'; end if;
 result:=public.da_change_team_beverage(team,out_command,1,jsonb_build_object('type','participation','participating',false));
 if result->>'status' is distinct from 'accepted' then raise exception 'Opt-out failed'; end if;
 view:=public.da_read_scoring_season(team,season,'Overall');
 if (view->'board'->>player::text)::integer is distinct from -1 then raise exception 'Opt-out erased prior credit'; end if;
 for i in 1..3 loop
  select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
  result:=public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','score','gameId',game,'playId',case when i=1 then opted_out_play else gen_random_uuid() end,'playerId',player,'outcome',case when i=1 then 'K' else 'Fence HR' end,'runs',case when i=1 then 0 else 1 end,'rbi',case when i=1 then 0 else 1 end));
  if result->>'status' is distinct from 'accepted' then raise exception 'Opted-out save failed'; end if;
  view:=public.da_read_scoring_season(team,season,'Overall');
 end loop;
 select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
 if (view->'board'->>player::text)::integer is distinct from -1 or (g->'evaluation'->>'fenceUsed')::integer is distinct from 2 or (g->'evaluation'->'totals'->player::text->>'HR')::integer is distinct from 2 or (g->'evaluation'->'totals'->player::text->>'K')::integer is distinct from 1 or g->'evaluation'->'rows'->3->>'official' is distinct from 'OLHR' then raise exception 'Opt-out changed stats, HR use or credit'; end if;
 result:=public.da_change_team_beverage(team,gen_random_uuid(),2,jsonb_build_object('type','participation','participating',true));
 if result->>'status' is distinct from 'accepted' then raise exception 'Rejoin failed'; end if;
 result:=public.da_change_team_beverage(team,out_command,1,jsonb_build_object('type','participation','participating',false));
 preference:=public.da_read_team_beverage(team);
 if result->>'duplicate' is distinct from 'true' or preference->>'participating' is distinct from 'true' then raise exception 'Late retry undid rejoin'; end if;
 result:=public.da_change_team_beverage(team,gen_random_uuid(),0,jsonb_build_object('type','participation','participating',false));
 if result->>'status' is distinct from 'conflict' then raise exception 'Stale choice accepted'; end if;
 result:=public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','score','gameId',game,'playId',gen_random_uuid(),'playerId',player,'outcome','K','runs',0,'rbi',0));
 if result->>'status' is distinct from 'accepted' then raise exception 'Rejoined strikeout failed'; end if;
 view:=public.da_read_scoring_season(team,season,'Overall');
 if (view->'board'->>player::text)::integer is distinct from 0 then raise exception 'Rejoined charge or existing credit incorrect'; end if;
 select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
 result:=public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','correct','gameId',game,'playId',opted_out_play,'playerId',player,'outcome','ITP HR','runs',1,'rbi',1,'voided',false,'reason','Synthetic captured preference correction'));
 if result->>'status' is distinct from 'accepted' then raise exception 'Historical correction failed'; end if;
 view:=public.da_read_scoring_season(team,season,'Overall');
 if (view->'board'->>player::text)::integer is distinct from 0 then raise exception 'Correction used current participation'; end if;
 select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
 result:=public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','hrLimit','gameId',game,'fenceLimit',0,'reason','Synthetic replay'));
 if result->>'status' is distinct from 'accepted' then raise exception 'HR correction failed'; end if;
 view:=public.da_read_scoring_season(team,season,'Overall');
 select x into g from jsonb_array_elements(view->'games') x where x->'game'->>'id'=game::text;
 if exists(select 1 from jsonb_array_elements(g->'evaluation'->'rows') r where r->>'beverageParticipating'='false' and (r->>'delta')::integer is distinct from 0) then raise exception 'HR replay charged opted-out play'; end if;
 begin
  perform public.da_apply_scoring_game_change(team,other_season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','complete','gameId',game));
  raise exception 'Cross-season command accepted';
 exception when sqlstate '22023' then null; end;
 execute 'reset role';
 update public.team_seasons set archived=true where id=season and team_id=team;
 execute 'set local role authenticated';
 begin
  perform public.da_apply_scoring_game_change(team,season,day,game,gen_random_uuid(),(g->>'dayRevision')::bigint,(g->>'tournamentRevision')::bigint,jsonb_build_object('type','complete','gameId',game));
  raise exception 'Archived scoring accepted';
 exception when sqlstate '55000' then null; end;
 execute 'reset role';
 update public.team_memberships set active=false where team_id=team and user_id=actor;
 execute 'set local role authenticated';
 begin
  perform public.da_read_team_beverage(team);
  raise exception 'Inactive member readable';
 exception when insufficient_privilege then null; end;
 execute 'set local role anon';
 begin
  perform public.da_read_team_beverage(team);
  raise exception 'Anonymous Beverage access';
 exception when insufficient_privilege then null; end;
 execute 'reset role';
end $$;
rollback;
