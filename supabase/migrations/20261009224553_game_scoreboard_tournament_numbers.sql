-- LOCAL REVIEW ONLY. No existing score, inning or game order is invented/backfilled.
alter table public.scoring_games
  add column team_runs integer check (team_runs between 0 and 999),
  add column opponent_runs integer check (opponent_runs between 0 and 999),
  add column inning integer check (inning between 1 and 99),
  add column inning_half text check (inning_half in ('Top','Bottom')),
  add column tournament_game_number integer check (tournament_game_number > 0),
  add constraint complete_scoreboard_fields check (num_nonnulls(team_runs,opponent_runs,inning,inning_half) in (0,4)),
  add constraint tournament_number_context check (tournament_game_number is null or kind='Tournament'),
  add constraint unique_tournament_game_number unique(team_id,tournament_id,tournament_game_number);
-- Existing narrow RPC wrappers, grants, membership checks and lock order are unchanged.
alter table private.scoring_commands drop constraint scoring_commands_operation_check;
alter table private.scoring_commands add constraint scoring_commands_operation_check check (operation in ('start','score','correct','lineup','batter','complete','rules','bands','scoreboard'));
create or replace function private.apply_scoring_game_change(p_team uuid,p_season uuid,p_day uuid,p_game uuid,p_command uuid,p_expected bigint,p_tournament_expected bigint,p_change jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); active_member boolean; archived_season boolean;
  g public.scoring_games%rowtype; d public.scoring_game_days%rowtype;
  prior private.scoring_commands%rowtype; prior_t private.scoring_tournament_commands%rowtype;
  old_play public.scoring_play_revisions%rowtype;
  tournament_revision bigint; accepted_tournament_revision bigint;
  operation text; required_keys text[]; optional_keys text[]:='{}';
  payload jsonb; before_state jsonb; after_state jsonb;
  player uuid; play uuid; outcome text; runs integer; rbi integer; voided boolean;
  reason text; ordinal integer; lineup uuid[]; old_batter uuid; next_position integer;
  choices jsonb; new_players uuid[]; item uuid; has_band boolean; first_date date;
