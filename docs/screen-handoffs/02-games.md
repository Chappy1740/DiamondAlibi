# 02 — Games: Screen handoff

## November 3 H2 — Games cleanup and clickable cards

Stage: Tested locally; prepared for the owner-authorized draft PR. No merge or
release. Exact PR number, review-head SHA and final CI links are recorded in the
H2 draft PR's UAT receipt after publication; they are unknown at this checkpoint.

Owner approved H2 only, then chose "Two across on phones; three on
tablet/desktop" after requesting clickable cards without Enter buttons. This
supersedes the October 28 immediate-list requirement for this candidate. Remote
main was refreshed to `07e68783081b3c3439be5903abb7904432cbef33`, whose release
record includes work through PR #46 and explicitly excludes H4. Git ancestry
confirms H3 is included. H2 is isolated on `codex/h2-games-cleanup`, based on H4
`14bea97aed53b4a22ba6fb7ec738b76b8ead5efb` / draft PR #47. Its draft targets H4
so the review diff contains H2 only. H4 remains draft/unmerged; reconcile the
stack with main and run normal release checks before separately approved delivery.
This work does not change another branch, release worktree or hosted environment.

### Delivered behavior and reuse

Games starts with League, Tournament and Add game when creation is permitted.
The closed Choose team or league dialog sits below the options, using Home's
bordered control treatment. Existing native links, GameContextPicker and setup
helpers preserve context, Cancel/Escape, active-game resume and read-only or
archived restrictions. No new state, request, dependency or scoring workflow.

League and Tournament views reuse CompactGameList. Each visible game card is
one native link; tapping its padding, clicking its text or using keyboard Enter
opens the same game. There is no separate Enter button. The link retains a
meaningful opponent/date/status name, saved score and first-game start time,
with a visible focus outline. The grid has two columns below 640px and three
from 640px upward, 12px padding and gaps, existing 14px body/22px score tokens,
full opponent names and at least 44px touch targets. Saved zero and unavailable
scores retain their meanings. Tournament selection cards are unchanged.

### Verification

Passed locally: typecheck, test:browser, test:connected-scorebook,
test:practice-season, and Games flow in Chromium and WebKit. Regression checks
cover the arrival arrangement, picker below options at 320–1440px, two/three
columns, no extra Enter button, exact game/context URL from keyboard and card
padding, focus outline, accessibility, long/unbroken names, enlarged text,
three-digit/zero/unavailable scores, context/isolation, empty/archived/sample
states and tournament continuation. Tournament start-time browser suites passed
both engines. All test identities, transport and database records were disposable
or synthetic; no hosted test was run.

A WebKit-only card containment failure was found and fixed by removing an
unnecessary nested grid from the list item. Final tests measure content against
the clickable card's own bounds. Chromium review screenshots were inspected.
Screenshots/logs remain ignored local artifacts, not proof of physical-device
acceptance. Existing pinned dependencies and installed browsers were reused.
The generated next-env edit is excluded from delivery.

### Files and UAT A4 retest

Changed files: src/components/player-dashboard.tsx,
src/components/compact-game-list.tsx, src/app/globals.css,
tests/games-flow-browser.cjs, tests/dashboard-browser.cjs,
tests/personal-pages-browser.cjs, and this matching handoff.

1. Review the H2 candidate, not the unchanged live site. Open Games in a writable
   synthetic team/season: League, Tournament, Add game, then the context button;
   no immediate game list. Sample/review/archived contexts cannot add games.
2. Choose League. In the synthetic fixture expect three cards: 12–8 Final,
   0–0 Live, and 7–10 Final. At 320/390px expect two across; at 800px expect three.
   Names and scores stay inside their cards, with no Enter buttons.
3. Tap the Live card or its padding; verify the correct game/team/season opens.
   On laptop, Tab must visibly outline the card and Enter must open that game.
4. Return to Games, choose Tournament, open a tournament game and return.
   Existing add/continuation links and Game 1's saved start time must remain.
5. Cancel/Escape the context dialog: no context change, trigger focus restored.
   Apply another team/season/league: return to the same compact Games choices.

Known gaps: real phone, hosted authenticated, cross-device and deployment
acceptance remain unverified. Built personal-pages expectation was updated;
normal Linux CI must verify it before delivery. No tracker milestone closed.
Highest rung is Tested, never Owner-accepted. Database migration: none.
Deployed: not deployed.

