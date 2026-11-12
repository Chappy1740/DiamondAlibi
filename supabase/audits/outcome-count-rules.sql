-- Read-only audit: plays whose latest revision breaks the outcome count rules.
-- Strikeouts (K, K Looking, K Swinging, SOFO): 0 runs and 0 RBI.
-- Reached on error (ROE) and double play (DP): runs allowed, never an RBI.
-- Run under separate owner authorization. It writes nothing. Fix any row through
-- the audited correction path, which appends a revision and preserves history.
select
  latest.team_id,
  latest.day_id,
  latest.game_id,
  latest.play_id,
  latest.revision,
  latest.player_id,
  latest.outcome,
  latest.runs,
  latest.rbi,
  latest.voided
from (
  select distinct on (team_id, day_id, game_id, play_id) *
  from public.scoring_play_revisions
  order by team_id, day_id, game_id, play_id, revision desc
) latest
where (latest.outcome in ('K', 'K Looking', 'K Swinging', 'SOFO') and (latest.runs > 0 or latest.rbi > 0))
   or (latest.outcome in ('ROE', 'DP') and latest.rbi > 0)
order by latest.team_id, latest.day_id, latest.game_id, latest.play_id;