begin
  if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select m.active into active_member from public.team_memberships m where m.team_id=p_team and m.user_id=actor for share;
  if not found or not active_member then raise exception 'Team access denied' using errcode='42501'; end if;
  select s.archived into archived_season from public.team_seasons s where s.team_id=p_team and s.id=p_season for update;
  if not found then raise exception 'Season context unavailable' using errcode='22023'; end if;
  if archived_season then raise exception 'Archived season writes are paused' using errcode='55000'; end if;
  select * into g from public.scoring_games where (team_id,season_id,day_id,id)=(p_team,p_season,p_day,p_game);
  if not found then raise exception 'Game context unavailable' using errcode='22023'; end if;
  if g.kind='Tournament' then
    select revision into tournament_revision from public.scoring_tournaments where (team_id,season_id,id)=(p_team,p_season,g.tournament_id) for update;
  elsif p_tournament_expected is not null then raise exception 'League game has no tournament revision' using errcode='22023';
  end if;
  select * into d from public.scoring_game_days where (team_id,season_id,id)=(p_team,p_season,p_day) for update;
  select * into strict g from public.scoring_games where (team_id,season_id,day_id,id)=(p_team,p_season,p_day,p_game) for update;
  if p_command is null or p_expected is null or p_expected not between 0 and 9007199254740990
    or (g.kind='Tournament' and (p_tournament_expected is null or p_tournament_expected not between 0 and 9007199254740990))
    or p_change is null or jsonb_typeof(p_change)<>'object' or octet_length(p_change::text)>32768 then
    raise exception 'Invalid command or revision' using errcode='22023';
  end if;
  operation:=p_change->>'type';
  case operation
    when 'score' then required_keys:=array['type','gameId','playId','playerId','outcome','runs','rbi'];
    when 'correct' then required_keys:=array['type','gameId','playId','outcome','runs','rbi','voided','reason'];optional_keys:=array['playerId'];
    when 'lineup' then required_keys:=array['type','gameId','lineup'];optional_keys:=array['firstGameBands','leagueBands'];
    when 'batter' then required_keys:=array['type','gameId','playerId'];
    when 'complete' then required_keys:=array['type','gameId'];
    when 'scoreboard' then required_keys:=array['type','gameId','teamRuns','opponentRuns','inning','half','reason'];
    else raise exception 'Unrecognized game change' using errcode='22023';
  end case;
  if not p_change ?& required_keys or exists(select 1 from jsonb_object_keys(p_change) key where not key=any(required_keys || optional_keys))
    or jsonb_typeof(p_change->'gameId')<>'string' or p_change->>'gameId'<>p_game::text then
    raise exception 'Missing or unrecognized command fields' using errcode='22023';
  end if;
  payload:=p_change;
  select * into prior from private.scoring_commands where (team_id,day_id,command_id)=(p_team,p_day,p_command);
  if found then
    if prior.actor_id<>actor or prior.payload<>payload then raise exception 'Command ID reused for another change' using errcode='22023'; end if;
    return jsonb_build_object('status','accepted','duplicate',true,'revision',prior.accepted_revision,'currentRevision',d.revision,'tournamentRevision',tournament_revision);
  end if;
  if d.revision<>p_expected then return jsonb_build_object('status','conflict','revision',d.revision,'tournamentRevision',tournament_revision); end if;
  if g.kind='Tournament' then
    select * into prior_t from private.scoring_tournament_commands where (team_id,season_id,tournament_id,command_id)=(p_team,p_season,g.tournament_id,p_command);
    if found then raise exception 'Tournament command ID already used' using errcode='22023'; end if;
    if tournament_revision<>p_tournament_expected then return jsonb_build_object('status','conflict','revision',d.revision,'tournamentRevision',tournament_revision); end if;
    accepted_tournament_revision:=tournament_revision+1;
  end if;
  if operation not in ('correct','scoreboard') and g.completed then raise exception 'Game complete; use an audited correction' using errcode='55000'; end if;
  select array_agg(player_id order by position) into lineup from public.scoring_lineups where (team_id,day_id,game_id)=(p_team,p_day,p_game);
  if coalesce(cardinality(lineup),0)=0 then raise exception 'Lineup unavailable' using errcode='22023'; end if;
  before_state:=jsonb_build_object('game',to_jsonb(g),'lineup',to_jsonb(lineup));
  if operation='scoreboard' then
    if jsonb_typeof(p_change->'teamRuns') is distinct from 'number' or jsonb_typeof(p_change->'opponentRuns') is distinct from 'number'
      or jsonb_typeof(p_change->'inning') is distinct from 'number' or jsonb_typeof(p_change->'half') is distinct from 'string'
      or (p_change->>'teamRuns')!~'^[0-9]{1,3}$' or (p_change->>'opponentRuns')!~'^[0-9]{1,3}$'
      or (p_change->>'inning')!~'^[1-9][0-9]?$' or p_change->>'half' not in ('Top','Bottom')
      or jsonb_typeof(p_change->'reason') is distinct from 'string' or char_length(trim(p_change->>'reason')) not between 1 and 200
    then raise exception 'Explicit whole scores, inning, half and reason required' using errcode='22023'; end if;
    reason:=trim(p_change->>'reason');
  elsif operation in ('score','correct') then
    if jsonb_typeof(p_change->'playId')<>'string' or jsonb_typeof(p_change->'outcome')<>'string'
      or jsonb_typeof(p_change->'runs')<>'number' or jsonb_typeof(p_change->'rbi')<>'number'
      or (p_change->>'runs')!~'^[0-4]$' or (p_change->>'rbi')!~'^[0-4]$' then raise exception 'Invalid play counts' using errcode='22023'; end if;
    play:=(p_change->>'playId')::uuid; outcome:=p_change->>'outcome';runs:=(p_change->>'runs')::integer;rbi:=(p_change->>'rbi')::integer;
    if play is null or outcome not in ('Hit','BB','HBP','ROE','K','Out','SF','Fence HR','ITP HR') or rbi>runs
      or (outcome in ('Fence HR','ITP HR') and runs<1) then raise exception 'Invalid play outcome' using errcode='22023'; end if;
    if operation='correct' then
      if jsonb_typeof(p_change->'voided')<>'boolean' or jsonb_typeof(p_change->'reason')<>'string'
        or char_length(trim(p_change->>'reason')) not between 1 and 200 then raise exception 'Explicit void status and correction reason required' using errcode='22023'; end if;
      select * into old_play from public.scoring_play_revisions where (team_id,day_id,game_id,play_id)=(p_team,p_day,p_game,play) order by revision desc limit 1;
      if not found then raise exception 'Play context unavailable' using errcode='22023'; end if;
      if p_change ? 'playerId' then
        if jsonb_typeof(p_change->'playerId')<>'string' then raise exception 'Invalid player' using errcode='22023'; end if;
        player:=(p_change->>'playerId')::uuid;
      else player:=old_play.player_id; end if;
      voided:=(p_change->>'voided')::boolean; reason:=p_change->>'reason';
      before_state:=before_state || jsonb_build_object('play',to_jsonb(old_play));
    else
      if jsonb_typeof(p_change->'playerId')<>'string' then raise exception 'Invalid player' using errcode='22023'; end if;
      player:=(p_change->>'playerId')::uuid;voided:=false;
      if player is null or player is distinct from lineup[g.next_batter_position+1] then raise exception 'Next batter changed; review before scoring' using errcode='22023'; end if;
      if exists(select 1 from public.scoring_plays where id=play) then raise exception 'Play ID already used' using errcode='22023'; end if;
      select coalesce(max(s.ordinal)+1,0) into ordinal from public.scoring_plays s where (s.team_id,s.day_id,s.game_id)=(p_team,p_day,p_game);
    end if;
    if player is null or not exists(select 1 from public.team_players where team_id=p_team and id=player) then raise exception 'Player context unavailable' using errcode='22023'; end if;
    if g.kind='Tournament' and not exists(select 1 from public.scoring_tournament_bands where (team_id,season_id,tournament_id,player_id)=(p_team,p_season,g.tournament_id,player)) then
      raise exception 'Reconcile first tournament participation before historical batter correction' using errcode='22023';
    end if;
  elsif operation='batter' then
    if jsonb_typeof(p_change->'playerId')<>'string' then raise exception 'Invalid player' using errcode='22023'; end if;
    player:=(p_change->>'playerId')::uuid;
    if player is null or not player=any(lineup) then raise exception 'Batter must be in lineup' using errcode='22023'; end if;
  elsif operation='lineup' then
    old_batter:=lineup[g.next_batter_position+1];
    if jsonb_typeof(p_change->'lineup')<>'array' or jsonb_array_length(p_change->'lineup') not between 1 and 100
      or exists(select 1 from jsonb_array_elements(p_change->'lineup') e where jsonb_typeof(e)<>'string') then raise exception 'Invalid lineup' using errcode='22023'; end if;
    select array_agg(value::uuid order by n) into lineup from jsonb_array_elements_text(p_change->'lineup') with ordinality x(value,n);
    if cardinality(lineup)<>(select count(distinct u) from unnest(lineup) u) or exists(select 1 from unnest(lineup) u where not exists(select 1 from public.team_players where team_id=p_team and id=u)) then raise exception 'Choose unique team roster players' using errcode='22023'; end if;
    if g.kind='Tournament' then
      if p_change ? 'leagueBands' then raise exception 'League Bands cannot apply to tournament' using errcode='22023'; end if;
      choices:=coalesce(p_change->'firstGameBands','{}');
      select coalesce(array_agg(u),'{}'::uuid[]) into new_players from unnest(lineup) u where not exists(select 1 from public.scoring_tournament_bands where (team_id,season_id,tournament_id,player_id)=(p_team,p_season,g.tournament_id,u));
      -- Backfilled first participation must not silently change assignment origin.
      if exists(select 1 from public.scoring_tournament_bands b join public.scoring_game_days first_day on first_day.id=b.first_day_id where b.team_id=p_team and b.season_id=p_season and b.tournament_id=g.tournament_id and b.player_id=any(lineup) and first_day.played_on>d.played_on) then raise exception 'Historical first participation requires reconciliation' using errcode='22023'; end if;
    else
      if p_change ? 'firstGameBands' then raise exception 'Tournament Bands cannot apply to league' using errcode='22023'; end if;
      choices:=coalesce(p_change->'leagueBands','{}');
      if jsonb_typeof(choices)='object' and exists(select 1 from jsonb_each(choices) e where e.value='true'::jsonb) then raise exception 'HR Bands are tournament-only' using errcode='22023'; end if;
      select coalesce(array_agg(u),'{}'::uuid[]) into new_players from unnest(lineup) u where not exists(select 1 from public.scoring_game_players where (team_id,day_id,game_id,player_id)=(p_team,p_day,p_game,u));
    end if;
    if jsonb_typeof(choices)<>'object' then raise exception 'Explicit new-player Band choices required' using errcode='22023'; end if;
    if (select count(*) from jsonb_object_keys(choices))<>cardinality(new_players)
      or exists(select 1 from unnest(new_players) u where not choices ? u::text or jsonb_typeof(choices->u::text)<>'boolean') then raise exception 'Choose Band or no Band for each new player; existing assignments stay fixed' using errcode='22023'; end if;
  end if;
  insert into private.scoring_commands(team_id,day_id,command_id,actor_id,expected_revision,accepted_revision,operation,payload)
    values(p_team,p_day,p_command,actor,p_expected,p_expected+1,operation,payload);
  if g.kind='Tournament' then
    insert into private.scoring_tournament_commands(team_id,season_id,tournament_id,command_id,actor_id,expected_revision,accepted_revision,payload)
      values(p_team,p_season,g.tournament_id,p_command,actor,p_tournament_expected,accepted_tournament_revision,payload);
    update public.scoring_tournaments set revision=accepted_tournament_revision where (team_id,season_id,id)=(p_team,p_season,g.tournament_id);
  end if;
  if operation in ('score','correct') then
    insert into public.scoring_game_players values(p_team,p_day,p_game,player) on conflict do nothing;
    if operation='score' then insert into public.scoring_plays values(play,p_team,p_day,p_game,ordinal); end if;
    insert into public.scoring_play_revisions(team_id,day_id,game_id,play_id,command_id,revision,player_id,outcome,runs,rbi,voided,reason)
      values(p_team,p_day,p_game,play,p_command,p_expected+1,player,outcome,runs,rbi,voided,reason);
    if operation='score' then update public.scoring_games set next_batter_position=(g.next_batter_position+1)%cardinality(lineup) where id=p_game; end if;
    after_state:=jsonb_build_object('playId',play,'playerId',player,'outcome',outcome,'runs',runs,'rbi',rbi,'voided',voided);
  elsif operation='scoreboard' then
    update public.scoring_games set team_runs=(p_change->>'teamRuns')::integer,opponent_runs=(p_change->>'opponentRuns')::integer,
      inning=(p_change->>'inning')::integer,inning_half=p_change->>'half' where id=p_game;
  elsif operation='complete' then update public.scoring_games set completed=true where id=p_game;
  elsif operation='batter' then update public.scoring_games set next_batter_position=array_position(lineup,player)-1 where id=p_game;
  elsif operation='lineup' then
    insert into public.scoring_game_players select p_team,p_day,p_game,u from unnest(lineup) u on conflict do nothing;
    foreach item in array new_players loop
      has_band:=(choices->>item::text)::boolean;
      if g.kind='Tournament' then insert into public.scoring_tournament_bands(team_id,season_id,tournament_id,player_id,first_day_id,first_game_id,has_band,assigned_by) values(p_team,p_season,g.tournament_id,item,p_day,p_game,has_band,actor);
      elsif has_band then insert into public.scoring_bands values(p_team,p_day,p_game,item); end if;
    end loop;
    delete from public.scoring_lineups where (team_id,day_id,game_id)=(p_team,p_day,p_game);
    insert into public.scoring_lineups select p_team,p_day,p_game,u,n-1 from unnest(lineup) with ordinality x(u,n);
    update public.scoring_games set next_batter_position=coalesce(array_position(lineup,old_batter)-1,0) where id=p_game;
  end if;
  select * into strict g from public.scoring_games where id=p_game;
  after_state:=coalesce(after_state,'{}') || jsonb_build_object('game',to_jsonb(g),'lineup',to_jsonb(lineup),'newAssignments',choices);
  insert into private.scoring_audit values(p_team,p_day,p_command,before_state,after_state,reason);
  update public.scoring_game_days set revision=p_expected+1 where id=p_day;
  perform private.scoring_game_evaluation(p_team,p_day,p_game);
  return jsonb_build_object('status','accepted','duplicate',false,'revision',p_expected+1,'currentRevision',p_expected+1,'tournamentRevision',accepted_tournament_revision);