Approval used: owner-approved H2 as its own draft PR, plus the explicit
clickable-card and two-phone/three-wider layout choice. No merge, deploy,
migration, hosted test, provider change, new dependency or H5–H8 work approved.
Next owner item: review H2's draft and retest A4 on its exact candidate.
Revert only the H2 diff relative to H4 if needed; no data rollback.

Continuity GREEN: evidence and scope are verified. Finish the exact-head draft
receipt, then stop. A new chat is not needed; no live release is claimed.

**Status:** Games layout locally reviewed; publication preparation complete. **Requested change:** Games begins with League and Tournament choices; records appear only after a choice.
**Current screen only:** Games.
**Route/view:** `/games`
**Related tracker IDs:** M3-5, M3-9. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Games only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing game cards, game status and links into the selected team's season/competition.

## What must remain correct

Keep team-wide activity here rather than on personal Home. Preserve selected context and existing games; no implicit create/complete/delete operation.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/player-dashboard.tsx`
- `src/app/dashboard-loader.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check empty/history/live/completed games, League/Tournament navigation, selected game accuracy, long opponent names, archived season, sample mode, and return to the same scope.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/personal-workflow-browser.cjs`
- `tests/personal-pages-browser.cjs`

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

Games entry uses native links and a closed context selector. Shared CompactGameList shows opponent, saved team-first score, Live/Final and Enter. Missing scores stay unavailable. Existing creation, scoring, navigation and authorization are reused.

- Baseline: main `42ecc95a75622a47dbf03ffd8dd88c1ecb877715`; delivery branch `codex/games-simple-preview`. Commit/push and owner email are authorized. Merge, upload and activation remain separate approval steps.
- Verification: production Worker build and isolated unit/SQL/browser checks. Chromium and automated WebKit cover Games, Home, shared scorebook, beverage controls and built sample-route navigation, including 320–1440px, context, signed values, keyboard/touch and accessibility. All test writes use disposable databases or synthetic transports.
- Limits: no hosted data mutation, schema/auth/access change, Explore Mode implementation or payment integration. Automated WebKit does not establish physical iPhone acceptance. Connected multi-device acceptance and Error 1102/capacity remain open; no tracker milestone was closed.
- Reuse: existing route adapters, CompetitionPage/Form, authoritative scoring totals, baseball-rate formatter and PlayerLeaderboard. A small CompactGameList and summary projection avoid duplicating save/auth logic or adding a UI dependency.
- Review/revert: inspect the branch PR before merge; revert only this scoped change if needed. Preserve unrelated local work. No database rollback is needed.

## Explore Mode audit continuation (design only)

| Screen | Classification | Reuse / fictional records | Anonymous and mutation boundary | Navigation gaps |
|---|---|---|---|---|
| Games choice | Needs Demo Data | Existing dashboard/context; fictional team and season | Existing sample rendering is anonymous; full Explore API/database denial still unverified | One-tap Try the Demo, persistent Demo Mode identity and Exit Demo pending |
| League list | Needs Demo Data | Compact game list; final/live/empty records and saved scores | Existing sample history is read-only; dedicated command-denial acceptance needed | Preserve demo/team/season/game context |
| Tournament list/detail | Needs Demo Data | Existing cards, game list, summary and player rankings; distinct tournaments and realistic stats | Static sample settings; disabled creation is not proof of every API mutation boundary | Consistent demo label, exit and hierarchy needed |
| Create/edit competition | Not Suitable for Demo | Keep authenticated production form | Mutations must remain denied by API/database in Explore Mode | Explain the read-only limit without a false save |

Sequence: establish isolated fictional read access and authoritative mutation denial; reuse these production views with complete fictional data; add one-tap entry, labeling and exit; verify anonymous mobile navigation and rejected commands before February 1, 2027. Beverage Board and Alibi Generator still need their own screen audits. This receipt covers only the current Games-related screens, not the entire app audit. Proposed $19.99/team/season remains unvalidated; no payments are implemented.

## Team/league picker refinement — October 24, 2026

Status: implementation and focused verification complete; owner authorized commit, push and PR publication for this refinement. Merge and deployment remain separate. Baseline is released main `044b5e230383ba542c73d0ee46426d6bda772795` / PR #19 / active version efc53693. Preserve that release while reviewing this change.

Replace the Games team/season disclosure with a clear Choose team or league button. Its native modal lists active-membership teams and their seasons/leagues. Use selection returns to Games; the owner then chooses League or Tournament. Cancel/Escape does not apply drafts. Switching teams/seasons clears the previous league. A selected league narrows the compact League list; Tournament retains the chosen team/season and its existing flow. No game or competition is created by selecting context.

Reuse decision: existing authorized dashboard loader, paginated metadata reader, DashboardSelect, native dialog pattern and CompetitionPage. Two lightweight, membership-filtered metadata reads supply the Games-only chooser; other teams' scorebooks are not loaded. No new package, API, schema/RLS/auth policy or save workflow. Invalid team/league selection and failed directory reads fail closed.

Passed locally: Worker build/typecheck; authorized-loader regression including active/foreign/inactive teams, mixed metadata and read errors; Chromium/WebKit Games modal, context and League filtering; shared Home, scorebook and built sample-route regressions. Synthetic data only. Physical iPhone and connected hosted acceptance are pending for this refinement. Explore Mode classification remains Needs Demo Data; no Explore implementation or payment work.

Additional local acceptance: a 27-team synthetic directory, long unbroken names, and doubled modal text remain horizontally contained at 320×568 and 640×320. Keyboard selection reaches the last team; both actions remain reachable by scrolling; Cancel preserves context and restores focus. Chromium and WebKit passed. Focus assertions now wait for the native dialog close event. This simulated text enlargement is not physical-iPhone Dynamic Type acceptance. No production component changes were needed for these additional cases.


## Game-box spacing refinement — October 24, 2026

Owner requested all game information fit comfortably in its boxes, with team name then score, consistently for League and Tournament views. Baseline: released main 8fbf2dbb2357ad0fa511d9139bf9d74389121734 / PR #21 / version 03c88f77. Delivery branch: codex/game-card-spacing. Owner explicitly authorized commit, push, merge and deployment of this box-layout refinement; verify matching checks and release build before activation.

Reuse CompactGameList and the existing tournament entry card styles. Team/opponent name and saved score now have separate lines, readable type, increased inner padding and content-sized height. The Enter control wraps below the text when space is limited. Tournament list cards use matching padding and wrapping. No new package, data reads/writes, scoring formula, context or authentication change; recorded zero and unavailable scores retain their meaning.

Verification: typecheck and Worker build; Chromium/WebKit Games/League/Tournament flows, accessibility and context checks; text/button containment with inner spacing at 320–1440px, long unbroken names, three-digit scores and doubled card text. Built Next.js route/navigation checks also passed in Chromium and WebKit. Synthetic preview only; physical iPhone/hosted acceptance pending. Publication and deployment are owner-authorized; final delivery receipts remain required.

Review artifacts include complete League game boxes, Tournament game boxes and Tournament list cards. Existing signed BEVs/statistics and immutable rule behavior are unchanged. No milestone closed.


## Navigation fix — October 28, 2026

Owner requested fewer clicks: Games lists the selected season’s games immediately with Add game; saving team rules from setup returns to that setup. Personal statistics scope does not hide games; an explicit selected league still filters the list. Source baseline: GitHub main b9b2153659bfe838323f3f093e05221309154764, freshly verified against the cloud snapshot.

Reuse: CompactGameList, existing authorized snapshot, setup form and beverage save/readback. No product dependency, schema, scoring or rule-policy change. Return destinations are restricted to the local setup route and current team/season; no automatic return on uncertain, failed or conflict save. Archived/sample/review creation stays unavailable.

Stage: locally verified; owner authorized commit and push on October 28, 2026. Merge and deployment are not authorized by that approval. Pinned dependencies restored with owner authorization; package/lockfile unchanged. Passed: seven focused unit tests; authorized dashboard-loader regression; Chromium Games/accessibility/320–1440px, Beverage controls including confirmed save/uncertain retry return, and scorebook/setup isolation/context regressions; typecheck and production Worker build. The browser ran in isolated Chromium 153 after the pinned Playwright Chromium download returned a truncated archive. WebKit and real-device/hosted acceptance remain pending; required PR CI must pass before merge. Original next-env.d.ts edit preserved after build. No hosted writes, credentials, provider settings or tracker milestones changed.

Review: the navigation-only patch can be applied to the verified source baseline; revert only these scoped changes. Commit/push is owner-authorized; merge/deployment still requires separate explicit scope authorization under CONTRIBUTING.md.
