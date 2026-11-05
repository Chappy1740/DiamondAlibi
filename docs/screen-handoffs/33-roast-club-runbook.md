# Roast Club runbook: rollback, monitoring, line removal, pilot scorecard

Written 2026-11-05. Status of the feature itself: see `31-roast-club-status.md`. This file is operations only.

## 1. Stop it fast (screen side)
Cloudflare dashboard -> Workers -> diamond-alibi-preview -> Settings -> Variables: set `ROAST_CLUB_ENABLED` to `false`.
Result: Join/Leave control hidden, no roasts shown or spoken. Set to `true` to restore. A later deploy may reset it to the value in `wrangler.jsonc` (`true`); re-check after any deploy. Nothing is lost: consent history stays in the database.

## 2. Database rollback (do NOT use unless told to)
- The migration `roast_club_consent` only ADDS two private tables and four functions. Nothing else depends on it, and the app ignores it when the switch is off. The off switch is the rollback.
- Consent history is an append-only record (update and delete are blocked by triggers). Do not delete rows.
- Full removal would be a new migration that drops the functions then the tables. That is a hosted database change and needs the owner's explicit approval.
- Restore point: check Supabase dashboard -> Database -> Backups before any hosted change. NOT verified here whether the plan has point-in-time recovery.

## 3. Monitoring for the first live game (nothing alerts automatically)
Right after the first scored game with Roast Club on, check:
1. Cloudflare Workers logs/metrics: error spikes, CPU-limit errors (Error 1102), request failures around save time. A roast adds at most one small consent read for an opted-in batter.
2. Supabase logs for errors on `da_read_roast_club` / `da_change_roast_club`.
3. Scoring still saves normally (a failed or slow save matters more than any roast).
4. Ask the scorer: did any popup show for someone who had not joined? (It must not.)
If anything is wrong: flip the off switch, then tell Claude.

## 4. Remove or change a line
Edit `ROAST_CATALOG` in `src/lib/roast-club.ts` (one `{name}` per line, 110 characters or less). The unit tests block profanity, sexual words, mental-health and body-weight words, and lines that are too long. Open a focused PR; no database change is needed. A "flag this line" button would need a new table (a migration) and is tabled until after the pilot.

## 5. Pilot scorecard (read-only SQL; run in Supabase SQL editor)
```sql
-- Who is in right now, per team (latest choice per player)
select team_id, count(*) filter (where opted_in) as joined, count(*) filter (where not opted_in) as left_club
from (select distinct on (team_id, player_id) team_id, player_id, opted_in
      from private.roast_club_consent_events order by team_id, player_id, revision desc) latest
group by team_id;
-- Every join/leave, newest first (no player names)
select created_at, team_id, opted_in, revision from private.roast_club_consent_events order by created_at desc limit 50;
```
Baseline on 2026-11-05: 0 events, 0 commands (everyone opted out).

## 6. Hosted verification record (2026-11-05, rollback-only, nothing persisted)
One transaction on the live DiamondAlibi database with synthetic users, teams and players, ended by a forced error so everything rolled back. Afterwards: 0 synthetic teams, 0 players, 0 events, 0 commands. All 16 checks held:
1. Start opted out; 2. owner opts in (revision 1); 3. replay is a duplicate; 4. same command id with other content rejected (22023); 5. teammate sees the opt-in but is not opted in themselves; 6-7. outsider on another team cannot read or change (42501); 8. outsider's own team is separate; 9. signed-out read denied (42501); 10. direct table read denied (42501); 11. deactivated member drops off the list; 12. reactivated member returns; 13. opt-out accepted (revision 2); 14. teammate then sees an empty list; 15-16. updating or deleting history is blocked (55000).
This is the real database, but synthetic accounts only. It does not test the deployed app.

## 7. Account deletion (checked 2026-11-05)
Roast Club's tables reference accounts, players and teams with the same "no action" rule as the existing scoring, beverage, membership and team tables. So Roast Club adds no new deletion blocker beyond what already exists, and the app source has no account-deletion path. If one is ever built, it must handle all of those tables together.

## 8. Tabled on purpose (owner's rule: extraordinary ideas wait for a later patch)
- Queueing back-to-back lines: current "newest line replaces the old one" was the behavior the owner tested and accepted.
- "Flag this line" button: needs a migration.
- Bluetooth first-word clipping and a screen-reader pass with a real device: need hands-on testing.
