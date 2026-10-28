# 07 — New-game setup: Screen handoff

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** New-game setup.
**Route/view:** `/club/score?team=<id>&season=<id>&setup=1[&tournament=<id> or &league=<id>]`
**Related tracker IDs:** M3-5, M3-12, M3-14. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **New-game setup only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing first-game and continuation setup: opponent/date, lineup/manual mode, HR limit and Bands as applicable.

## What must remain correct

Do not make continuation repeat saved setup unnecessarily. Preserve saved date, tournament Bands, lineup/manual semantics, team defaults and server-side validation. Opening a draft is not approval to start a hosted game.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/app/club/score/page.tsx`
- `src/components/connected-scorebook.tsx`
- `src/components/tournament-next-game.tsx`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check first versus next game, ordered versus manual, newcomer Band choices, saved HR limit, numeric/date containment, validation errors, archived/missing context, and cancellation. Hosted Start Game requires a named synthetic write case.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

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


## Navigation fix — October 28, 2026

Owner requested fewer clicks: Games lists the selected season’s games immediately with Add game; saving team rules from setup returns to that setup. Personal statistics scope does not hide games; an explicit selected league still filters the list. Source baseline: GitHub main b9b2153659bfe838323f3f093e05221309154764, freshly verified against the cloud snapshot.

Reuse: CompactGameList, existing authorized snapshot, setup form and beverage save/readback. No product dependency, schema, scoring or rule-policy change. Return destinations are restricted to the local setup route and current team/season; no automatic return on uncertain, failed or conflict save. Archived/sample/review creation stays unavailable.

Stage: locally verified; owner authorized commit and push on October 28, 2026. Merge and deployment are not authorized by that approval. Pinned dependencies restored with owner authorization; package/lockfile unchanged. Passed: seven focused unit tests; authorized dashboard-loader regression; Chromium Games/accessibility/320–1440px, Beverage controls including confirmed save/uncertain retry return, and scorebook/setup isolation/context regressions; typecheck and production Worker build. The browser ran in isolated Chromium 153 after the pinned Playwright Chromium download returned a truncated archive. WebKit and real-device/hosted acceptance remain pending; required PR CI must pass before merge. Original next-env.d.ts edit preserved after build. No hosted writes, credentials, provider settings or tracker milestones changed.

Review: the navigation-only patch can be applied to the verified source baseline; revert only these scoped changes. Commit/push is owner-authorized; merge/deployment still requires separate explicit scope authorization under CONTRIBUTING.md.
