# 11 — Beverage Board: Screen handoff

## November 6, 2026 — Display Zoom follow-up (#77)

**Release receipt for PR #81 (Claude, verified):** PR checks `validate` and
Workers Builds passed on `f673b40`; merged as
`3bd9b9d5bf726108932705590eca88aa39d00eca` (12:24 CT); main validation run
42269573338 passed; Cloudflare deployment 523cf9cc put Worker
`567593f6-6195-421d-b9cf-c4411016b207` at 100% ("Validated main 3bd9b9d").
Rollback target: `1f396086`.

**Owner phone check (12:35 CT):** live on Will's iPhone, but every
"No recorded balance" wrapped to two lines and about 8 players fit. Row
heights (47 and 61 px) match the 320 px layout, so the phone uses iPhone
Display Zoom. PR #81's 360 px rule capped balances at 7.5em even beside
short names.

**Owner direction (12:39 CT):** "make it 0 so there doesn't have any words.
Zero is the default no owed or credited."

**Change on `claude/beverage-board-zoom`:** the shared Beverage balance label
shows a plain `0` when nothing is owed or credited, including no recorded
activity (was "No recorded balance" or "Settled · 0"). It appears in Team
balances, Your balance and the Home "Beverage Board" line. The Home BEVs tile
keeps its own `—` for a missing balance. At 360 px and narrower, a balance
shrinks and wraps only when a long name needs the room.

**Evidence (Claude, local, Chromium):** synthetic short-name roster at
320×693: 12 players visible below the heading, no wrapped names or
balances. TypeScript passed. Long-name roster unchanged at 390×844 (14) and 375×667 (10).
`tests/home-layout-browser.cjs` adds a `short-roster` fixture, a 320×693
check and the `0` wording check; it passes on this change, and the 320×693
check fails on the PR #81 CSS.

**Approval:** Will approved push, PR and merge of this follow-up PR only
(2026-11-06 12:42 CT, "Approve and merge"). Merge runs the existing
validation and deploy gate. No database, auth, access or provider change.

**Rung:** Implemented and tested locally. Merge only after PR checks pass.
Owner acceptance on Will's iPhone is open.

## November 6, 2026 — Team balances density (#77)

**Owner direction:** Will told Claude "Fix 77" (06:19 CT). Role swap for this
task: Claude implements on `claude/beverage-board-density`; Codex or Will
reviews. Targets from [#77](https://github.com/Chappy1740/DiamondAlibi/issues/77):
10–12 players visible on iPhone (8–10 minimum), readable long names.

**Change (CSS only, Team balances list only):** names 22 px → 17 px bold;
balances stay 14 px and never wrap; rows 12 px tall padding with a 44 px
minimum; names align with the card heading; names wrap only between words
(hyphenate if one word cannot fit). At 360 px and narrower, a long balance
may wrap between words. Other leaderboards are unchanged.

**Evidence (Claude, local sandbox, synthetic 16-player roster, Chromium only):**
players fully visible below the Team balances heading went 9 → 14 at
390×844, 6 → 10 at 375×667, 5 → 7 at 320×568. Mid-word splits ("3 owe d",
"No recorded balance" on two lines) are gone. `tests/home-layout-browser.cjs`
gained a `dense-roster` fixture and checks; it passes on the change and fails
on the old CSS. WebKit was not available locally; CI runs this test in
Chromium and WebKit. Not tested on a real iPhone.

**Approval:** Will approved push, PR and merge of this change only
(2026-11-06 12:11 CT, "Approve and merge"). Merge to main runs the existing
exact-source validation and deploy gate. No database, auth, access or
provider change is in scope.

**Rung:** Implemented and tested locally. Merge only after PR checks pass.
Owner acceptance on the pilot iPhone is open.

## November 5, 2026 — Clubhouse Extras pilot candidate

The [profile menu](17-profile.md#november-5-2026--clubhouse-extras-pilot-candidate)
opens the separate participation page. The Beverage tab shows balances.

## November 5, 2026 — Roster typography

Will's phone screenshot showed small player names and oversized balance text.
On the local `codex/beverage-roster-type` branch, the roster uses the existing
22 px size for names and 14 px body size for balances. Codex checked Chromium
and WebKit at 320–1440 px with long names, owed and credit balances, zero, and
missing balances. TypeScript passed. Will approved publishing and deploying
this typography change. Next is PR validation and release through the
existing main build.

## November 5, 2026 — Balance view and profile preferences

Will approved using the bottom **Beverage** tab to view balances for the
selected team and season. It shows the signed-in player's balance first and
then the roster. Team and season are selectable. Totals combine league and
tournament play. Beverage participation and Roast Club opt-in are under
[Bio & profile → Team preferences](17-profile.md#november-5-2026--team-participation-preferences).

## Historical screen brief

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** Beverage Board.
**Route/view:** `/beverages`
**Related tracker IDs:** M3-14, M4-22. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Beverage Board only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing balances, credits, participation indicators and scope selection.

## What must remain correct

Positive owed and negative credit must remain distinguishable. Preserve historical corrections/opt-out boundaries and authoritative selected-scope totals. Do not confuse this board with editing team rules.

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

Check owed/credit/zero, no activity, League/Tournament/Overall and season switches, selected-player/team meaning, readable signs, no stale context and no implied balance reset.

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

**Current outcome:** Documentation prepared only. No screen implementation, new acceptance pass or live release is claimed by this work package.
