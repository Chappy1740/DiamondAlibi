# Extended batting outcomes — release review

## Result and reuse
Add distinct K Looking, K Swinging, SOFO and batter DP records. Positive BEV settings default to 2, 2, 1 and 1 respectively in the expanded editor; the creator can edit them before saving. Full mobile labels accompany K, backward K, SOFO and DP symbols. The three strikeout outcomes count toward the existing K total. A double play records one batter appearance, with the configured charge on that batter.

Reuse the existing outcome picker, scoring command/receipt pipeline, versioned rules, creator-only editor and SQL evaluation. A new dependency or parallel scoring subsystem is unnecessary. No package, auth, membership, Access or payment changes.

## Compatibility
The original seven-key board and generic K retain their existing values. Extended settings require all four explicit amounts; old games with no extended rules retain their original controls and reject new outcome writes. Saved rules disclose new values only when present. New rules are applied only after explicit creator save and captured on new games; no historical rules or team defaults are rewritten by migration.

Corrections/voids, participation boundaries, replay/HR-limit corrections, tournament Band assignments, authoritative totals, stable retry IDs and team isolation remain enforced. Unspecified typed strikeouts on an extended game require a subtype rather than guessing. Saved new settings carry through continuation, including zero; incomplete extended snapshots fail closed.

## Database change
Unapplied migration: supabase/migrations/20261026175817_strikeout_types_double_play.sql. Adds four nullable bounded rule-version columns with all-or-none constraint; expands allowed saved outcomes; updates existing private validators/start/evaluation/change/read functions; adds one pure private serialization helper without client execution grants. Existing RLS and public wrapper ACLs remain intact. A transaction and six current-definition hash guards reject drift before any schema change.

## Verification
- Typecheck, whitespace check, 103 unit checks.
- Disposable PostgreSQL migration and old-game replay; four charges and K/PA/AB totals, creator/member/anonymous/revoked access, no direct writes, immutable defaults/history, same-ID retry, corrected subtype, void, opt-out/rejoin, HR-rule-copy preservation, migration drift/rollback.
- Existing manager and team Beverage SQL suites and connected UI/SQL regression.
- Chromium and WebKit scorebook/setup/continuation, rule-editor and game-day regression, including new labels, payloads, saved-rule disclosure, explicit voice subtype, legacy fallback, and 320–1440px containment/targets.
- Cloudflare Worker build completed. Existing Windows/experimental middleware warnings remain.
- Read-only hosted catalog check: all six function definition hashes match the local baseline; touched tables have RLS enabled; new columns are not applied. No hosted records were read or written for this check.

## Release sequence and limits
Prepared and verified locally. At review time, no hosted migration, team-rule update, game creation, player/account change, push or deployment had been performed. Physical iPhone and sequential laptop/phone scoring acceptance remain pending.

After explicit publication/database/deployment approval: commit exact reviewed files, protected PR and exact-head CI; recheck the live function guards, apply the reviewed additive migration; pass security-advisor/catalog checks; merge and verify main validation and matching inactive upload; activate the compatible app; confirm hosted read-only controls; separately authorize a named synthetic hosted scoring case. Do not configure real team rules or write live plays merely to review layout.

Rollback: before extended settings/plays exist, prior app remains compatible with additive nullable schema. After extended records exist, use a compatible corrected app release; do not roll back to an app that cannot understand the new rules/outcomes. Retain database columns, history and receipts; no destructive down migration or default reset.

The existing canonical tracker is unchanged. Explore remains audit-only; live scoring mutations are not suitable for anonymous Demo Mode. November tournament readiness, physical handoff and resource-limit/capacity acceptance remain separate.

## Shared leaderboard scope — October 26
The functional outcome support applies across all production Stats and leaderboard consumers. At the owner's refinement, PlayerLeaderboard offers seven categories: existing OBP/Hits/HR/RBI/BEVs plus combined SO and batter DP. SO includes looking, swinging and SOFO, using the existing authoritative total K; historical generic K is included without guessing its subtype. The scoring choices remain separate to capture the correct editable BEV amount. Home compact tiles stay unchanged.

The same authorized projection feeds selected-season Overall/League/Tournament Stats, all-league and individual league leaders, all-tournament and individual tournament leaders. DP counts use current effective server-evaluated rows, indexed once per projection; corrections/voids are honored, and opting out of BEVs does not remove baseball counts. New BEV charges flow through authoritative board totals and existing most-owed-first ranking. SO and DP rank highest occurrences first with shared ties and known zero retained.

No additional database columns or queries are needed for rankings. Unrecorded legacy double plays or incomplete DP projections remain unavailable/unranked (—), without changing old baseball totals or BEVs. SO remains available from existing K totals even when subtype history is absent. The migration and four distinct saved outcome/rule fields remain required for future accurate recording and BEV evaluation.

Unit cases cover every scope, isolated competition IDs, combined SO including all three subtypes and historical K, ties/zero, corrected/voided DP, and missing evaluations. Browser cases cover seven shared categories, exact combined SO counts, separate DP, narrow layouts and Back focus. Both engines' Home and scoring-mode suites pass, alongside typecheck, 103 units and Worker build. Physical-device acceptance remains pending. The earlier four-category/nine-row draft is superseded; preview leaderboards-so.png is current.

The owner approved publication, both reviewed database migrations and deployment on October 26, 2026. Delivery must still pass protected PR/main CI, migration guards and hosted read-only verification.
