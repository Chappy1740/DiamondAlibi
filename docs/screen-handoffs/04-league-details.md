# 04 — League details: Screen handoff

**Status:** Locally verified; owner authorized commit, push, merge and deployment of this League stats refinement. **Owner's requested change:** Apply the tournament stats presentation to each League, showing that League's team stats and player leaders.
**Current screen only:** League details.
**Route/view:** `/leagues/<existing-league-id>`
**Related tracker IDs:** M3-13, M4-22. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **League details only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Selected league's games, statistics, category leaders and Add Game entry.

## What must remain correct

Retain league-only scope and established ranking/ties. Do not add tournament Bands to league scoring or create a game while reviewing layout.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/competition-page.tsx`
- `src/components/tournament-leaderboard.tsx`
- `src/lib/competitions.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check known/unknown/mismatched ID, no games, completed/live game links, category selection and ties, long names, archived restrictions, and Back to leagues.

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

**Current outcome:** The League team-statistics receipt below supersedes the initial preparation status. Record final publication and activation evidence separately.


## League team-statistics receipt — October 24, 2026

- Scope: selected League pages, including the compact Games entry and normal detail view. All-leagues Games view shows a clearly labeled overall League summary. Each selected League includes only its own kind/ID; no other league or tournament totals are substituted.
- Baseline: released main ed3765e25c2fbb2b4607e87c9e25680db6e5bf64 (PR #20, version 00d968c4). Delivery branch: codex/league-team-stats. Owner approved commit, push, merge and deployment after local review; final matching checks and activation receipts remain required.
- Reuse: generalize the existing tournament summary behind its unchanged wrapper, reuse PlayerLeaderboard, existing competitionView, authoritative game evaluations, rate formatter and accepted centered styles. A small League wrapper labels the same presentation. Existing project reuse avoids a new dependency, duplicate formula or separate save path.
- Presentation: OBP and Reach Base % as baseball decimal rates; centered Hits, RBIs, HRs and BEVs; signed net BEVs and separate gross owed/credits; most owed first in player rankings, with existing ties preserved. Unknown historical beverage detail stays unavailable. Empty/unknown/foreign team or season contexts fail closed.
- Verification: 17 focused calculation/competition tests; typecheck; Worker build; Chromium/WebKit Games/Tournament/League flows with distinct League fixtures, rates, signed BEVs, ranking, empty and denied states, narrow screens and accessibility; built Next.js navigation checks in both browsers. Synthetic records only; no hosted mutations or new database/auth/API configuration.
- Local previews: two fictional leagues have different totals. They are review fixtures, not newly implemented Explore Mode. Physical iPhone and authenticated hosted League acceptance remain pending. No tracker milestone closed.
- Shared consumers: Tournament summaries and leaders remain covered by the same browser and calculation checks; original scoring/rule versions and league membership paths are unchanged.
- Explore audit: Needs Demo Data. Reusable stats panel is available; realistic isolated named leagues, one-tap demo entry, consistent labeling/exit and authoritative mutation denial still need their separate acceptance. No Explore implementation or payments.
- Revert: this seven-file local display/projection/test/handoff diff only; no database rollback. Publication and activation require the scoped approval specified above.
