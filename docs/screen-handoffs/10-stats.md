# 10 — Stats: Screen handoff

## November 3, 2026 — H3 tie wording

Owner phone feedback after #50: **"the stats look good"**, then requested amount followed by **Tied**, e.g. Hits 12 Tied. This accepts the count–leader card appearance as owner-reported evidence; it does not close broader Stats/pilot acceptance. Compact Stats summaries now read **12 – Tied**, replacing the number of tied players such as "2 tied". The identifying circle, actual amount, full individual rankings and Back focus remain. League/Tournament default summaries retain their existing wording.

Branch `codex/stats-tied-label`, from deployed main `4452beadb6f7a83f459a518db91f464f6a185a46` / #50, active Worker prefix `90f2bf8a` at the prior verification. Reuse the existing summary conditional; no new component, state, request, calculation or dependency. Continue the existing H3 presentation commit/push/merge/deployment authorization for this phone-UAT refinement only. H2 #49/H4 #47 remain separate drafts, excluded; no migration, hosted write/test, auth/access/provider change or new email is included.

**Stage at this source snapshot: Tested locally; full CI, merge, activation and owner tie-label acceptance pending.** Fresh Codex checks: TypeScript, whitespace, 22 tracker/leaderboard tests, Home/Stats Chromium and WebKit. The synthetic tie case asserts **12 – Tied**, then opens Hits to verify both named players still show 12 and Back restores focus. Existing 320–1440px, wide signed BEV, full names, keyboard and accessibility checks pass. Installed dependencies/browsers reused. Completion receipt: the PR for `codex/stats-tied-label`, linked by this handoff, `00-WORKING-STANDARD.md`, `RELEASE-READINESS.md` and tracker revision 80, records exact-source CI and active Worker/build evidence. Next: gated delivery, then owner refreshes Stats and checks a tied category. Revert only this wording diff if needed; no database rollback. Continuity GREEN; continue this chat.

## November 3, 2026 — H3 phone follow-up: count – leader

Owner phone feedback: the circle already identifies HR, BEV and each other category, so the card must read **count – leader**. Stats now opts into the existing PlayerLeaderboard's compact summary: circle, then the unbroken value, separator and full leader name. The repeated category caption is removed. The nine-category/two-column layout, tied-leader indication, signed BEV credit/owed note, unknown-value warnings, rankings and keyboard focus remain. Values no longer occupy the old fixed 44px column below the circle. Long names wrap inside the remaining text space.

Reuse decision: extend the existing summary rendering with an optional compact-summary prop and native inline text; no new renderer, state, calculation, data request or dependency. Only Stats opts in; League/Tournament retain their existing default summary and ranking markup/layout. H2 #49 and H4 #47 remain separate drafts and are excluded from this correction.

Branch `codex/stats-count-leader`, based on deployed main `07e68783081b3c3439be5903abb7904432cbef33` / release PR #48. The owner's follow-up refines H3 during phone UAT; delivery continues the existing H3 commit/push/publication/deployment authorization in this chat. No migration, hosted test/write, provider/access/auth change, new dependency or other H-item implementation is included.

**Stage at this source snapshot: Tested locally; full CI, merge and delivery verification pending.** Codex freshly passed typecheck, 22 tracker/leaderboard checks, Home/Stats Chromium and WebKit at 320/390/800/1440px, plus the Chromium shared scorebook/competition suite. Tests check count-before-name text, sole badge category label, counts beside the circle, numeric containment, long names, -12345 scoped BEV credit, all nine categories/two columns, 44px targets, unknowns, keyboard/Back focus and accessibility. Synthetic 390px and wide-value 320px screenshots were visually checked; installed dependencies/browsers reused. No real-phone acceptance is claimed.

Built-page follow-up: first CI exposed horizontal overflow from the new long release identifier in `/status` at 320px. Project-status paragraphs now wrap long identifiers; no overflow assertion is loosened. The existing built-page assertion now reports its route and width. An isolated webpack build with hosted database settings blank and the full built-route suite freshly passed in both Chromium and WebKit, covering 320–1440px, shared navigation/context and all sample/review/status/auth-entry routes. No package or build configuration changed.

