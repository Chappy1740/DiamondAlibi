# 08 — Live scorebook: Screen handoff

## November 5, 2026 — H5 and pilot phone receipt

[H5 #52](https://github.com/Chappy1740/DiamondAlibi/pull/52#issuecomment-6633560050) shipped from `ff64f0d4f918fce9c088e6ec7a25e99552914010`. Its exact-main validation passed and Worker `232bd809-4815-4cd2-ac46-1aebc0b675f3` was observed at 100% on November 4. The earlier H5 hold is historical.

Owner phone checks passed for A2 (per-game stats below Send), A4 (one-tap game navigation and official Out receipt above the bottom navigation), and #72 (Single with two runs defaults to two RBI; reached on error with three runs credits zero RBI and offers no override). Tournament continuation preserved the date, fence HR limit, and next batter on Game 3. The expanded Band panel showed the player's HR Band checked; it is prefilled from saved state, and a clean reopen verifies the saved assignment if the box was edited. Cross-device scoring and microphone input are open.

The [release checkpoint](../../RELEASE-READINESS.md#november-5-2026--pilot-phone-checks-and-release-checkpoint) tracks the current Worker evidence and remaining gates.

## November 4, 2026 — H5 final reconciliation for pilot review (historical)

**Recovered; GREEN. H5 rung: Tested locally; exact-head CI pending.** Owner says
“finish 52”; original scoped reconciliation authority covers conflict resolution,
tests, commit/push and GitHub handoffs. Earlier #52 merge-only approval is retained
but does not authorize automatic deployment. The existing main release gate can
deploy on merge, so hold #52 for explicit combined merge/deployment approval.
No migration, provider/access change, dependency change or hosted write.

Verified clean Codex branch: `codex/h5-scorebook-flow`, prior head
`33e280a4aa8e64d4a30e7d8e28ad071d1822b03b`; original H5
`701117177e02575e69bdcf80f1acf7a116912b07` remains in history.
Integrate current main `c91205053ac66f11d9e4dee675ed320b44edc463`
with a history-preserving branch merge and ordinary push. Only concurrent
RELEASE-READINESS.md, 00-WORKING-STANDARD.md and tracker receipts conflict;
preserve both histories. H5 application code remains byte-identical to the
original H5 head; the CSS/test integration also retains current main changes.

Preserve Runs 0–4, draft then Send, exact-ID authoritative five-second receipt,
OUT-only over-limit HR, retry/locking/ordered-batter guards and established
server scoring rules. Retain deployed H4 typography/dropdowns, H2 navigation,
#57 modest saved/unknown scores and two-column single-label competition leaders,
and approved Home/Stats count–leader / amount–Tied. Reuse existing components,
commands, native controls, CSS and installed pinned dependencies. No new feature.
Claude Roast Club #53–#56 remains independently owned and untouched; #55/#56
share scorebook surfaces and require their own later integration/revalidation.

Current main is the completed #57 release source; its final receipt supersedes
older preparation snapshots: [#57 completion](https://github.com/Chappy1740/DiamondAlibi/pull/57#issuecomment-6632233228),
CI `41839541730`, build `c43bbef2-e67d-471c-8b75-fa44bce1eff2`,
Worker `722067b5-9dc3-4845-af3e-f3cafd8938e2` recorded Ready at 100%.
This is recorded release evidence, not a fresh provider/phone observation.
H4 #47 and H2 #49 already merged/deployed under their separate owner approvals.

Fresh Codex local checks on this reconciliation: typecheck, all 130 unit tests,
33 release-gate tests, complete scorebook modes in Chromium/WebKit, Games flow
in Chromium/WebKit (including 99–98, modest unknown labels and compact leaders),
Home/Stats in Chromium/WebKit, and connected UI/disposable SQL all PASS.
Initial sandbox unit failure was dependency-junction access; the authorized
rerun with existing dependencies passed. No install or assertion weakening.
H5 fixes the typed-entry reset path and complete WebKit scorebook now passes;
this is new evidence, distinct from #57's earlier unchanged-baseline failure.

Fresh local results and full exact-head CI are finalized in
[PR #52](https://github.com/Chappy1740/DiamondAlibi/pull/52), the completion receipt
for exact SHA, changed files, checks, mergeability and review findings. No inline
review threads existed at recovery; independent review remains unverified.
Physical phone, microphone, hosted authenticated and cross-device acceptance
remain UNKNOWN. Optional fun labels/group names remain deferred. No milestone
closes. Next: push reconciled head, pass full exact-head CI and return only #52
for final release approval. Continue this chat while scope/evidence agree.

<!-- Earlier preparation and release snapshots below retain their historical scope. -->

## November 3, 2026 — Reconciliation update

Current main is `c38d4cf483eded68f1b63294898644c9aac14054`. The original H5
receipt below is historical. Reconciliation preserves all H5 code and main's
newer Stats changes. Authorization, dependencies and limitations are in the
[current working standard](00-WORKING-STANDARD.md#november-3-2026--pilot-pr-reconciliation-h5-checkpoint);
[PR #52](https://github.com/Chappy1740/DiamondAlibi/pull/52) is the exact-head
completion receipt for fresh checks, review findings and mergeability. No release.

## November 3, 2026 — H5 Scorebook draft

Owner approved H5 only as its own draft PR from current main: Runs 0–4
buttons, scoring flow, Send, five-second “This is the play that was recorded”,
and Game details styled as a button. The thirteen fun labels and three group
names were explicitly last priority and cut first if late; that optional copy
pass is deferred because exact wording was not supplied. Existing outcome
names and Hits/Outs/Other remain. H6–H8 are excluded.

Baseline: `4452beadb6f7a83f459a518db91f464f6a185a46`, freshly fetched main,
which includes the H3 Stats correction after release #48 / `07e6878`.
Branch: `codex/h5-scorebook-flow`. No H2/H4 commits are included. PR #47 must
precede #49 in any later authorized merge, because H2 uses H4's body-text token.
Neither PR is changed by H5.

### Behavior and reuse

Normal scoring uses player → outcome → Runs/RBI → Send. Outcome taps, Runs
0–4 buttons and first-tournament Band choices prepare an editable draft without
sending a scoring command. The full roster, optional search and ordered lineup
remain. No outcome starts selected; Send requires a player and chosen result.
Typed results use “Use result”; recognized speech prepares the same draft.
Send submits through the existing guarded command, revision and retry path.
The existing runs/RBI validation, HR defaults, capability guards and server
rules are unchanged. No rule version or migration is needed. If an ordered
batter advances during refresh, the prior draft cannot be sent for that batter.

After a successful command and readback, the exact saved play ID is looked up
in the selected game's authoritative rows. Its roster name and official result
appear below the game heading for five seconds. Over-limit HR displays Out
without raw run/RBI credit. Pending, invalid, conflicting, unconfirmed and
failed-read saves do not create that receipt; a missing saved row also cannot
produce it. A confirmed save resets the draft; retry preserves command and play
identity. The timer cleans up on replacement/unmount and game changes clear it.
Game details remains a native context-preserving link with button styling.

Reuse decision (EYD-ARCH-001): extend ConnectedScorebook, BattingOutcomePicker,
VoicePlayEntry, scoreRowSummary and existing native controls/CSS. A replacement
widget or third-party library adds no value here. No dependency was installed
or upgraded. Legacy full-mode entry, setup, management, saved rules, audited
corrections, statistics, Beverage calculations and server authorization remain
outside the H5 behavior change.

### Verification and completion receipt

Stage: Tested locally; draft publication and full exact-head CI receipt are
recorded in the PR for this branch after publication. The source snapshot does
not claim merge, deployment or owner acceptance. Codex uses synthetic localhost
fixtures and the existing installed dependencies/browsers. Chromium scorebook
modes in Chromium and WebKit, the disposable connected UI/SQL regression,
typecheck, and 27 scoring/parser/service/tracker tests pass. H5 cases cover all
13 capability-supported outcomes, Runs 0–4,
RBI/HR boundaries, no-write selections, keyboard Send, five-second receipt,
official OLHR, invalid/conflict/uncertain/delayed/failed-read/missing-row cases,
same-ID retry, offline controls, ordered-batter refresh and 320–1440px/enlarged
text. The 390px synthetic draft and saved-receipt previews were visually
inspected. Full exact-head CI is finalized in the PR receipt.

Changed files: connected-scorebook.tsx, batting-outcome-picker.tsx,
voice-play-entry.tsx, globals.css, scorebook-modes-browser.cjs, this handoff,
00-WORKING-STANDARD.md, RELEASE-READINESS.md and project-tracker.ts. Shared
full/setup/manage modes and their legacy controls are checked; no other picker
or voice-entry consumers exist. Tracker revision 80 links this receipt without
closing a milestone. Screenshots/logs are ignored local artifacts.

Retest on this candidate using synthetic data:
1. Choose a roster player and Triple. Tap Runs 4 and RBI 2. No play is recorded
   until Send. Send once: expect one saved row and the player's `3B · 4 runs,
   2 RBI` receipt for five seconds, followed by an empty next-player draft.
2. Try Runs 1 with RBI 2, or a zero-run HR. Expect the existing validation error
   and no command. Keep these established rules.
3. Type a named result and choose Use result, or recognize a supported voice
   result. Review/edit the draft and choose any required Band before Send.
   Ambiguous/unknown names cannot send. Real-device microphone acceptance is
   still unknown; no live microphone or hosted scoring test was run.
4. Verify pending/error/conflict has no recorded-play receipt. An uncertain
   save exposes Retry the same change, retaining the original command. After
   confirmation there is one effective play, never an extra play from selection.
5. Open Game details with keyboard or touch. Verify the same team/season/game
   and existing Back to scoring navigation. At 320px, scroll to Send and Game
   details; both remain usable above the fixed navigation.

Approvals: implement, verify locally, commit/push and publish the H5-only draft.
No merge, deploy, migration, hosted test, new dependency or H6–H8. Stop and ask
before any server-side runs/RBI rule change. No such change was needed.
Rollback is a revert of this H5 presentation/interaction diff; no data rollback.
Next owner action: review this draft. Physical-phone/hosted/cross-device
acceptance and pilot readiness remain open. Continuity GREEN: continue through
the exact-head draft receipt; no new chat is required.

### Earlier UAT source receipt — main 07e6878

[PR #48](https://github.com/Chappy1740/DiamondAlibi/pull/48) records
`07e68783081b3c3439be5903abb7904432cbef33` as deployed, Ready at 100% traffic,
Worker prefix `1fde797e`, through Cloudflare build
`831818e3-1389-494c-b6ed-9f38a411bd8e`. Full Worker UUID: unknown in that record.
Hostname: `diamondalibi.eydrenworks.com` (existing workers.dev bookmark also
supported). Exact-main validation run `41743150437` passed. This is existing
release evidence, not a fresh provider observation or a claim about what a phone
has loaded now. Current H5 baseline is later main `4452bead`; H5 is not deployed.

Older entries below are historical where superseded by this H5 brief.

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
