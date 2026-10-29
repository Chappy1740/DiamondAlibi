# 09 — Game details and history: Screen handoff

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** Game details and history.
**Route/view:** `/club/score?team=<id>&season=<id>&game=<existing-game-id>&manage=1`
**Related tracker IDs:** M3-5, M3-14, M3-16. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Game details and history only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Selected game's saved seven-rule disclosure, plate appearances, per-play Beverage adjustment, scoped audit and existing correction controls.

## What must remain correct

The saved-rule display exists in PR #11/main 4790f19 and must use current.rules, not today's team defaults. It may be absent on an older live version. Keep setup forms, league creation, game switching and season-wide statistics out of this view. No correction/finalization as a display test.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/connected-scorebook.tsx`
- `src/components/saved-game-rules.tsx`
- `src/components/scorebook-audit.tsx`
- `src/components/game-hr-limit.tsx`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check all seven signed values, zero and Unavailable, version label, distinct original-versus-current-default fixture, only selected-game history/relevant Band audit, Back to scoring, narrow layouts and read-only disclosure behavior.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/game-day-review-browser.cjs`
- `tests/scorebook-modes-browser.cjs`
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

## Game details navigation — October 28, 2026

Owner brief: returning from details/history to scoring requires too much navigation. The existing small top link scrolls away. Reuse the existing validated selected-game route and native Next.js links: a sticky Game navigation bar provides a prominent Back to scoring button and a Games shortcut, preserving team/season and the exact game for scoring. No new dependency, scoring change, data write or schema change.

Baseline: fresh GitHub main `2d09b3be41d9d3a79ed240922132f72d865ae82b` (PR #30). Compared every tracked snapshot file to the remote Git tree before editing; only the pre-existing `next-env.d.ts` differed. This cloud snapshot has no Git metadata; do not describe it as a checked-out branch. Preserve that generated-file edit.

Files: `src/app/club/score/page.tsx`, scoped navigation styles in `src/app/globals.css`, `tests/scorebook-modes-browser.cjs`, and this receipt. Existing scoring/setup modes retain their links. Return links use the already-authorized game, not arbitrary redirect input. Keyboard scrolling reserves space above controls for the sticky navigation.

Stage: locally verified, unpublished. Passed typecheck and the existing synthetic Chromium scorebook-modes suite, including league/tournament exact return destinations, Games context, sticky visible/hit-testable 44px targets after scrolling through audit/history at 320/390/430/800/1440px, keyboard activation returning to the same game's scoring controls, and zero scoring writes on navigation. Inspected the 390px local screenshot. Existing scoring, setup, retry/offline, isolation and audit regressions also pass. No real game modified. Automated WebKit, production build, hosted and physical-device acceptance remain pending; no milestone closed.

Owner authorized commit, push and deployment on October 28, 2026 in response to the explicit commit/push/merge-after-checks/automatic-deployment request. Publication is in progress; merge remains gated on required exact-source CI. Revert only this four-file diff against the verified baseline; preserve earlier local work. Physical-phone navigation acceptance remains a separate final check.
