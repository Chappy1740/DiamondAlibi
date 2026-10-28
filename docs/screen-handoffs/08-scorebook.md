# 08 — Live scorebook: Screen handoff

**Current status (October 27):** PR #27's Home/full-roster release is activated. New slow-pitch hit-type work is locally verified and owner approved for publication, deployment and its database migration; release in progress. **Current owner request:** remove HBP and add doubles/triples for tracking.
**Current screen only:** Live scorebook.
**Route/view:** `/club/score?team=<id>&season=<id>&game=<existing-game-id>`
**Related tracker IDs:** M3-10, M3-11, M3-12, M4-16, M4-28, M5-5. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Live scorebook only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Selected batter, outcomes, runs/RBI, Saved/uncertain states, voice entry, scoreboard and Game details link.

## What must remain correct

Preserve all scoring formulas, HR/Band limits, participation, command IDs, retries, team isolation and member scoring access. Do not alter tap-to-save behavior as a cosmetic change. Voice-result confirmation is a proposal, not automatically adopted policy.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/connected-scorebook.tsx`
- `src/components/batting-outcome-picker.tsx`
- `src/components/voice-play-entry.tsx`
- `src/components/game-scoreboard.tsx`
- `src/app/club/scoring-actions.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check every existing outcome, wrong/missing player, voice parse ambiguity, RBI/runs boundaries, confirmed versus uncertain receipt, offline/retry/conflict, manual/ordered advancement, two-client behavior and phone background recovery. No real plays or microphone activation under layout-only review.

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

## Full roster in the batting picker — October 27, 2026

The owner's physical-phone screenshot showed only six player shortcuts. The owner requested that the full roster be available. Reuse the current native player buttons and optional search: remove the six-result cap and the selected-player-only filter. All roster players remain available before and after selecting a batter; the selected player retains its pressed state. Search still filters by name, and clearing it restores the complete roster. Scoring, rule/Band handling, writes, player identities, order and saved history are unchanged. No new dependency, service or migration.

- Source: local `codex/home-fit-screen`, based on main `979b85e26b3fd8d2ab813c7fe4de6c2f3cabd76a`. The previously reviewed Home changes and earlier unrelated local files remain preserved.
- Files: `src/components/connected-scorebook.tsx`, `tests/scorebook-modes-browser.cjs`, and this receipt. The new synthetic eleven-player regression reproduced the original six-result failure before the fix.
- Checks passed: existing Chromium/installed Edge scorebook modes suite, including all eleven buttons without search, continued availability after choosing/switching a batter, case-insensitive search/clear, no writes from selection, and a successful synthetic play attributed to the eleventh player. Readable touch targets and no horizontal overflow pass at 320px and 390px. Existing scoring, typed/voice, retry/offline, rule and isolation checks remain passing. Typecheck and diff whitespace checks passed.
- Scope limits: local code and synthetic verification only; no real game or player records changed. The screenshot supplied by the owner establishes the earlier phone UI problem, not acceptance of the corrected version. New physical-phone acceptance, hosted publication and release checks remain pending. No canonical milestone was closed.
- Delivery boundary: the full-roster fix and previously reviewed Home update are prepared locally for a scoped protected-preview release, subject to explicit owner approval under `CONTRIBUTING.md`. Exclude the pre-existing `next-env.d.ts` change and all private notes/credentials from publication. No commit, push, PR, merge, deploy, schema/auth/access change or external message has occurred for this package.

Release authorization, October 27: the owner answered "I approve" to the explicit commit/push/merge-after-checks/deploy request for this roster fix and the reviewed Home update. Continue the protected-preview release within that scope. Required checks and protection remain enforced; the generated-file edit and all private notes remain excluded. Record exact source/check/version receipts separately and retain physical-phone acceptance as a distinct gate.

## Slow-pitch hit types — October 27, 2026

- Owner brief: "HBP isn’t needed in slow pitch. We need to add 2B, and 3B to the hits. As we need a way to track those." Baseline: desktop main `a0c2bbbe4c2db8871a394e725a260ae730fe321a`, activated PR #27. This is a new local package; prior Home/roster release approval does not authorize its publication or hosted migration.
- Prepared result: Hits offers **1B / Single, 2B / Double, 3B / Triple, HR and ITP HR**. New entry choices and typed/voice input omit HBP. New hits save explicit types; earlier generic Hit and HBP revisions remain readable and correctable without relabeling historical hits. A historical correction keeps its original legacy outcome available, but other corrections do not offer HBP. Practice uses the same supported choices.
- Tracking: all three hit types count once in H/AB/PA and existing rates. Doubles/triples do not consume the fence-HR allowance or charge BEVs. Shared Stats/league/tournament leaderboards offer Doubles and Triples, derived from effective, nonvoid saved rows and isolated by team/season/scope/competition. Generic historical hits or incomplete rows make that breakdown unknown/unranked rather than guessing singles or zero doubles/triples. Existing aggregate totals and HR/BEV rules are unchanged.
- Reuse: extend existing outcome picker, pure engine, named-result parser, audited scoring RPC and leaderboard index. Existing React/native controls/CSS suffice; no new dependency, service or formula. Files include those components/libraries, focused unit/browser tests, the CI step, this receipt and migration `supabase/migrations/20261028004103_slow_pitch_hit_types.sql` (filename created by the installed CLI).
- Database preparation: additive accepted outcome values, hit recognition and an authoritative `hitTypes` snapshot capability. Full function-definition hashes fail closed on drift; signatures, owners/ACLs, isolation, revision locks, retry receipts, captured rules, participation and audit are retained. No stored row is rewritten. Updated connected UI exposes explicit types only when the database advertises support. Apply the reviewed migration before activating the matching Worker; previous Worker remains compatible with legacy generic hits after migration. Do not remove accepted hit types on rollback once explicit hits have been saved.
- Local evidence: all 112 existing/new unit tests, typecheck, disposable PostgreSQL hit-type migration/save/readback/correction/void/retry/conflict/access tests, scorebook-modes browser regression (including 320/390px explicit buttons, typed saves, capability guard and category rankings), connected UI + SQL regression, Games flow, built personal/competition/Stats pages, practice and season-practice checks passed using installed Edge/Chromium. The production Worker build completed. Windows emitted a standalone trace-copy EPERM warning; Linux CI/automated WebKit and physical iPhone acceptance remain separate, pending release stages.
- Delivery: local uncommitted preparation only. No new commit, push, PR, hosted migration, activation or real scoring write. Preserve the earlier generated `next-env.d.ts` edit, private note and `.env.local`. Desktop preview screenshot shows synthetic data, not the hosted phone screen. Canonical milestone completion is unchanged. Next: owner approval for this specific code/database release, then exact-source CI, reviewed migration, matching upload/activation and physical-phone readback.

Release authorization: the owner subsequently answered **"Approve"** to the explicit request to publish/deploy this update and apply its database migration. Continue those scoped steps without asking again. This supersedes the local-only delivery checkpoint above; record actual source/check/migration/version evidence separately. No real scoring write, auth/access change or new spending is part of the release.