end $$;


create or replace function private.start_scoring_game(p_team uuid,p_season uuid,p_day uuid,p_date date,p_tournament uuid,p_command uuid,p_expected bigint,p_tournament_expected bigint,p_setup jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid(); member_active boolean; archived_season boolean;
  d public.scoring_game_days%rowtype; prior private.scoring_commands%rowtype;
  r public.scoring_rule_versions%rowtype; tournament_revision bigint;
  game_id uuid; lineup uuid[]; player uuid; newcomers uuid[]; chosen jsonb; board jsonb; rule jsonb;
  rule_id uuid; rule_label text; kind text; payload jsonb; opponent text; key text; game_number integer;
begin
  if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select active into member_active from public.team_memberships where team_id=p_team and user_id=actor for share;
  if not found or not member_active then raise exception 'Team access denied' using errcode='42501'; end if;
  select archived into archived_season from public.team_seasons where team_id=p_team and id=p_season for update;
  if not found then raise exception 'Season context unavailable' using errcode='22023'; end if;
  if archived_season then raise exception 'Archived season writes are paused' using errcode='55000'; end if;
  if p_command is null or p_day is null or p_date is null or p_expected is null or p_expected not between 0 and 9007199254740990
    or p_setup is null or jsonb_typeof(p_setup)<>'object' or octet_length(p_setup::text)>32768
    or not p_setup ?& array['type','gameId','opponent','kind','lineup','rules','bands']
    or exists(select 1 from jsonb_object_keys(p_setup) k where not k=any(array['type','gameId','opponent','kind','lineup','rules','bands'])) then
    raise exception 'Invalid game setup fields or revision' using errcode='22023';
  end if;
  if p_setup->>'type' is distinct from 'start' or jsonb_typeof(p_setup->'gameId')<>'string'
    or jsonb_typeof(p_setup->'opponent')<>'string' or char_length(trim(p_setup->>'opponent')) not between 1 and 200
    or jsonb_typeof(p_setup->'kind')<>'string' or p_setup->>'kind' not in ('League','Tournament') then raise exception 'Invalid game setup' using errcode='22023'; end if;
  game_id:=(p_setup->>'gameId')::uuid;kind:=p_setup->>'kind';opponent:=trim(p_setup->>'opponent');
  if game_id is null then raise exception 'Game ID required' using errcode='22023'; end if;
  if kind='Tournament' then
    if p_tournament is null or p_tournament_expected is null or p_tournament_expected not between 0 and 9007199254740990 then raise exception 'Tournament context and revision required' using errcode='22023'; end if;
    select revision into tournament_revision from public.scoring_tournaments where (team_id,season_id,id)=(p_team,p_season,p_tournament) for update;
    if not found then raise exception 'Tournament context unavailable' using errcode='22023'; end if;
  elsif p_tournament is not null or p_tournament_expected is not null then raise exception 'League game has no tournament context' using errcode='22023'; end if;
  select * into d from public.scoring_game_days where id=p_day for update;
  if found then
    if d.team_id<>p_team or d.season_id<>p_season or d.played_on<>p_date then raise exception 'Game-day context mismatch' using errcode='22023'; end if;
  elsif p_expected<>0 then return jsonb_build_object('status','conflict','revision',0,'tournamentRevision',tournament_revision);
  end if;
  payload:=p_setup || jsonb_build_object('dayId',p_day,'playedOn',p_date,'tournamentId',p_tournament);
  select * into prior from private.scoring_commands where (team_id,day_id,command_id)=(p_team,p_day,p_command);
  if found then
    if prior.actor_id<>actor or prior.payload<>payload then raise exception 'Command ID reused for another setup' using errcode='22023'; end if;
    return jsonb_build_object('status','accepted','duplicate',true,'revision',prior.accepted_revision,'currentRevision',d.revision,'tournamentRevision',tournament_revision);
  end if;
  if coalesce(d.revision,0)<>p_expected or (kind='Tournament' and tournament_revision<>p_tournament_expected) then return jsonb_build_object('status','conflict','revision',coalesce(d.revision,0),'tournamentRevision',tournament_revision); end if;
  if exists(select 1 from public.scoring_games where id=game_id) then raise exception 'Game ID already used' using errcode='22023'; end if;
  if kind='Tournament' and exists(select 1 from private.scoring_tournament_commands where (team_id,season_id,tournament_id,command_id)=(p_team,p_season,p_tournament,p_command)) then raise exception 'Tournament command ID already used' using errcode='22023'; end if;
  if jsonb_typeof(p_setup->'lineup')<>'array' or jsonb_array_length(p_setup->'lineup') not between 1 and 100
    or exists(select 1 from jsonb_array_elements(p_setup->'lineup') e where jsonb_typeof(e)<>'string') then raise exception 'Invalid lineup' using errcode='22023'; end if;
  select array_agg(value::uuid order by n) into lineup from jsonb_array_elements_text(p_setup->'lineup') with ordinality x(value,n);
  if cardinality(lineup)<>(select count(distinct u) from unnest(lineup) u) or exists(select 1 from unnest(lineup) u where not exists(select 1 from public.team_players where team_id=p_team and id=u)) then raise exception 'Choose unique team roster players' using errcode='22023'; end if;
  chosen:=p_setup->'bands';rule:=p_setup->'rules';
  if jsonb_typeof(rule)<>'object' or not rule ?& array['version','fenceLimit','board']
    or exists(select 1 from jsonb_object_keys(rule) k where not k=any(array['version','fenceLimit','board'])) then raise exception 'Explicit rule version required' using errcode='22023'; end if;
  board:=rule->'board';rule_label:=rule->>'version';
  if jsonb_typeof(rule->'version')<>'string' or char_length(trim(rule_label)) not between 1 and 200
    or jsonb_typeof(rule->'fenceLimit')<>'number' or (rule->>'fenceLimit')!~'^[0-9]{1,3}$' or (rule->>'fenceLimit')::integer>100
    or jsonb_typeof(board)<>'object' or not board ?& array['strikeout','solo','bandSolo','grandSlam','overLimit','insidePark','multiRun']
    or exists(select 1 from jsonb_object_keys(board) k where not k=any(array['strikeout','solo','bandSolo','grandSlam','overLimit','insidePark','multiRun'])) then raise exception 'Invalid explicit rules' using errcode='22023'; end if;
  foreach key in array array['strikeout','solo','bandSolo','grandSlam','overLimit','insidePark','multiRun'] loop
    if jsonb_typeof(board->key)<>'number' or (board->>key)!~'^-?[0-9]{1,3}$' or abs((board->>key)::integer)>100 then raise exception 'Invalid Board adjustment' using errcode='22023'; end if;
  end loop;
  if kind='Tournament' then
    select coalesce(array_agg(u),'{}'::uuid[]) into newcomers from unnest(lineup) u where not exists(select 1 from public.scoring_tournament_bands where (team_id,season_id,tournament_id,player_id)=(p_team,p_season,p_tournament,u));
    if exists(select 1 from public.scoring_tournament_bands b join public.scoring_game_days first_day on first_day.id=b.first_day_id where b.team_id=p_team and b.season_id=p_season and b.tournament_id=p_tournament and b.player_id=any(lineup) and first_day.played_on>p_date) then raise exception 'Historical first participation requires reconciliation' using errcode='22023'; end if;
  else newcomers:=lineup; end if;
  if jsonb_typeof(chosen)<>'object' then raise exception 'Explicit Band choices required' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(chosen))<>cardinality(newcomers)
    or exists(select 1 from unnest(newcomers) u where not chosen ? u::text or jsonb_typeof(chosen->u::text)<>'boolean') then raise exception 'Choose Band or no Band for newcomers; retain existing assignments' using errcode='22023'; end if;
  if kind='League' and exists(select 1 from jsonb_each(chosen) e where e.value='true'::jsonb) then raise exception 'HR Bands are tournament-only' using errcode='22023'; end if;
  if d.id is null then insert into public.scoring_game_days(id,team_id,season_id,played_on,created_by) values(p_day,p_team,p_season,p_date,actor); end if;
  select * into r from public.scoring_rule_versions where team_id=p_team and day_id=p_day and version_label=rule_label;
  if found then
    if (r.fence_limit,r.strikeout,r.solo,r.band_solo,r.grand_slam,r.over_limit,r.inside_park,r.multi_run) is distinct from
      ((rule->>'fenceLimit')::integer,(board->>'strikeout')::integer,(board->>'solo')::integer,(board->>'bandSolo')::integer,(board->>'grandSlam')::integer,(board->>'overLimit')::integer,(board->>'insidePark')::integer,(board->>'multiRun')::integer) then raise exception 'Rule version already has different values' using errcode='22023'; end if;
    rule_id:=r.id;
  else
    insert into public.scoring_rule_versions(team_id,day_id,version_label,fence_limit,strikeout,solo,band_solo,grand_slam,over_limit,inside_park,multi_run,created_by)
      values(p_team,p_day,rule_label,(rule->>'fenceLimit')::integer,(board->>'strikeout')::integer,(board->>'solo')::integer,(board->>'bandSolo')::integer,(board->>'grandSlam')::integer,(board->>'overLimit')::integer,(board->>'insidePark')::integer,(board->>'multiRun')::integer,actor) returning id into rule_id;
  end if;
  insert into private.scoring_commands(team_id,day_id,command_id,actor_id,expected_revision,accepted_revision,operation,payload) values(p_team,p_day,p_command,actor,p_expected,p_expected+1,'start',payload);
  if kind='Tournament' then
    insert into private.scoring_tournament_commands(team_id,season_id,tournament_id,command_id,actor_id,expected_revision,accepted_revision,payload) values(p_team,p_season,p_tournament,p_command,actor,p_tournament_expected,p_tournament_expected+1,payload);
    update public.scoring_tournaments set revision=p_tournament_expected+1 where (team_id,season_id,id)=(p_team,p_season,p_tournament);
  end if;
  -- Existing tournament row lock serializes numbering across days; no bracket eligibility is inferred.
  if kind='Tournament' then select count(*)+1 into game_number from public.scoring_games where team_id=p_team and season_id=p_season and tournament_id=p_tournament; end if;
  insert into public.scoring_games(id,team_id,day_id,season_id,tournament_id,rules_id,opponent,kind,tournament_game_number)
    values(game_id,p_team,p_day,p_season,p_tournament,rule_id,opponent,kind,game_number);
  insert into public.scoring_game_players select p_team,p_day,game_id,u from unnest(lineup) u;
  insert into public.scoring_lineups select p_team,p_day,game_id,u,n-1 from unnest(lineup) with ordinality x(u,n);
  foreach player in array newcomers loop
    if kind='Tournament' then insert into public.scoring_tournament_bands(team_id,season_id,tournament_id,player_id,first_day_id,first_game_id,has_band,assigned_by) values(p_team,p_season,p_tournament,player,p_day,game_id,(chosen->>player::text)::boolean,actor);
    elsif (chosen->>player::text)::boolean then insert into public.scoring_bands values(p_team,p_day,game_id,player); end if;
  end loop;
  insert into private.scoring_audit values(p_team,p_day,p_command,'{}',jsonb_build_object('gameId',game_id,'rulesId',rule_id,'lineup',to_jsonb(lineup),'firstAssignments',chosen),null);
  update public.scoring_game_days set revision=p_expected+1 where id=p_day;
  return jsonb_build_object('status','accepted','duplicate',false,'revision',p_expected+1,'currentRevision',p_expected+1,'tournamentRevision',case when kind='Tournament' then p_tournament_expected+1 else null end);
end $$;
