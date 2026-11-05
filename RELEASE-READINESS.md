# Release readiness and recovery

## November 5, 2026 — Pilot phone checks and release checkpoint

**AMBER.** [H5 #52](https://github.com/Chappy1740/DiamondAlibi/pull/52#issuecomment-6633560050) shipped from `ff64f0d4f918fce9c088e6ec7a25e99552914010`. Its exact-main validation passed and Worker `232bd809-4815-4cd2-ac46-1aebc0b675f3` was observed at 100% on November 4. The earlier H5 hold is historical.

[#61](https://github.com/Chappy1740/DiamondAlibi/pull/61) merged as `0a1a48cfa5c4e187fb048a9b6c2b65d6768b85dd` after the owner lifted the hold at 09:23 CT. [Main validation](https://github.com/Chappy1740/DiamondAlibi/actions/runs/42054604449) passed and [production build 8096563e](https://github.com/Chappy1740/DiamondAlibi/runs/127343146384) reported Worker `2f4abbad-b231-4252-a1a2-5434d2366c11`. The later verified source `2b0acbf295d0d0fc217b865b56d54fb298647cb6` (#73) passed [main validation](https://github.com/Chappy1740/DiamondAlibi/actions/runs/42101559479) and [production build 212c3d22](https://github.com/Chappy1740/DiamondAlibi/runs/127508913554) reported Worker `544bf300-274e-44a5-8078-9ee62eb63602`. Active traffic percentage and the live feature flag have no independent readback.

Owner phone checks passed for A2 (per-game stats below Send), A4 (one-tap game navigation and official Out receipt above the bottom navigation), and #72 (Single with two runs defaults to two RBI; reached on error with three runs credits zero RBI and offers no override). Tournament continuation preserved the date, fence HR limit, and next batter on Game 3. The expanded Band panel showed the player's HR Band checked; it is prefilled from saved state, and a clean reopen verifies the saved assignment if the box was edited. Cross-device scoring and microphone input are open. Conditional go for a scoring-only pilot with the announcer off. The owner accepted the lock-screen limitation for a phone in use. The [Roast Club status](docs/screen-handoffs/31-roast-club-status.md) records the audio evidence and limits.

The owner authorized committing, pushing, and deploying the listed PRs on November 5. The integration carries the scorer's existing team-scoped opt-in list from #63 and the reconciled records from #59, #66, and #67. #65 remains a draft pending separate approval and verification of its hosted migration. The release receipt in the integration PR records the final validation and Worker evidence.

## November 5, 2026 — Roast Club checkpoint before #61 (historical)

**AMBER.** Roast Club R1–R4 ([#53](https://github.com/Chappy1740/DiamondAlibi/pull/53)–[#56](https://github.com/Chappy1740/DiamondAlibi/pull/56)) are **merged**, with the off switch and smoke test (#60), into main `0d282bf60622dcd01948b5ef1a9a539bc4f26e77`. The hosted migration `roast_club_consent` is **applied and verified** (read-back recorded). **Production is held: not deployed.** Last confirmed deployment: H5 `ff64f0d` (merge of #52; Worker `232bd809-4815-4cd2-ac46-1aebc0b675f3` at 100% when verified about 2026-11-04 14:41 UTC per the [#52 receipt](https://github.com/Chappy1740/DiamondAlibi/pull/52#issuecomment-6633560050)). **Current Cloudflare traffic is UNVERIFIED** (not rechecked); the failed main builds confirm those attempts produced no new release. Main `validate` run `42017788646` passed; the Cloudflare main build check `127212934158` reported failure with cause UNKNOWN (consistent with the migration deploy gate, log not read; earlier main build `cc77500d-ed69-4d41-b76c-f1c6188fb8e7` the same). Hosted rollback-only behavior check passed 16/16 on 2026-11-05 (synthetic data, nothing persisted); operations runbook: [33-roast-club-runbook.md](docs/screen-handoffs/33-roast-club-runbook.md). Exact evidence, approvals and the single next action: [Roast Club status](docs/screen-handoffs/31-roast-club-status.md). The owner said "hold on 61" (2026-11-05 05:28 CT): fingerprint PR #61 stays unmerged and production stays held. This section does not describe H5; older sections below are history.

## November 4, 2026 — H5 final reconciliation for pilot review

> Historical checkpoint. The November 5 receipt above records the subsequent release and phone evidence.

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

## November 4, 2026 — Games display correction prepared locally

Owner phone feedback requests a smaller score/unavailable label and the existing
two-column, single-category-label Stats presentation for competition leaders.
Current brief, preservation rules, local checks/previews and completion receipt:
[Games handoff](docs/screen-handoffs/02-games.md#november-4-2026--games-score-size-and-compact-competition-leaders), synchronized with tracker revision 85.
Local uncommitted branch `codex/games-score-leader-layout` starts from deployed
main `c788fa7e9a6c23ffc085a6ba2f09f96cde2829e7` / #49. Reuse existing
components/CSS; no calculations, score cap, dependencies, hosted writes or
provider/database changes. This correction is not live. Owner continued the proposed commit/push/draft PR
for full CI. Merge/deployment still require a separate scoped decision under
CONTRIBUTING.md; prior #49 delivery approval is historical. #52 and Claude Roast Club untouched; no milestone closes.
AMBER: focused Games/Home/Stats tests pass both engines and Chromium scorebook
passes; full WebKit scorebook also fails on unchanged baseline typed entry.
Details/retest are in the linked local receipt. Return the concrete correction
for draft publication/full CI, then separate release review after passing checks.

<!-- Earlier release and preparation snapshots below remain historical. -->

## November 3, 2026 — H4 merged; H2 retargeted to main

**Recovered; GREEN. H4 rung: Merged. H2 candidate: Tested locally after retarget.**
Owner explicitly approved merging and automatically deploying #47 only, and
asked whether to do #49 next. H4 merged as
`d469091a88550af3d560e9ac5341acd083b08b34`, retaining reviewed H4
`3114f47d5aef47a4183ccdf91061fe01b6cfaf41`; their source trees are identical.
Main CI is pending; initial Worker build
`117831c9-9029-410c-b13b-1a6a52fe17db` failed without a version receipt.
Failure cause/current traffic are UNKNOWN at this source snapshot; the
[H4 completion receipt](https://github.com/Chappy1740/DiamondAlibi/pull/47)
records their eventual result, build and version. No deployment claim is made here.
No production migration, provider configuration, dependency or unrelated change.

H2 #49 now targets `main`, baseline
`d469091a88550af3d560e9ac5341acd083b08b34`. Former H2 head
`c622917c4913e2acf603196c3ce8c322d66a99f3` and the original H2/H4 commits
are retained. Integrating merged main produced no conflicts or application/test
changes. H2 remains the original Games navigation/card scope, plus its current
reconciliation records. Existing components, native links/CSS and packages reused.
Main's approved Home/Stats and H4 dropdown/type scale remain intact; no H5 code.

Original reconciliation authorization covers this retarget, corrections, tests,
commit/push and GitHub records. #49 remains draft: its merge/deployment is NOT
approved by the owner's question. #52 remains unmerged; its prior merge-only
permission does not authorize automatic deployment. Claude Roast Club branches
and PRs are excluded and untouched. No milestone closes.

Fresh Codex local checks: typecheck, four tracker tests and Games flow in both
Chromium and WebKit passed. H2 application/test content is identical to former
head c622917. Exact new H2 SHA, complete main-based CI, changed files, mergeability
and outstanding phone/hosted/cross-device acceptance are the completion receipt
in [PR #49](https://github.com/Chappy1740/DiamondAlibi/pull/49).
Earlier H4-based passing runs below are historical evidence, not validation of
this new candidate. Continue this chat: authorization, source and records agree.
Next: finish approved #47 release verification and main-based #49 validation,
then return #49 for a separate owner merge/deployment decision. No #49 release.

<!-- Earlier snapshots below retain their historical scope. -->

## November 3, 2026 — Pilot PR reconciliation (H2 dependent checkpoint)

**Recovered; GREEN. Ready for review; no release.** Owner authorizes scoped
reconciliation, tests, commit/push and GitHub-backed handoffs for #52/#47/#49.
No PR merges, deployments, production migrations, provider/dependency changes,
or unrelated features. Claude Roast Club branches and PRs remain untouched.
Main: `c38d4cf483eded68f1b63294898644c9aac14054`.
H5 #52: `33e280a4aa8e64d4a30e7d8e28ad071d1822b03b`, based on main.
H4 #47: `3114f47d5aef47a4183ccdf91061fe01b6cfaf41`, now based on main.
H2 original: `50f8cc4d365ae0a95db7bdeff5291ce02b897596`, retained in history.

H2 integrates that exact H4 head with no conflict. Keep #49 targeting
`codex/h4-dropdown-type-scale`; its application/test diff is the same original
seven-file H2 scope, plus reconciliation records. No H5 code is included.
Retain H4's body-text token, current main Home/Stats and all existing consumers.
Reuse CompactGameList, PlayerDashboard, native links/CSS and installed packages.
Two cards across on phones, three from 640px, whole-card keyboard/touch links,
full context, saved scores and sample/review/archived restrictions remain.

Rung: **Tested** locally by Codex: typecheck, 22 tracker/leaderboard tests,
Games/Home/Stats/tournament-time Chromium and WebKit, connected UI/disposable
SQL, practice-season and sample dashboard checks passed. Preview-only generated
next-env changes were excluded. Full new-head CI remains pending in the PR.
All H2 application/test added/removed lines match the original H2 diff exactly.
Fresh local checks, full exact-head CI, exact SHA/files, review findings and
mergeability are the completion receipt in [PR #49](https://github.com/Chappy1740/DiamondAlibi/pull/49).
No review threads/submitted reviews existed at recovery; independent review and
physical phone, hosted authenticated and cross-device acceptance remain UNKNOWN.
No milestones close. Current exact-head receipts:
[#52](https://github.com/Chappy1740/DiamondAlibi/pull/52),
[#47](https://github.com/Chappy1740/DiamondAlibi/pull/47),
[#49](https://github.com/Chappy1740/DiamondAlibi/pull/49).

Next: validate/push H2, finish all three CI receipts and return for owner review.
Proposed smallest separately approved release sequence: #52; refresh/revalidate
#47 against resulting main; #47; then retarget #49 to main, reconcile and rerun
full CI before #49. Never retarget #49 prematurely or treat current H4-based CI
as validation of a future main-based candidate. No release action is done here.
Continue this chat: scope, authority, evidence and retained history agree.

<!-- Earlier checkpoint/requirements below are historical. -->

## November 3, 2026 — Pilot PR reconciliation (H4 checkpoint)

**Recovered; GREEN. Ready for review; no release.** Owner authorizes scoped
reconciliation, tests, commit/push and GitHub records for #52/#47/#49 only.
No PR merges, deployments, production migrations, provider/dependency changes
or unrelated features. Claude Roast Club branches/PRs are excluded.
Main: `c38d4cf483eded68f1b63294898644c9aac14054`. H4 original head:
`14bea97aed53b4a22ba6fb7ec738b76b8ead5efb`, retained in branch history.
Retarget #47 from old H3 to main; retain only H4 and its reconciliation records.
CSS conflict: independent appended H4 typography and main game-stat-lines blocks;
keep both, plus current Stats count–leader / amount–Tied markup and all newer tests.
Reuse existing DashboardSelect, PlayerDashboard, native controls, CSS and packages.

Rung: **Tested** locally by Codex: typecheck, 22 tracker/leaderboard tests,
Home/Stats and Games Chromium/WebKit, Chromium scorebook and Beverage controls
passed. Full exact-head CI remains pending until the PR receipt records it.
Fresh local tests, full exact-head CI,
SHA/files, review findings and mergeability are the completion receipt in
[PR #47](https://github.com/Chappy1740/DiamondAlibi/pull/47).
No review threads or submitted reviews existed at recovery; independent review,
physical phone, hosted authenticated and cross-device acceptance remain UNKNOWN.
No milestone closes. Current #52 head is
`33e280a4aa8e64d4a30e7d8e28ad071d1822b03b`; it remains independent of H4.

Next: validate/push H4, then integrate its verified head into dependent H2 #49.
Keep #49 based on H4 with an H2-only diff. Later proposed order: #52, refresh and
revalidate #47 against resulting main, #47, then retarget #49 to main and revalidate.
Every release action requires separate owner approval. Dry-run H5 + H4
integration reports only RELEASE-READINESS.md, 00-WORKING-STANDARD.md and
project-tracker.ts conflicts; retain both scopes when later refreshing H4. Current exact-head receipts:
[#52](https://github.com/Chappy1740/DiamondAlibi/pull/52),
[#47](https://github.com/Chappy1740/DiamondAlibi/pull/47),
[#49](https://github.com/Chappy1740/DiamondAlibi/pull/49).
Continue this chat: authority, evidence and history are coherent.

<!-- Historical H5 preparation snapshot retained from its branch. -->

## November 3, 2026 — Pilot PR reconciliation (H5 checkpoint)

**Recovered; GREEN. Ready for review, no release authorization.** Owner authorizes
scoped reconciliation, conflict resolution, tests, commit/push and PR/handoff
updates for #52, #47 and #49 only. No PR merge, deployment, production migration,
provider change or unrelated feature work. Claude's Roast Club work is excluded.
Verified main: `c38d4cf483eded68f1b63294898644c9aac14054`.
H5 source: `701117177e02575e69bdcf80f1acf7a116912b07` on
`codex/h5-scorebook-flow`; original history is retained without force push.

The H5/main conflict was only concurrent receipts in RELEASE-READINESS.md,
00-WORKING-STANDARD.md and project-tracker.ts. Preserve both histories and main's
Stats count–leader / amount–Tied behavior and owner-reported appearance acceptance.
H5 scoring components, receipt guards, OUT-only over-limit HR presentation,
server scoring rules and tests are unchanged from the original H5 head.
Reuse: existing components, commands, CSS and installed pinned dependencies.

Rung: **Tested** locally by Codex in this reconciliation session: typecheck,
130 unit tests, 33 release-gate tests, Chromium/WebKit scorebook and Home/Stats,
and connected UI + disposable SQL regression passed. Initial sandbox dependency
access failure was rerun successfully with existing dependencies; no install.
Full exact-head CI remains pending until the linked PR receipt records its pass.
Fresh local checks and full exact-head CI, full review SHA, changed files and
mergeability are the completion receipt in [PR #52](https://github.com/Chappy1740/DiamondAlibi/pull/52).
Do not infer a new pass or live version from older passing checks. Physical phone,
actual microphone, hosted authenticated and cross-device acceptance remain UNKNOWN.
No milestone closes. This session may continue: scope and evidence are coherent.

Next: validate/push H5, reconcile H4 #47 onto main with an H4-only diff, then
integrate the updated H4 base into dependent H2 #49. Keep all three draft.
For a later separately approved release prioritize #52; #47 must precede #49.
After an approved #47 merge, retarget #49 to main, reconcile and rerun full CI;
no retarget or release is implied now. Final PR receipts carry current exact SHAs.

## November 3 H5 — Scorebook draft, no release

`codex/h5-scorebook-flow` is based on current main
`4452beadb6f7a83f459a518db91f464f6a185a46`. Owner authorized H5 only as a draft:
Runs 0–4, draft flow/Send, five-second confirmed official-play receipt and Game
details button. Optional fun labels/group names are deferred as the first cut.
Scope, local evidence, retest and completion receipt are in
[08-scorebook.md](docs/screen-handoffs/08-scorebook.md#november-3-2026--h5-scorebook-draft),
the working standard and tracker revision 80; final exact-head checks are recorded
in the H5 PR. No server-side runs/RBI rules changed. No merge, deploy, migration,
hosted test, dependency or H6–H8 is authorized. H4 #47 must precede H2 #49 for its
body-text token; both remain separate drafts. Preserve the existing release gate.

Earlier UAT source `07e68783081b3c3439be5903abb7904432cbef33` was recorded
deployed in [PR #48](https://github.com/Chappy1740/DiamondAlibi/pull/48): Worker
prefix `1fde797e`, 100% traffic, build `831818e3-1389-494c-b6ed-9f38a411bd8e`,
hostname `diamondalibi.eydrenworks.com`, successful main run `41743150437`.
Full Worker UUID and current-phone loaded version are unknown. This historical
receipt does not establish current provider traffic or H5 deployment.

## November 3 H3 tie wording

Owner says Stats look good after #50 and requests **amount – Tied** instead of a count of tied leaders. This is owner acceptance of the card appearance, with tie wording still open. `codex/stats-tied-label`, from deployed main `4452beadb6f7a83f459a518db91f464f6a185a46`, changes only the compact summary wording and retains all tied players in the ranking view. Current brief/receipt is [10-stats.md](docs/screen-handoffs/10-stats.md#november-3-2026--h3-tie-wording), synchronized with the working standard and tracker revision 80. Existing H3 presentation delivery authorization continues; H2 #49/H4 #47 remain excluded drafts. Local typecheck, 22 tracker/leaderboard checks and Chromium/WebKit Home/Stats pass; exact-source CI, merge and active verification remain pending at this source snapshot and are recorded in the correction PR. Prior compatible #50 Worker prefix `90f2bf8a` remains the rollback point. No scoring, ranking policy, schema, dependency, hosted write or auth/access/provider change.

## November 3 H3 phone correction — count – leader

Owner requested that Stats cards use the circle as their category label and display **count – leader** beside it. `codex/stats-count-leader` follows deployed release #48 / main `07e68783081b3c3439be5903abb7904432cbef33`; its current brief and receipt are in [10-stats.md](docs/screen-handoffs/10-stats.md#november-3-2026--h3-phone-follow-up-count--leader), linked from `00-WORKING-STANDARD.md` and tracker revision 79. Existing H3 release authorization continues for this presentation correction only. H2 #49 and H4 #47 remain separate drafts and are excluded. Local typecheck, 22 tracker/leaderboard checks, Home/Stats Chromium/WebKit and Chromium shared-scorebook checks pass. Full head/main CI and active deployment verification remain pending at this source snapshot; the correction PR records their final receipt. Owner phone acceptance is open. Prior compatible release #48 was verified at Worker prefix `1fde797e`, 100% traffic. No scoring, migration, dependency, hosted write or access/auth/provider change is included.

## November 3 owner-approved UAT release through PR #46

Owner authorized commit, push, publication, merge and deployment of the pending non-H4 work through PR #46. Release branch `codex/uat-release-through-pr46` combines original #38, #39, #43, #44, #45 and #46 commits without changing their agent branches. H4 / #47 remains a separate draft, excluded from main and activation. H1 and H3 are the product changes; the other PRs are documentation/governance. No migration, hosted UAT write, new dependency, auth/access change, invitation, provider change or test email is authorized by this release.

The current handoff and preparation/completion-receipt contract are in [00-WORKING-STANDARD.md](docs/screen-handoffs/00-WORKING-STANDARD.md#november-3-2026--uat-release-through-pr-46), synchronized with tracker revision 78. At this source snapshot, integration is implemented; combined CI, merge and active deployment verification remain pending. The release PR for `codex/uat-release-through-pr46` records final exact-head/main CI and active Worker/build/traffic evidence without making a self-referential source commit. Owner phone acceptance and the pilot's remaining A2/A4 and later scenarios are separate. Latest verified prior live source is `c19132d27d8656a3e92fa8d61cbbd1e742ba521a` / Worker `02bdcb3a-f4e6-439a-94d7-d356c2bc5350`, recorded in PR #42. Preserve the existing automatic exact-main release gate and prior compatible version.

## November 3 owner decision — UAT sharing is repo-only

Owner decision, originally recorded by Claude Code in PR #44 and now synchronized with the current handoff and tracker. UAT sharing between Claude Code and Codex is **repo-only**: results, URLs, commit IDs and acceptance states go in this repository's shared records, and screenshots or notes go in the PR. Neither agent gets a login, Access seat, service token or other credential for hosted UAT or live sites, and no preview URLs, new UAT sites or access changes are implied. UAT and pilot data must be synthetic or explicitly marked pilot data; no real customer data or PII. Changing any of this needs a new owner decision. Applies to the Saturday pilot: the existing Cloudflare Access-protected Worker stays the only UAT surface, and Access seats are unchanged. Record: this section, `docs/screen-handoffs/00-WORKING-STANDARD.md` and `src/data/project-tracker.ts` revision 78.

## November 2 continuation — notification draft refreshed

Current main is `5964cd83f5f4208bad30efbee04f0b883b83e2e2` (PR #41),
whose merged-source validation and gated Worker deployment passed. Full release
receipt: https://github.com/Chappy1740/DiamondAlibi/pull/41 . Owner confirmed
new-host sign-in/clubhouse/games load and then confirmed saving the new Site URL.
This supersedes older hostname-candidate and advisory-blocker statements below.
Password recovery at the new hostname is not yet hosted-tested.

Owner screenshot shows `mail.eydrenworks.com` verified in Resend. After a guided
sending-only/domain-restricted key setup, owner reported saving
`FEEDBACK_RESEND_API_KEY` in the existing Worker. No key value was read, stored
in this repository, or independently verified by that report. This does not
approve notification migration, merge/deployment, enabling dispatch or real mail.

Codex is refreshing draft PR #40 with the already-deployed hostname/dependency
fixes, preserving both release records and the migration approval gate. No new
package choice, live database write or notification activation is included.
Continuity GREEN: actual branch, clean starting tree, remote heads and other
open PRs were checked; no conflicting active feedback writer was found.
Next: focused validation of the integrated draft, then complete runtime settings
while dispatch stays disabled and request the exact live activation scope.

## November 2 owner feedback alerts — local candidate, not activated

Owner approved commit, push and a draft PR for this exact notification candidate
on November 2 ("yes approve and commit"). That approval excludes merge,
deployment, live migration/provider configuration and real email. Owner also
chose `diamondalibi.eydrenworks.com` for a guided app-domain setup; that hostname
does not change the owner email destination or activate a route in this PR.

Publication checkpoint: draft PR #40, implementation source `88fc3fa`.
Cloudflare branch packaging passed; GitHub run `41555238834` failed at the
existing glob/minimatch advisory gate before application tests. Do not merge,
bypass the gate, or upgrade dependencies without a scoped reviewed change.
Details and exact evidence are in the current screen handoff receipt.

See the current receipt in `docs/screen-handoffs/29-owner-feedback.md` for the
owner brief, baseline, checks and limitations. New feedback must notify the
owner, while Booth Reviews remains the private message record. This candidate
reuses the existing Resend provider and Worker with no added dependency/service.
The destination is an owner-confirmed server setting, not an inferred account
email and not a source-controlled personal address.

Activation order, after named live approval and successful normal Linux CI:

1. Review/apply `20261103003240_feedback_owner_notifications.sql` once, then
   verify the installed definitions/ACLs, transactional enqueue and unchanged
   existing feedback/scoring/privacy. Historical feedback is not backfilled.
2. Configure server-only `FEEDBACK_RESEND_API_KEY` using an approved sending key
   for the existing verified sending domain; do not read/reuse an SMTP secret
   from this worktree. Configure `FEEDBACK_NOTIFICATION_FROM` (bare verified
   sender address), `FEEDBACK_NOTIFICATION_TO` (owner-confirmed mailbox), and
   `FEEDBACK_NOTIFICATION_INBOX_URL` (protected HTTPS `/owner/feedback`, no token
   or query). Keep `FEEDBACK_NOTIFICATIONS_ENABLED` off during preparation.
3. After approved database verification, update the existing migration-tree
   fingerprint through the reviewed process. Do not bypass the deployment gate.
4. Approve/deploy the exact reviewed source and existing Worker's proposed cron
   (`*/5 * * * *`). Verify fetch routes, Access and owner-only inbox still work.
   No new domain, public preview URL, team permission or paid upgrade is implied.
5. Turn `FEEDBACK_NOTIFICATIONS_ENABLED=true` only within the live approval.
   Verify all settings, actual Cron Trigger activation and a named synthetic
   feedback/email test at the exact approved destination. Inspect the saved
   notification receipt, provider acceptance and actual inbox delivery separately.
   Existing provider quotas remain shared; do not enable paid usage to clear a
   backlog. This schedule adds up to 288 small invocations per day.

Acceptance: a new saved suggestion/question/issue queues one alert; the generic
email points to Booth Reviews; retries do not create another feedback record;
provider failures retain feedback and show pending/needs-attention status;
unauthorized readers cannot see messages, destinations or delivery receipts.
Alerts do not contain the sender name or message. A provider receipt is never
labelled delivered. Automatic retry ends after twelve attempts or 23 hours from
first attempt; inspect unresolved rows rather than blindly re-emailing them.
Changing destination after the first attempt does not redirect an existing job.

Rollback/stop: disable `FEEDBACK_NOTIFICATIONS_ENABLED` and the cron under the
approved scope if privacy, sending or quota behavior fails. Preserve feedback,
notification receipts and queued jobs; do not purge messages or reset attempts.
Prior application versions can still save feedback with the enqueue trigger in
place; their owner inbox simply lacks delivery status. No database rollback or
message resend is automatic. Restoring alerts after an idempotency window has
expired needs review of any uncertain provider acceptance first.

Local evidence: focused unit/disposable SQL/API tests, actual-component
Chromium/WebKit and production Next webpack build pass. Windows Worker adapter
packaging fails on junction-backed native `sharp` resolution, so normal Linux
CI Worker packaging is still required. No live email or provider change tested.

## November 2 custom hostname — guided setup, code candidate local only

Owner subsequently approved the scoped hostname package: "approve, commit,
push, and deploy". Commit/push and exact-source deployment through required
checks are authorized. Dependency upgrades, notification PR #40, live schema,
auth-provider changes, test mail, new services and paid actions are excluded.

Subsequent scoped approval: owner replied "I approve" to the proposed upstream
glob 14.0.2/minimatch 11.0.1 override and necessary lockfile update, permitting
that security-gate unblock before continuing the already-approved hostname
deployment. It does not authorize a force-fix, audit bypass, other dependency
upgrade or notification PR #40 deployment. Review the lockfile transitive
changes and BlueOak-1.0.0 notices in THIRD-PARTY-NOTICES.md; the current screen
handoff records exact evidence and update ownership.

The scoped override candidate passes a clean isolated install, audit (zero
vulnerabilities), TypeScript/recovery/build-API checks, all 33 release-gate
tests and the normal local Worker build. These are Codex local results; require
fresh exact-head and merged-main validation before the already-approved deploy.

Owner selected `diamondalibi.eydrenworks.com` and supplied screenshots of the
Production-only route and retained old/new exact Supabase callback entries.
A signed-out HTTPS request redirected to Cloudflare Access for this hostname.
This establishes routing/protection, not app sign-in or password recovery.

The live password-reset request allowlist still accepts only the old Worker
hostname. `codex/diamond-alibi-hostname` locally adds the new exact HTTPS origin
and focused mocked regression checks, based on main
`e46cc42086d675fc2fd89ffb474801690e0a11ae`. No library or schema change is needed.
See `docs/screen-handoffs/21-forgot-password.md` for the current scope, checks and
receipt. The notification implementation remains separate in draft PR #40.

Keep the existing Site URL while this candidate awaits its own publication,
review, successful required checks and named deployment approval. After release,
verify new-host app sign-in, change Site URL to the new HTTPS root within owner
approval, retain the old redirect entry, and perform only an explicitly approved
single recovery test. No real reset email was sent for the local checks.
The current npm glob/minimatch advisory gate remains enforced; do not bypass
it or upgrade dependencies under this hostname patch. Rollback uses the prior
Site URL and original app URL while retaining both exact callback entries.

## Current source checkpoint — October 30, 2026

- Verified main before this branch: `189a176d7694248e75f740521eecfddf641c0d7c`, after PR #35. Its push-triggered Personal workflow validation succeeded: [run 40999095720](https://github.com/Chappy1740/DiamondAlibi/actions/runs/40999095720).
- Main requires a PR and successful `validate` check, blocks deletion and force pushes, and requires resolved review threads. Independent approving reviews are not enforced by the ruleset; retain the documented review handshake.
- This Codex branch continues the documentation-only continuity proposal from Claude PR #36 at `f1820c56ba6aedce84c068dc890521b5b18a0ec6`, preserves that branch, and points shared policy authority to eydren-governance.
- The existing exact-main Worker deployment gate is preserved. Current deployed version, physical-phone acceptance and live product acceptance are UNKNOWN in this GitHub-only pass. The dated provider observations below do not establish their current state.
- The native tracker and current screen handoff still own scope and acceptance. Next: review central governance, then this reference update; do not infer completion or replay a release approval from it.

## Historical operational evidence

The sections below are dated receipts and runbooks. Refresh provider state and exact authorization before executing a consequential action.

This runbook supports existing tracker tasks M2-outgoing-email-brand, M5-7,
M5-9, M5-10, M6-4 and M6-5. The tracker remains authoritative. This document
does not approve release, broaden access, remove required features or change
the portfolio delivery order.

## Verified baseline: October 22, 2026, America/Chicago

- Reviewed published source: `dd2dff4a6148496d3f058e4c5f33b4923e0af473`.
- Cloudflare dashboard reported that source at 100% traffic, Worker version
  prefix `6235a541`. It also recorded delivery of the unchanged Beverage Rules
  save fix `1435811d114ba2ec1f81f96014eacf4a9e152065`. Neither receipt proves
  phone acceptance. The current-head check was a successful Workers Build;
  GitHub Actions returned no run for that exact source.
- Workers Free: 301 invocations in the inspected seven-day window, zero recorded
  CPU-limit or memory-limit errors. This is low-traffic evidence, not a capacity
  test. Worker logs/traces were disabled. The provider's Free CPU limit is 10 ms
  per request; displayed CPU percentiles above that threshold require controlled
  validation, not an inference of guaranteed capacity or failure.
- Supabase organization is Pro; the three portfolio projects reported healthy.
  Free-plan inactivity pausing does not apply while that entitlement remains.
- Seven daily database backups, October 16-22, were visible. Point-in-time
  recovery was not enabled. Storage objects are excluded from database backups.
  No restore or off-site backup verification was performed.
- Custom SMTP uses Resend. Its verified sending domain had verified DKIM/SPF
  records. Resend Free showed 11/3,000 monthly emails and 0/100 daily emails.
  The October 8-22 metrics reported 11 messages, 100% deliverability, no bounces
  and no complaints. Delivery does not prove inbox placement or account-flow
  completion. The configured Supabase hourly email value was redacted; do not
  assume the default or that the provider quota is dedicated to this app.
- Zero Trust Free showed six active users out of 50 seats. The preview requires
  login on all Worker URLs. Reviewer allowlists and seat usage are different
  controls; adding a player in the app does not grant preview access.
- Owner approved the recommended fixes in this chat. Only leaked-password
  protection was enabled in Supabase. Dashboard readback and a fresh security
  advisor result confirmed the disabled-protection warning was removed. CAPTCHA,
  password length, other auth settings, Access and billing were not changed.
  Authentication behavior acceptance remains open under M5-7.

Source locations: GitHub repository and check metadata; Cloudflare Worker
Overview/Metrics, Workers plans and Zero Trust Settings/Users; Supabase
organization metadata, Database Backups and Auth settings/security advisor;
Resend Domains, Usage and Metrics. Evidence is dated and must be refreshed
before a consequential action. Never paste tokens, keys, private member lists
or message contents into this public-safe runbook.

## Release validation

### Automatic Worker releases (owner requested October 27, 2026)

The owner requested automatic deployment after approved main merges. This
supersedes the earlier upload-only policy for Worker code once the following
command is enabled. It does not authorize database migrations, authentication
or access changes, spending, or unrelated releases.

- Keep the existing build command `npm run build:worker` and credentials.
- After this change passes PR/main validation, set the **Production deploy
  command** in Cloudflare Settings > Builds to `npm run deploy:worker`.
  Keep Previews Base and branch overrides validation-only
  (`npx wrangler deploy --dry-run`); do not enable preview URLs.
- `scripts/deploy-worker.cjs` requires Workers Builds' full source SHA, main
  branch, build identity and matching Git checkout. It waits up to 15 minutes
  for this exact commit's complete push-triggered `personal-workflow.yml`
  success and its successful `validate` job. It rechecks the latest run/attempt
  and current main immediately before using pinned Wrangler to deploy the
  existing Worker. It records the source/run/build in the deployment log.
- Failures, cancellations, skipped validation, missing/API/rate-limit evidence,
  stale main, changed validation or timeout stop deployment. The gate uses the
  public repository's read-only GitHub API without adding a GitHub secret.
  Cloudflare's overall build limit is 20 minutes; if checks take longer,
  retry the current main build after they pass. No automatic retry loop.
- Migration files must match the reviewed Git tree in
  `scripts/worker-release-policy.json`. Any migration addition/edit/removal
  blocks release until separately approved database work is applied and
  verified, then the fingerprint is updated in a reviewed PR. The fingerprint
  is a source attestation, not a live database inspection. Do not update it
  merely to make a blocked deployment pass.
- A remote main update after the last check cannot be made atomic with the
  provider deployment; keep main delivery serialized and verify the final
  source/version/100% traffic receipt. A changed or uncertain receipt requires
  investigation, not a blind promotion. Preserve the prior compatible version.

Reuse decision (EYD-ARCH-001): retain the existing Node runtime, workflow,
Workers Builds integration and pinned Wrangler. Cloudflare's custom deploy
command alone does not wait for GitHub validation. A small native Node gate
adds exact-source checks without a new library, credential, or service.
Dependencies and lockfile are unchanged.

References: [Cloudflare build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/),
[build limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/),
[GitHub workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs).
Local synthetic release-gate tests cover success/waiting and blocked failure,
wrong/stale source, migration drift, missing checks, reruns and API failure.
Dashboard enablement and a real successful automatic-deployment receipt must
be recorded separately; source merge alone does not establish either.

The workflow in draft PR #9 has triggers for pull requests, pushes to
`main`, merge-queue groups and manual runs. It retains its scoring, disposable
SQL, browser and Worker-build checks, adding the existing mocked password-reset
and feedback API/SQL checks. These additions use synthetic data; they must not
be replaced with `tests/m42-connected.cjs`, which needs hosted accounts and
writes data.

Owner approved publication to `codex/readiness-safeguards`; PR #9 remains
unmerged. Full GitHub Actions validation passed for `daaa0b22` in run
39944611698, including Chromium/WebKit and the Worker build. This is automated
evidence, not phone or hosted authentication acceptance.

October 23 pre-merge checkpoint: the owner approved bounded completion with
no live release. Active GitHub ruleset `main-validation` (25721453) targets
only `refs/heads/main`, with no bypass actors. API readback confirms PRs,
resolved review discussions, up-to-date branches and the `validate` check
from GitHub Actions (integration 15368) are required. Force pushes and deletion
are blocked. Required approving reviews are zero for this solo repository;
chat approval is not an independent GitHub review.

Cloudflare settings were saved and reloaded: main uses
`npx wrangler versions upload`; Previews Base and this PR's existing branch
override use `npx wrangler deploy --dry-run`. Preview URLs remain disabled.
Main builds may upload inactive versions concurrently with validation, but
these commands cannot activate live traffic. A separate exact-version release
decision is required. Other existing branch overrides were not changed and
must be reviewed before reuse.

Diagnostic history: `wrangler preview` required a missing `previews` block.
The branch upload-only attempt compiled successfully, then Cloudflare rejected
its destination with a Worker-name mismatch (build 694ad863). No destination
check was bypassed. The owner chose validation-only branch builds instead of
provisioning a hosted branch preview. Passing them does not prove a functioning
hosted preview or an isolated test database. The old build's Retry action reused
its old command; that retry was stopped.

Before any live release:

1. Verify checks on the final PR head, then checks on merged main and its
   inactive-version upload receipt. This checkpoint precedes final verification;
   record the results in the PR handoff.
2. Prove fail-closed behavior on an approved disposable candidate: failed checks
   prevent merge/release and an older success cannot authorize newer source.
   No deliberately failing candidate was executed in this task.
3. Record exact source, matching validation, schema compatibility, approved
   version activation, prior compatible version and hosted acceptance separately.
   An upload is not release approval. Keep M6-5/M6-7 open without their evidence.

Rollback of published code requires a reviewed revert. Retain required checks
and the no-activation policy during remediation; automatic live deployment
requires its own approval. Never weaken required checks to obtain a green build.

## M5-7: leaked-password protection acceptance

Configuration is enabled; keep acceptance open until an approved isolated test
proves a known weak password is rejected and a strong synthetic password follows
the intended application flow. Only use a specifically approved synthetic
account, never an existing person's password. The owner's authorized test-email
destination is retained privately in this chat; no test email has been sent by
this readiness task. Do not create an account, issue a reset or read an OTP just
to prove configuration readback. Existing sign-in/recovery behavior and weak-
password error presentation need explicit acceptance. Never claim the hosted
provider behavior from the mocked password-reset regression.

If this setting causes a reproduced regression, preserve the error, stop the
affected rollout and request a scoped remediation decision. Turning the setting
off weakens protection and requires explicit approval; it is not an automatic
rollback. No plan upgrade is needed for the current Pro entitlement.

## M5-9: recovery rehearsal proposal

Before scheduling a rehearsal, the owner chooses maximum acceptable lost data
(RPO), maximum recovery time (RTO), the backup location/retention and a cost cap.
Daily backups can lose changes after the last snapshot; no zero-loss promise is
made. Choose whether Storage objects need separate recovery coverage. Existing
daily database backups have no new upgrade requirement; PITR/off-site services
need a separately priced proposal if required by those targets.

Rehearsal scope, pending approval:

1. Use an isolated disposable database and synthetic teams, seasons, plays,
   corrections, rule versions, command journals and audit history. Record
   expected counts and deterministic totals before making a backup.
2. Back up through the agreed mechanism, restore into a different disposable
   destination, and measure actual backup age and restore duration. Never use
   a rehearsal baseline against the production database.
3. Reconcile totals, rules, historical corrections, identity relationships and
   command IDs; retry a previously accepted command and prove no duplicate.
   Prove cross-team read/write denial and revoked-member denial after restore.
4. Verify Storage objects separately if in scope. Database metadata alone does
   not prove object recovery. Identify auth, deployment configuration and secret
   reprovisioning dependencies without copying credentials into reports.
5. Pass only if agreed RPO/RTO, integrity, isolation and object checks succeed.
   A synthetic rehearsal proves the procedure, not restorability of a specific
   production backup. Any later production-backup verification requires its own
   approved private destination, access, data handling and spending scope.
6. Clean up only explicitly approved disposable resources and verify cleanup.
   On failure leave production untouched, retain sanitized evidence and fix the
   runbook before retrying. No production restore is an automatic rollback.

## M5-10 and M6-5: pilot and capacity proposal

The owner decides the expected number of distinct people, peak simultaneous
scorers, onboarding schedule and whether February 1 means an in-season field
pilot, a controlled rehearsal or another explicitly accepted outcome. League
calendar and actual roster sizes are unknown. Keep the original target visible.

Prefer a protected, explicitly approved pilot within existing seats when that
meets the required participant count. If it does not, compare paid Access with
a separately reviewed public application relying on server authorization and
abuse controls. Do not remove Access or silently reduce the 3-5-team target.
Six active seats does not mean every possible invitee is already allowed.

Capacity acceptance, after separate execution approval:

- Agree request-volume, CPU/error and response-time budgets for phone sign-in,
  scoring, refresh, history and simultaneous-client retries. Use synthetic data
  and an isolated target, no production load generator or personal accounts.
- Prove no duplicate plays, stale-write loss, cross-team data exposure or false
  Saved receipts. Include phone background/tab loss and recovery from uncertain
  saves. A low-traffic week is not this test.
- Budget email bursts across all projects sharing Resend and the separate
  Supabase hourly throttle, including retries and password recovery. A 100/day
  provider limit needs a staged onboarding plan if demand exceeds it.
- Recheck Workers and mail quotas before the pilot. Workers Paid was listed at
  $5/month plus usage on October 22; this is an option requiring an owner cost
  decision, not an upgrade instruction. Do not enable billable services here.

Pilot approval must name participants/access scope, permitted synthetic/live
data, critical cases, support owner and rollback/stop conditions. Stop additions
on an isolation failure, duplicate/lost scoring, authentication outage or an
agreed capacity threshold breach. Retain existing approved protections and
data; do not revoke people, delete records or alter production automatically.

## Release and support checklist: M6-4

- Exact source and matching validation evidence; approved schema compatibility.
- Dated deployed version, prior compatible version and approved rollback actor.
- Backup age/coverage, rehearsal result and agreed RPO/RTO.
- Phone, two-client, recovery and email acceptance; truthful known limitations.
- Pilot access/headcount, provider quotas and explicit cost cap.
- Owner's scope decisions and production approval; no silent feature deferrals.
- Support contact/process, incident evidence and escalation/stop conditions.

This checklist is preparation only. No production release, new service,
automated rollback, test email, restore, access expansion or spending is granted
by the checklist itself.

## Owner approval record: PR #33 (agent tandem rules)

- Date: 2026-10-29
- Approved by: Will (owner)
- Scope approved: draft PR first, then merge to main and deploy
  through the existing validation gate. Documentation only
  (AGENTS.md tandem section + CLAUDE.md containing "@AGENTS.md").
- Not approved: any app, dependency, database, auth/access or
  provider-config change. This does not carry over to any other PR.
- Result: merged as 9753ae3. Deployed via the gate (per the PR body).
- Owner acceptance: Will accepted the merge and deploy himself.
- Claude Code review (read-only): 2 files, +12/-0, nothing above the
  tandem section changed. CI and deploy were not re-verified by
  Claude. See PR #33 comment 6501827446.
- Rule going forward: "Merge and deploy" approves only the PR named
  in the message. A new PR needs a new approval.

### Fresh integrated-draft verification

Codex reran TypeScript, all eleven feedback/outbox/Worker tests, original feedback
API/SQL checks, Chromium and WebKit notification component checks, four tracker
checks, password-reset mocks and all 33 release-gate tests; all passed.
Pinned isolated install and npm audit passed (zero vulnerabilities). Normal
Next/Turbopack + OpenNext Worker packaging also passed, superseding the earlier
Windows junction limitation for this integrated candidate. No live writes/mail.
Fresh Cloudflare runtime settings show both FEEDBACK_RESEND_API_KEY and
FEEDBACK_SUPABASE_SECRET_KEY as encrypted bindings; neither value was opened.
Sender, destination, inbox URL and disabled switch remain to configure.
Database migration, enabling notifications, production deployment and actual
inbox-delivery acceptance remain pending their named live scope.

### Wrangler runtime defaults - November 2

Owner requested updating wrangler.jsonc after the dashboard directed them to
source configuration. Declare only the verified-domain sender, protected new-host
inbox URL and FEEDBACK_NOTIFICATIONS_ENABLED="false" in vars. Recipient and
provider/database keys remain encrypted runtime secrets, never source values.
This prepares draft PR #40; it does not activate notifications or approve live
migration/merge/deployment/mail. Existing exact-main and migration gates remain.
Integrated head 6034d3b968ee83667fce98d7df8a80daf41bb5aa passed exact-source
GitHub run 41565874836 and Cloudflare build
57d429f1-600f-4f6e-b21e-f92ffb42c3a1; this new config needs fresh head checks.
Codex also corrected two Windows-encoded dashes introduced in the prior receipt
to valid UTF-8. Continuity GREEN; continue this chat for remaining runtime
recipient setup and the explicitly scoped activation review.

Validation: pinned Wrangler deploy --dry-run passed and displayed the three
expected non-secret vars; seven existing notification/config/Worker tests and
whitespace checks passed. This was local only, without hosted changes or mail.

## Approved activation - November 2, 2026

Owner replied "i approve, commit, push, deploy" to the exact queue migration,
required release configuration, PR #40 merge/deployment, five-minute dispatch
and one synthetic feedback alert to the previously confirmed private recipient
from notifications@mail.eydrenworks.com. Earlier draft-only holds are superseded
for this scope. No historical email batch, extra recipient, new service or paid
upgrade is authorized. Existing credentials and Access stay in place.

Before activation Codex verified head 73957a01b512fc8edb72e25de82c592ab3cb633b
passed GitHub 41570300517 and Cloudflare 8fcf270c-1671-44de-abf7-bb510873c1f9.
Fresh remote main remains 5964cd83f5f4208bad30efbee04f0b883b83e2e2; starting
notification worktree was clean and other open branches do not overlap.

Approved source 20261103003240_feedback_owner_notifications.sql was applied
once by Supabase MCP as recorded version 20261103031503, name
feedback_owner_notifications. This provider-assigned timestamp differs from
the source filename; retain this mapping and do not apply it again. Fresh
checks confirm the trigger, empty search paths/security-invoker functions, RLS,
no anon/authenticated read or claim access, and service-only access. Supabase
default ACLs retain the service role's full table privileges, as on the existing
feedback table; no public grant is present. Security advisors report only the
expected RLS/no-policy informational class for service-only tables, including
this table; no new warning/error class.

No historical rows were queued. One approved synthetic feedback was created via
the existing submission RPC, ID 03ffd3e2-ee97-4b54-91ad-6f218ec8d30d; its
notification is queued for the post-release acceptance test. No player/team data
is in the test. No alert has been sent yet.

Release configuration now records approved migration tree
6dc55326d3dfc1ff283fcbd08ea03bf043b2c882 and enables dispatch. The scheduled
handler also needs NEXT_PUBLIC_SUPABASE_URL in runtime vars; build-only URL
substitution is insufficient for its env argument. The public project URL is
therefore declared alongside the sender/inbox URL. Recipient and keys remain
encrypted runtime secrets. Normal exact-head and exact-main gates still apply.

Continuity GREEN: scope, approvals, source/database mapping and synthetic test
are recorded. Next action: validate/push this release candidate, merge only
after its required checks, verify live version/cron, then inspect only the named
synthetic notification receipt and actual destination inbox. Rollback disables
dispatch/cron and preserves feedback, queue and receipts.

Fresh release-config checks: TypeScript, eleven feedback/SQL/Worker tests,
original API/SQL regressions, all 33 release-gate tests, four tracker tests and
pinned Wrangler deploy --dry-run passed. Dry run shows the runtime database URL
and enabled flag. These checks do not establish active traffic or mail delivery.

## Notification activation runtime correction - November 2

PR #40 merged as c3a3ee1f92d02b1ce106de2c38031d1aacee10bf; exact-main
GitHub validation 41571833625 passed. Initial Cloudflare build
542fa037-c0b7-4552-a17f-d80eadf002e5 stopped on GitHub metadata HTTP 403;
the identical-source gated retry f4e3bcad-d262-4cf3-8058-e10e608f44db passed.
Version 9a02ceba-ed83-4869-8628-fbebe6d16ba1 is verified at 100% traffic,
with dispatch=true, runtime database URL and five-minute cron. Production
custom hostname remains attached; both URLs retain signed-out Access redirects.

The single approved synthetic feedback 03ffd3e2-ee97-4b54-91ad-6f218ec8d30d
was attempted at 03:35:16 UTC November 3, using the correct frozen sender and
private recipient. It recorded provider_unavailable without acceptance. No
actual inbox delivery is claimed. It remains queued under the original bounded
retry/idempotency policy; do not create another test or reset its attempts.

Codex diagnosed a source defect: Cloudflare Workers rejects redirect="error"
at Request construction, before any outbound request. The Node fetch mock did
not model that platform limitation. Use redirect="manual"; existing non-2xx
handling rejects redirects without forwarding credentials to another origin.
Official evidence: https://developers.cloudflare.com/workers/runtime-apis/request/ .

Narrow corrective branch codex/feedback-worker-redirect starts from merged main.
This is completion of the owner's approved notification deployment/test scope,
not a new feature, service, schema, credential or Access change. Reuse installed
Miniflare/workerd through its exported compatibility adapter; no dependency
install/update. Real workerd regression intercepts all outbound requests and
verifies success plus redirect refusal/credential containment. Original mode
was reproduced failing to reach the synthetic provider; manual passes both cases.
TypeScript and fourteen focused feedback/runtime/API/SQL checks pass.

Continuity GREEN: approval, migration mapping, live source/version, failed test
and correction are recorded in the existing handoff. Next: publish the focused
correction, require fresh head/main checks, deploy through the existing gate and
observe the same synthetic job's retry. No key changes are needed for this fix.
