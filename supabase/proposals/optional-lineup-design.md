# Optional lineup and named-player scoring

Design proposal, October 13, 2026. This is not an applied migration or an implemented feature. Live schema changes require the owner's specific approval after the executable migration and security tests are ready.

## Normal scoring

The game, team and season are selected once on entry. With a saved lineup, display the next batter and advance after a confirmed play. Without a lineup, select the existing roster player or resolve a spoken player name, then save that player's result. Do not require batting positions or a next-batter override for each play. All authorized team members may score; coach/captain designation does not grant exclusive scoring rights.

The scoring view contains the player, result, counts when needed, and save status. Scoreboard, HR corrections, lineup administration and audited history belong on a separate game-details page. Voice capture and the full quick-save interaction remain M3-11 and M3-10 work; this proposal must not be presented as delivered voice or one-tap scoring.

## Existing restriction

`da_start_scoring_game` currently requires a nonempty lineup. `da_apply_scoring_game_change` rejects a missing lineup, requires the submitted player to equal the next batter, and advances the lineup after scoring. `tournamentContinuation` also rejects an empty lineup. Removing a front-end dropdown cannot provide genuine no-lineup scoring.

## Required schema and command changes

1. Add `public.scoring_games.batting_mode`, constrained to `ordered` or `manual`, defaulting to `ordered`. Existing games retain their order, next position, rule versions and history.
2. Extend the existing start command's setup JSON with an explicit batting mode. Old clients retain ordered behavior. Ordered games still require a valid, unique, scoped lineup; manual games may start with an empty lineup. An empty ordered lineup remains an error, never an implicit fallback.
3. Extend the existing score command within the existing transaction. Determine mode from the locked stored game, not a client override. Ordered mode keeps the next-batter check and advancement. Manual mode accepts the explicit team-roster player ID and does not advance an invented batting order.
4. Register only the actual manual participant in `scoring_game_players` atomically with the accepted play. Do not assign all roster players to a fabricated order, claim guest history by name, or mark bench players as participants merely to satisfy the current RPC.
5. For a tournament player's first participation, require an explicit Band choice if no fixed assignment exists. Establish that assignment in the same transaction as participation and scoring; reuse an existing fixed assignment. Preserve historical-date reconciliation, tournament replay and reasoned Band corrections. Do not infer Band status.
6. Expose the stored mode in the authorized scorebook DTO. Manual mode has no derived next batter. Mode-aware continuation carries manual mode and Beverage rules into Game 2 while using the saved competition HR limit and resetting each game's HR usage. It must not demand a fabricated carried lineup.
7. Adding or changing a lineup uses an audited command, retaining prior participants and plays. A mode change after scoring requires an explicit reason and next batter for the new ordered lineup. Existing completed-game protections and correction rules remain intact.

No new outcome vocabulary, scoring formula, user account, authentication role, storage service or audio persistence is required by optional-lineup scoring. Name/voice input resolves against the selected authorized roster and submits player IDs. Duplicate or unknown names require an explicit resolution; they cannot silently select a player, create an account or claim records.

## Security and reliability review

Preserve existing public invoker/private privileged RPC architecture, fixed search paths, membership checks, team/season/game validation, archived-season and completed-game protections, and restricted execute grants. Do not add table write grants or relax RLS. Membership comes from the verified session and existing membership tables; display names and editable profile metadata never authorize a write.

Player selection and play creation must be one atomic command. Preserve existing lock ordering, expected day/tournament revisions, stable command/play IDs, duplicate-retry fingerprints and server-owned audit identity/time. Concurrent clients must get an explicit conflict instead of a silently reassigned batter. A failed or ambiguous save must not show Saved; a retry cannot duplicate the play.

## Required validation before live approval

Use disposable SQL and isolated synthetic fixtures to verify: old ordered games unchanged; a genuinely empty manual lineup; two roster players recorded in arbitrary order and repeated turns; first-participation Bands; Game 2 mode/rules/Bands and HR reset; cross-team/season denial; former-player corrections; noncaptain and guest scoring; completed/archived denial; concurrent writers; retries and mismatched command IDs; unchanged stats, Beverage credits, replay and audit.

Add actual React tests for selecting a player without opening an override menu, preserving counts/drafts through refresh, disabled/conflict/uncertain states, and moving administration out of the at-bat view. Voice requires separate supported-device and privacy validation. Require hosted iPhone acceptance for both ordered and manual modes; M3-5, M3-10, M3-11 and M3-12 remain incomplete until their own checks and acceptance are recorded.

Implement the model/RPC changes and executable migration in a reviewable branch, run the tests and advisors, then request approval for that specific live migration. Do not apply this design to the live project or mutate the owner's records during preparation.


## Executable review and release gate

`optional_lineups.sql` is an unapplied, transactional proposal. It adds only constrained `scoring_games.batting_mode` (existing rows default ordered), then replaces three reviewed private functions. Hash preflight refuses an unexpected live definition. Public wrappers, ACLs, RLS, authentication, membership/season checks and lock/revision/retry/audit behavior are retained. No scorer privilege depends on captain designation.

Disposable PostgreSQL tests match the current live function hashes, then exercise manual/ordered scoring, atomic first Bands, fixed assignments, arbitrary scoped players/guests, historical denial, Game 2 HR reset/Band carry, completed corrections, replay/negative credits, stale commands, idempotent retries, changed fingerprints, cross-team/season denial, archived-write denial, legacy ordered setup and unchanged grants. Browser tests cover quick saves, count resets, named results, recognition duplicate finals, permission fallback and late offline results. Native speech is opt-in and may use the browser speech provider; the app stores no audio or raw transcript. Real iPhone acceptance remains required.

Read-only Supabase advisor baseline on 2026-10-13: security INFO for intentional deny-by-default private/RPC tables and review_feedback; existing WARN for leaked-password protection disabled ([remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). Performance INFO reports five unindexed foreign keys and four unused indexes ([foreign-key guidance](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)). These predate this proposal; no auth/index changes are included.

Specific owner approval is required before applying this proposal live. The published UI uses the authorized snapshot capability flag, so existing schema remains ordered-compatible until application. Apply once through tracked migration history after approval, verify unchanged policies/grants/advisors and both scoring modes with isolated synthetic data. Roll back UI behavior by removing the capability flag first; retain play/participant/history records and the mode column rather than erasing manual game state.
