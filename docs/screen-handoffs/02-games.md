# 02 — Games: Screen handoff

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
