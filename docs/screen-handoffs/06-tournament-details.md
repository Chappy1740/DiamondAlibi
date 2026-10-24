# 06 — Tournament details: Screen handoff

**Status:** Tournament detail changes locally verified; final owner/device acceptance pending. **Requested change:** Tournament-only stats matching the overall layout, and a separate Tournament settings button.
**Current screen only:** Tournament details.
**Route/view:** `/tournaments/<existing-tournament-id>`
**Related tracker IDs:** M3-5, M3-13, M4-26. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Tournament details only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Selected tournament's games, category leaders and next-game entry.

## What must remain correct

Keep tournament-only statistics, signed Beverage totals, shared rank ties and minimum guarantee semantics. Championship/progression decisions remain proposals until approved.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/competition-page.tsx`
- `src/components/tournament-next-game.tsx`
- `src/components/tournament-leaderboard.tsx`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check existing Game 1/2/3 links without adding Game 4, date/grouping, next-game number, selected stat rankings, empty and archived cases, and no arbitrary guarantee cap.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

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

The selected tournament shows its own compact games, team totals and player leaders. Tournament settings opens a separate view using the existing connected form; sample settings are static read-only metadata. Gross BEVs owed and negative credits are calculated from effective recorded plays; incomplete detail stays unavailable. Different fictional tournaments contain different coherent plays and totals.

- Baseline: main `42ecc95a75622a47dbf03ffd8dd88c1ecb877715`; delivery branch `codex/games-simple-preview`. Commit/push and owner email are authorized. Merge, upload and activation remain separate approval steps.
- Verification: production Worker build and isolated unit/SQL/browser checks. Chromium and automated WebKit cover Games, Home, shared scorebook, beverage controls and built sample-route navigation, including 320–1440px, context, signed values, keyboard/touch and accessibility. All test writes use disposable databases or synthetic transports.
- Limits: no hosted data mutation, schema/auth/access change, Explore Mode implementation or payment integration. Automated WebKit does not establish physical iPhone acceptance. Connected multi-device acceptance and Error 1102/capacity remain open; no tracker milestone was closed.
- Reuse: existing route adapters, CompetitionPage/Form, authoritative scoring totals, baseball-rate formatter and PlayerLeaderboard. A small CompactGameList and summary projection avoid duplicating save/auth logic or adding a UI dependency.
- Review/revert: inspect the branch PR before merge; revert only this scoped change if needed. Preserve unrelated local work. No database rollback is needed.