Completion receipt: the PR for `codex/stats-count-leader` records exact head/main validation and active Worker/build/traffic evidence, linked by this handoff, `00-WORKING-STANDARD.md`, `RELEASE-READINESS.md` and tracker revision 79. Next: normal exact-source release checks, then owner refreshes Stats on the existing protected phone site and checks that every card reads circle → count – leader. Prior compatible release is #48 / main `07e6878`, Worker prefix `1fde797e` at its verified 100% traffic observation. Revert only this presentation diff if necessary; no database rollback. Continuity GREEN; continue this chat through the scoped correction.

**November 3 release update:** owner now authorizes publishing, merging and deploying H3 #46 with H1 #45 and the pending documentation through #46. H4 #47 remains excluded. See [current release handoff and completion receipt](00-WORKING-STANDARD.md#november-3-2026--uat-release-through-pr-46) and the release PR for `codex/uat-release-through-pr46` for actual source/check/activation state. Physical-phone acceptance, including realistic numeric width and the hidden tap hint, remains open; the original draft-only boundary below is historical.

## November 3, 2026 — H3 compact Stats (owner-approved draft scope)

**Stage: Tested locally; owner acceptance pending.** Same H3 branch/baseline/limits and full receipt as [01-home.md](01-home.md). Owner approved Home/Stats compaction and removal of "SO includes looking, swinging, and SOFO strikeouts." only, as one H3 draft. H1 remains a separate draft; no H2/H4–H8, merge, deployment, hosted test, migration or dependency change.

Stats reuses the existing nine category leaders and all single-stat rankings. A `workspace--stats` class scopes the two-column category grid, compact names/counts and ranking spacing to /stats. Every category, full player name, unknown historical value, tied rank, signed Beverage amount, scope control and existing keyboard focus behavior remains. Numeric values stay on one line. The fixture's summary takes less vertical space than nine prior 64px rows, without clipping controls or names.

The SO explanatory paragraph is removed from the shared PlayerLeaderboard as expressly requested, also affecting League/Tournament consumers. Their card/ranking layouts and team-summary fonts retain their prior styling; their existing automated suites remain in required CI. Warnings for unknown historical hit/DP counts remain, since missing data must not appear as zero. No formula, sort/ranking policy, correction, rule version, save path, participation or balance changed.

Local Chromium/WebKit checks cover sample/connected Stats, nine categories, two columns at 320/390/800/1440px, full names and values, reduced height, keyboard category entry/Back focus and WCAG checks. Existing sample dashboard test also passes against loopback sample pages, retaining season/scope/Board checks. Unit and Home evidence are in 01-home.md. Physical iPhone, owner acceptance, merge/deployment remain open. Exact-head full CI/publication receipts are recorded in the H3 draft PR.

Older dated Stats briefs below remain historical; broader tracker/release recovery notes stay local/unpushed.

**Status:** Shared BEV behavior verified; broader Stats audit remains open. **Requested change:** Keep signed BEVs and lead with the highest positive amount owed.
**Current screen only:** Stats.
**Route/view:** `/stats`
**Related tracker IDs:** M3-13, M4-20, M4-22. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Stats only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing scoped rankings, statistics categories and team/season/competition selectors.

## What must remain correct

