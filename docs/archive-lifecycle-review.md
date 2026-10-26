# Reversible season and tournament archive — release review

## Owner-selected behavior
Archive hides an entry from the active list and allows Restore. Games, rules, statistics and signed BEV history are retained. No hard-delete or cascade is introduced. One lifecycle feature spans the existing season and tournament screens; the unpublished SO/scoring work is preserved.

## Existing behavior reused
Seasons already use the member-authorized da_archive_season RPC. Extract the existing Seasons UI into SeasonManager, show active seasons separately from collapsed Archived seasons, and add named confirmation/Cancel before Archive/Restore. Clear a matching browser season cookie after a confirmed archive and revalidate the existing page/layout. Historical seasons remain deliberately selectable as history and their existing write denial remains.

Tournaments reuse the existing team/season snapshot, competition settings, revision locks and private immutable command journal. Add Archive/Restore in Tournament settings, plus a collapsed Archived tournaments list linking to retained history. The normal tournament list and new-game chooser omit archived tournaments. Archived detail/game views remain readable and offer no Add Game/scoring writes. Live scorer polling pauses for archived tournaments. Restoring a tournament does not reset games, Bands, saved rules, completion or balances. Parent archived seasons must be restored first.

## Database boundary
Unapplied migration supabase/migrations/20261026183312_season_tournament_archive.sql:
- One non-null tournament archived flag, default false; no historical row deletion or default team-rule replacement.
- Membership-checked archive RPC with established season/tournament lock order, expected revision, stable command identity, immutable before/after-state payload and audit event. Ordinary current members match existing season/competition management; captain tags add no access.
- Anonymous execution and direct writes denied. No RLS weakening or new table access.
- Database guards block start/game/play/revision/lineup/Band/default mutations while archived, including stale clients calling existing RPCs. Other competitions remain writable. Existing public scoring RPC signatures stay unchanged.
- Existing authorized read exposes archived metadata/capability without removing history/totals. A function-hash guard and transaction reject unexpected source drift before schema changes.

Source/live metadata: catalog-only hosted SELECT confirms existing season archive RPC, no tournament archived column yet, and read_scoring_season definition hash183bd19b34ebbe0f2ca675f1e29dd8b1 matches the baseline. No personal game/player records read and no hosted writes.

## Verification
Typecheck and 105 units passed (including the preserved outcome/SO work). Disposable SQL passed with and without the unapplied extended-outcomes migration: history/totals retention, every write path denied while archived, other competitions unaffected, restore, duplicate/stale/late retry, parent season and member/revoked/anonymous/direct-write cases. Migration drift rejection/rollback passed.

Chromium and WebKit archive controls, confirmation/cancel/keyboard, active/history visibility, unchanged readable games, uncertain same-ID retry, stale conflict, offline/parent/sample/unsupported states and320–1440px containment passed. Scorer mode archive pause/zero polling and new-game filtering passed in both engines. Existing Games/League/Tournament flow passed. A Safari offline assertion was changed to await the React status update; empty-list wording is preserved when there are no archives. Worker build passed with existing Windows/experimental middleware warnings. Built route/shared navigation checks passed in Chromium and WebKit. Physical iPhone/laptop handoff remains pending.

## Release scope
The owner approved publication, both reviewed database migrations and deployment on October 26, 2026. At review time, no season or tournament had been archived/restored and no real record had changed. Protected CI, guarded migrations and hosted read-only verification remain required for delivery. No account/team/roster creation, emails, auth/Access changes, package installation, payment or Explore implementation.

Archive migration is compatible independently and alongside extended-outcome rules; review and run required CI before approved delivery, recheck guarded live definitions, apply only the approved migration(s), check security advisors/grants, then activate only the checked matching app version. Verify hosted controls read-only; a hosted write rehearsal needs a named synthetic case. After archive states exist, use an archive-aware compatible app for rollback/forward fixes; an older UI may ignore archived flags even though database guards prevent writes. Do not delete columns/history or auto-restore entries to bypass a failed release.

Explore audit: archive mutations are Not Suitable for Demo. Reusable read-only active/archive lists need clearly fictional history data and explicit Demo/Exit labeling; anonymous mutation denial remains enforced at database/API boundaries. No demo feature was implemented. Canonical tracker unchanged.