Retain established formulas, unrounded ranking and ties. Career rankings and cross-team aggregation require an explicit policy decision; do not adopt a proposal through UI cleanup.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/player-dashboard.tsx`
- `src/app/dashboard-loader.ts`
- `src/lib/personal-dashboard.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check League/Tournament/Overall, old/current season, empty and tied data, signed Beverage totals, one-stat views, long names, keyboard selection and totals reconciled with existing scorebook fixtures.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/personal-dashboard.test.ts`
- `tests/personal-pages-browser.cjs`
- `tests/connected-scorebook-browser.cjs`

Inspect each script's actual coverage and execution target first. These references do not claim all acceptance is already covered. Reuse focused checks; add a new regression only for meaningful uncovered changed behavior. Complete required CI before specifically approved delivery. Do not install or upgrade dependencies just to review the screen.

## Brief to complete with the owner

- Requested change, in their words: **Pending**.
- Desired visible result / screenshot reference: **Pending**.
- Existing behavior to retain: the screen contract and preservation rules above.
- Data or policy decisions needed: inspect first; flag only real dependencies.
- Review device: identify computer, real iPhone or both.
- Review version and navigation entry/exit: record explicitly.
- Scope exclusions or adjacent changes: state before implementation if material.

Do not invent preferences or adopt a larger feature proposal merely to fill this brief.

## Safe execution and approval boundaries

Continue authorized read-only inspection and reversible local work for the agreed screen. Preserve all unrelated local changes. Do not republish changes already merged.

Specific approval is required for commits, pushes/PRs, merge/deployment, live schema/auth/access changes, new services or paid actions. No hosted account/game/play/rule/invite mutation or test email is implied by a display review. Keep credentials/OTP and private records out of artifacts.

A green build or inactive upload is not a live release. Preserve required checks and Access. Never activate a version or weaken protections to make this screen review easier.

## Completion receipt — fill after the work, not now

1. Owner brief and exact delivered change.
2. Files changed; shared consumers checked.
3. Exact source/review target; focused validation links/results.
4. Desktop and real iPhone evidence separately; failures/untested limits.
5. Commit/branch/PR/merged SHA, if authorized; otherwise say local-only.
6. Candidate upload and actual active traffic, if relevant; activation approval.
7. Existing tracker evidence update status; no whole-milestone claim from a narrow check.
8. Scoped revert/rollback and stop conditions.
9. Owner acceptance or explicit hold; agreed next screen.

**Current outcome:** The receipt below supersedes the initial preparation status. No hosted release is claimed.

## Delivery receipt — October 24, 2026

Main Stats and tournament leaders reuse the same descending ranking function. Positive means owed, negative means credit, zero means settled. Matching Tournament scope produces identical per-player balances; Overall also includes League plays. Fictional preview fixtures contain nine owed, two credit and one settled player; real balances were not altered.

- Baseline: main `42ecc95a75622a47dbf03ffd8dd88c1ecb877715`; delivery branch `codex/games-simple-preview`. Commit/push and owner email are authorized. Merge, upload and activation remain separate approval steps.
- Verification: production Worker build and isolated unit/SQL/browser checks. Chromium and automated WebKit cover Games, Home, shared scorebook, beverage controls and built sample-route navigation, including 320–1440px, context, signed values, keyboard/touch and accessibility. All test writes use disposable databases or synthetic transports.
- Limits: no hosted data mutation, schema/auth/access change, Explore Mode implementation or payment integration. Automated WebKit does not establish physical iPhone acceptance. Connected multi-device acceptance and Error 1102/capacity remain open; no tracker milestone was closed.
- Reuse: existing route adapters, CompetitionPage/Form, authoritative scoring totals, baseball-rate formatter and PlayerLeaderboard. A small CompactGameList and summary projection avoid duplicating save/auth logic or adding a UI dependency.
- Review/revert: inspect the branch PR before merge; revert only this scoped change if needed. Preserve unrelated local work. No database rollback is needed.


### Extended outcome leaderboard preparation — October 26, 2026

Owner expanded the functional outcome request to all Stats leaderboards, then grouped looking/swinging/SOFO under combined SO. Reuse PlayerLeaderboard and existing authorized/scoped game projections for seven categories: the five established categories plus SO and batter DP. SO uses the engine's authoritative K total, including legacy unspecified strikeouts; scoring choices/rules remain distinct for correct BEVs. Highest occurrence count first, shared ties, unrecorded historic DP unranked. Preserve authoritative BEV totals, most-owed-first order, rates and all team/season/competition boundaries. No new queries/dependency/career aggregation/Explore/Home tile redesign. Local branch codex/strikeout-types-double-play, baseline main62e3968. See ../extended-outcomes-review.md for full review, migration, verification and release/rollback scope. Local-only; hosted migration/commit/push/deploy and physical acceptance remain pending. Canonical tracker unchanged.
