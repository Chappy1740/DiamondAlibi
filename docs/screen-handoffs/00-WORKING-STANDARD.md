# Diamond Alibi — Screen-by-screen working standard

## November 5, 2026 — Roast Club checkpoint (current for Roast Club)

**AMBER.** Roast Club R1–R4 ([#53](https://github.com/Chappy1740/DiamondAlibi/pull/53)–[#56](https://github.com/Chappy1740/DiamondAlibi/pull/56)) are **merged**, with the off switch and smoke test (#60), into main `0d282bf60622dcd01948b5ef1a9a539bc4f26e77`. The hosted migration `roast_club_consent` is **applied and verified** (read-back recorded). **Production is held: not deployed.** Last confirmed deployment: H5 `ff64f0d` (merge of #52; Worker `232bd809-4815-4cd2-ac46-1aebc0b675f3` at 100% when verified about 2026-11-04 14:41 UTC per the [#52 receipt](https://github.com/Chappy1740/DiamondAlibi/pull/52#issuecomment-6633560050)). **Current Cloudflare traffic is UNVERIFIED** (not rechecked); the failed main builds confirm those attempts produced no new release. Main `validate` run `42017788646` passed; the Cloudflare main build check `127212934158` reported failure with cause UNKNOWN (consistent with the migration deploy gate, log not read; earlier main build `cc77500d-ed69-4d41-b76c-f1c6188fb8e7` the same). Hosted rollback-only behavior check passed 16/16 on 2026-11-05 (synthetic data, nothing persisted); operations runbook: [33-roast-club-runbook.md](33-roast-club-runbook.md). Exact evidence, approvals and the single next action: [Roast Club status](31-roast-club-status.md). The owner held #61 at 05:28 CT (history), then explicitly approved merge and deploy of #61 at 09:23 CT; see the update below. This section does not describe H5; older sections below are history. **Update 2026-11-05 09:30 CT:** #61 merged (main `0a1a48cfa5c4e187fb048a9b6c2b65d6768b85dd`), main `validate` and the Cloudflare build succeeded; active Worker version and traffic are UNVERIFIED by Claude, so production is not yet confirmed live.

## November 4, 2026 — H5 final reconciliation for pilot review

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
[Games handoff](02-games.md#november-4-2026--games-score-size-and-compact-competition-leaders), synchronized with tracker revision 85.
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

<!-- Historical H4 receipt; baseline/checks below predate reconciliation. -->

## November 3, 2026 — H4 dropdown fit and three-size scale

**Stage: Tested locally; owner acceptance pending.** Owner said to start H4 while H3 is reviewed unless blocked. H3 does not block development: `codex/h4-dropdown-type-scale` starts from verified H3 head `7b52b44c803528717ccd2e368206f72e2b308526`; its draft PR targets `codex/h3-home-stats-compaction` (#46), so its review diff is **H4 only**. Main remains `c19132d27d8656a3e92fa8d61cbbd1e742ba521a`. H3 is still unmerged; H4 delivery depends on that branch and must be reconciled/retargeted after an authorized H3 merge, not merged independently to bypass review.

### Approved result and reuse

H4 only: full selected dropdown names wrap at word boundaries without automatic hyphens or mid-word breaks. Keep native keyboard/touch selection, accessible labels, selected values, disabled state, form data and existing 44px controls. Existing two-column Home context layout and full-name contract remain.

Reuse DashboardSelect and native CSS instead of a replacement select widget or dependency. Its decorative arrow formerly occupied a separate flex column for every text line; the 320px fixture showed that this squeezed words such as "exceptionally" beyond the available line. Moving the same aria-hidden icon into the visible text area allows later lines the full field width. Normal wrap/word-break and hyphens:none replace overflow-wrap:anywhere. No selection state/event/API changes. Native selects explicitly retain their 16px platform sizing.

Define three rem-based tokens in globals.css: small .75rem (12px), body .875rem (14px), large 1.375rem (22px at the default root size). Apply them through `workspace--type-scale` only to current Home, Games, Stats and Beverage content, including existing headings, summary values, captions and buttons. Native form controls retain their existing platform treatment. No font-family/asset rewrite, global app typography conversion, H2 Games restructuring, H5 scoring flow or H8 opt-out/balance swap. Existing H3 compact layouts/categories are reused rather than rebuilt.

### Files and consumers

- `src/components/dashboard-select.tsx`: decorative arrow placement only; same native select and visible option text.
- `src/app/globals.css`: word wrapping, arrow flow, three tokens and route-scoped application.
- `src/components/player-dashboard.tsx`: class on Home/Games/Stats/Beverage only.
- `tests/home-layout-browser.cjs`: full-name/word-boundary regression at 320–1440px and updated expectations for H4's bounded values; optional 320px screenshot.
- This existing working-standard receipt.

All DashboardSelect consumers were inspected: PlayerDashboard Team/Season/Statistics/Sample player, GameContextPicker Season/League, ConnectedScorebook game chooser. Unrelated native select forms were not converted. Existing Games/scorebook suites check adjacent consumers. The changed shared component does not change server authorization, scoring, saved rules, HR/Bands, stats, Beverage accounting or historical data.

### Verification and limits

Codex local typecheck and test:browser passed. Chromium **and WebKit** Home/Stats suites passed complete selected names, no ellipsis/clipping, one rectangle per word, no automatic hyphens, native keyboard/form values, two-column context layout, 44px controls, Home fit down to 320x568, sample/connected/empty/error/offline states and accessibility. Existing Games flow passed both engines, including context selection, long/enlarged text and 320–1440px. Existing Chromium scorebook modes passed. Existing Beverage controls passed synthetic unchanged-save, replacement, opt-out/rejoin, duplicate/retry, conflict/offline and permission cases.

All records/transport were synthetic/local. No hosted writes, migration, new dependency, provider/access change, merge or deployment. Existing packages/browsers were reused. Local test:browser used the established webpack option on a temporary loopback preview with database configuration blank; no source/config change was needed. The generated next-env edit is excluded. 320px long-name and 390px Home screenshots were visually inspected; no real iPhone acceptance is claimed.

Exact review head, full CI and branch-check receipts live in the H4 draft PR; passing branch validation is not deployment. Claude reviews read-only. Preserve H1's unpushed broader recovery notes and all other branches. Revert only this H4 diff relative to H3 if needed; no data rollback. Current approval excludes H2/H5–H8, merges, deployments, migrations, hosted tests and dependencies. Stop after this draft for the next named approval. Continuity GREEN for the scoped stacked draft; broader pilot acceptance remains open.

Older working-standard entries below retain their historical scope.

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

## November 3, 2026 — H5 Scorebook draft only

Owner approved H5 from current main `4452beadb6f7a83f459a518db91f464f6a185a46`
on `codex/h5-scorebook-flow`: Runs 0–4 buttons, player/result/counts → Send,
five-second authoritative recorded-play receipt and Game details button styling.
The optional thirteen fun labels/three group names are deferred under the
owner's cut-first instruction. Exact brief, verification, exclusions, UAT source
receipt and completion contract: [08-scorebook.md](08-scorebook.md#november-3-2026--h5-scorebook-draft),
linked by release readiness and tracker revision 80. Existing controls, commands,
parser and official-row presentation are reused. No server runs/RBI rule changes
were needed; stop and ask before any such change. Publish this scope as a draft
only: no merge/deploy/migration/hosted test/new dependency/H6–H8. H4 #47 must
precede H2 #49 in a later authorized merge; neither branch is changed. The H5 PR
records final exact-head CI and draft readback. Local automated tests are not
physical-phone acceptance. Continuity GREEN; finish the draft receipt here.

## November 3, 2026 — H3 tie wording refinement

Owner accepted the Stats card appearance after #50 and requested **amount – Tied**, without the number of tied players. Current brief/receipt: [10-stats.md](10-stats.md#november-3-2026--h3-tie-wording), release readiness and tracker revision 80. `codex/stats-tied-label` starts from deployed main `4452beadb6f7a83f459a518db91f464f6a185a46`; continuing H3 delivery authorization covers this presentation refinement. Local checks pass; exact CI/merge/activation and owner tie-label acceptance remain pending at this source snapshot, with final evidence in the correction PR. H2 #49/H4 #47 stay excluded drafts; repo-only agent UAT sharing remains. Continuity GREEN; continue this chat through delivery and return to owner UAT.

## November 3, 2026 — H3 Stats card correction

Owner's phone UAT follow-up replaces the compact card's repeated category caption with **count – leader** beside its identifying circle. Current brief, source, limits, validation and completion-receipt contract: [10-stats.md](10-stats.md#november-3-2026--h3-phone-follow-up-count--leader), synchronized with `RELEASE-READINESS.md` and tracker revision 79. Branch `codex/stats-count-leader` starts from deployed release #48 / main `07e68783081b3c3439be5903abb7904432cbef33`; H2 #49 and H4 #47 remain separate drafts, excluded. The original H3 delivery authorization continues for this requested presentation correction. Local checks pass; exact-source CI, merge, deployment and owner phone acceptance are separate stages recorded in that branch's PR completion receipt. No hosted writes, credentials/access changes, new dependency or other feature is authorized. Continuity GREEN; continue this chat through the scoped release and return to owner UAT.

## November 3, 2026 — UAT release through PR #46

**Owner release authorization:** commit, push, publish, merge and deploy the pending work through PR #46 so owner UAT can continue. H4 / PR #47 is excluded from this release; its already-published draft stays unmerged and undeployed. This supersedes the earlier draft-only delivery limits for the included PRs, not their product scope.

**Recovered; continuity GREEN.** Continue this chat through release verification. Codex freshly fetched main `c19132d27d8656a3e92fa8d61cbbd1e742ba521a`, inspected all open PRs, their exact heads, checks and review threads, and combined #38, #39, #43, #44, #45 and #46 on `codex/uat-release-through-pr46`. Original Codex/Claude branches remain intact. Their original commits are retained as merge parents; no H4 commit is included. The old #38/#39 failures were dependency-audit failures on their older baseline; current main already includes the approved #41 dependency correction. Combined-source CI must pass before merge; the existing exact-main Worker gate remains mandatory.

**UAT sharing decision:** Claude/Codex coordination is repo-only. Results, commit IDs, URLs and acceptance states belong in the shared repository records; screenshots and notes belong in the PR. Neither agent gets a login, Access seat, service token or other credential for hosted UAT/live app testing. The existing Access-protected Worker remains the owner's UAT surface; no new site, preview URL or access change is authorized. Use synthetic or explicitly marked pilot data, never real customer data or PII. This entry and `src/data/project-tracker.ts` synchronize the decision in `RELEASE-READINESS.md`, addressing the open #44 continuity finding.

**Release preparation receipt:** H1 #45 provides the per-game stat line and saved-lineup ordering; H3 #46 compacts Home/Stats and removes the shared SO sentence. #38 adopts the AI-content dependency rule, #39 the private tester-register standard, #43 defers Roast Club until after the November 7 pilot, and #44 records repo-only UAT sharing. None implements Roast Club, H2 or H4–H8. No migration, hosted scoring write, authentication/provider change, new dependency, invitation or test email is part of this release. Existing scoring, isolation, credits, saved rules and required checks remain intact.

**Stage at this source snapshot: Tested locally; full combined CI and live verification pending.** Codex freshly passed typecheck, 16 tracker/sample/personal/season checks, Home/Stats Chromium and WebKit, and the full Chromium scorebook-modes suite on the combined source. Installed dependencies/browsers were reused with a local dependency junction and loopback-only synthetic fixtures; no installs or hosted writes. H1/H3 exact original heads already have successful full CI; the owner relayed independent read-only reviews without blockers. Codex's combined-head checks, merged SHA, exact-main run, deployment/build ID and active-version/traffic receipt are to be recorded in the release PR for `codex/uat-release-through-pr46`; that PR is the completion receipt linked by this handoff, release readiness and tracker. Do not infer current traffic from a branch build or a draft PR. Physical-phone H1/H3 acceptance, A2/A4 retest and the remaining pilot UTA stay open.

**Next:** pass combined CI, merge this release preserving source ancestry, let the existing gated main build deploy, verify its exact source and active traffic, then have the owner refresh the existing phone site and resume A2/H1 and H3 checks. If release fails, preserve the prior compatible deployed source `c19132d` / Worker `02bdcb3a-f4e6-439a-94d7-d356c2bc5350`; rollback only this presentation/documentation release, with no database rollback. Older dated instructions below are historical where superseded here.

Prepared October 23, 2026. These are screen work packages, not permission to change all screens.

## Working agreement

One screen is active at a time. Begin with Home unless the owner chooses another screen. The owner supplies the requested change in plain language or a screenshot. Confirm the exact screen and requested outcome once, then continue authorized reversible preparation and verification without repeatedly asking permission.

The screen's handoff identifies current routes, existing code, preservation rules and focused acceptance cases. Read it together with applicable AGENTS.md and CONTRIBUTING.md. EYD-ARCH-001 (Reuse Before Build) applies: reuse working components, selectors, parser, styles and platform features; do not install a new library for a familiar UI problem without a demonstrated need and approval.

A route inventory is not a claim that every screen needs redesign. Status for all handoffs starts at **Ready for owner brief**. No UI implementation was performed while preparing this pack. Some panels share a URL but have separate handoffs so their scope stays small.

## Current baseline and workspace

- Repository: https://github.com/Chappy1740/DiamondAlibi
- Remote main verified during preparation: 4790f19b7fec25971dfd9490675c3f56905dbdf6, merged PR #11.
- Main checks recorded in PR #11: https://github.com/Chappy1740/DiamondAlibi/actions/runs/39986552234
- PR #11 release receipt records candidate d82b9817 as uploaded but inactive, with earlier security version d6da939d serving traffic at that observation. This pack did not independently refresh Cloudflare traffic. Recheck before hosted acceptance or activation.
- Hosted app: https://diamond-alibi-preview.lanternmere-wow.workers.dev/
- A local preview, uploaded inactive version and live phone site may differ. Every review must state which one is being tested. Do not tell the owner that an absent live control is missing from merged code without comparing versions.
- Error 1102 and production-capacity acceptance remain open in the launch-acceptance chat. Local rendering tests do not resolve that hosted issue.
- Before editing, inspect current branch/status and remote head. Refresh these dated facts without clobbering work. Use an appropriate current checkout/worktree; do not blindly develop from an old local main.

## Screen boundaries

Each handoff states the requested screen, related tracker IDs and adjacent contracts. A shared component may require edits, but its neighboring consumers must be checked. Do not use a screen task to refactor unrelated screens, change scoring, introduce feature policies or rewrite architecture.

Preserve:
- Independent team/season/competition isolation and authoritative server results.
- Settled formulas, runs/RBI boundaries, HR limits/Bands, signed Beverage credits, opt-out history and audited corrections.
- Creator-only Beverage management, all authorized members' scoring access and independent captain self-tag.
- Immutable saved game rules and distinction from current team defaults.
- Existing accessibility, keyboard operation, selected-context navigation, sample/review isolation and truthful save/uncertain/error states.
- Cloudflare Access, required GitHub validation and upload-without-activation delivery safeguards.

Review proposals for voice confirmation, career rankings, reliability, progression and shared alibis are not adopted production policies. They need explicit owner decisions; cosmetic approval does not decide them.

## Authority and data

This handoff pack authorizes documentation/orientation only. A concrete screen-change request authorizes its reversible local implementation and appropriate local checks. CONTRIBUTING.md requires separate specific approval for commits, pushes, publication, merge/deployment, paid actions, new services, migrations and auth configuration. Approvals persist for the exact agreed scope; do not ask twice.

Do not perform hosted writes merely to test layout. Starting a game, recording/correcting a play, creating accounts/teams/seasons/invitations, changing rules or revoking membership needs a named synthetic test case and execution scope. Owner manual test actions do not grant an agent broad mutation permission.

No credential/OTP/password/secret access or publication. Owner handles identity challenges. No new spending, dependency installation/upgrades, public preview enabling, allowlist expansion, Access removal, destructive cleanup or production activation under these screen handoffs.

Obtain specific approval for any test-email action and its destination.
## Acceptance matrix for every changed screen

Use the screen's focused cases plus applicable shared cases:
- Correct connected, sample and review context; anonymous/no-team/no-season/unauthorized states.
- Loading, empty, error, offline and retry/uncertain states that actually exist for the screen.
- Narrow phone, long names, large text/zoom, keyboard/focus, clear labels and no obscured controls.
- Meaningful target sizes and overflow checks. Existing regressions commonly cover 320–1440px and 44px controls; use the applicable established contract rather than inventing a new design standard silently.
- Adjacent shared navigation/styles still work.
- No unintended network/database writes during display-only checks.
- Values remain authoritative and signed correctly; defaults are not substituted for missing historical data.
- Physical iPhone and desktop are separate evidence categories. Automated WebKit is not a real iPhone.

Read test scripts before running them. Referenced tests are relevant starting points, not a guarantee of coverage or a requirement to rerun every script. Use existing focused tests first; add a regression only for meaningful uncovered changed behavior. Run required checks once before approved delivery. Repeat/broaden only for a new change, failure or unresolved risk.

tests/m42-connected.cjs uses hosted fixtures and writes data; do not run under local/read-only approval. “Rollback-only” SQL still requires execution scope when aimed at hosted data. No installs/builds are needed just to read these handoffs.

## One-screen workflow

1. **Brief:** record what the owner wants changed, what stays and the review device/version. Resolve missing decisions that materially affect this screen; do independent inspection while waiting.
2. **Baseline:** inspect actual route/components/state and relevant prior accepted evidence. Reuse existing code. Show a short proposed result if design choices need agreement.
3. **Prepare:** implement only the approved local scope. Keep files and shared-consumer impact clear.
4. **Verify:** focused tests/visual checks and applicable boundary cases. Separate source, local automated, hosted readback and owner/device evidence.
5. **Owner review:** provide the screen preview and a short check. Do not repeatedly ask for identical phone tests already passed unless changed behavior justifies it.
6. **Delivery approval:** show exact files/diff, validation, intended branch/PR and upload/deployment effects. Publish only within specific authorization.
7. **Finish:** verify exact commit/branch/PR/main/check receipts as applicable. An inactive upload is not live delivery. Obtain separate exact-version activation permission if needed, then verify actual hosted behavior.
8. **Close:** record actual outcome and any limits; update existing tracker evidence through the approved process without inventing new task IDs or prematurely closing whole milestones. Move to the next screen only after owner review/acceptance or an explicit scoped hold.

Stage labels must stay precise: Ready for brief; Brief agreed; Local work; Locally verified; Owner reviewed; Committed/pushed; Merged; Uploaded inactive; Activated; Hosted accepted; On hold. Do not collapse all stages into “done.”

## Per-screen completion receipt

Copy this into the finished screen handoff:
- Screen/route and related existing tracker ID(s).
- Owner's requested change and approved scope.
- Files changed and shared consumers checked.
- Baseline/source SHA and review target.
- Focused checks passed; failed/untested cases and evidence type.
- Desktop result; real iPhone result if in scope.
- Commit, branch, PR, merged SHA and matching check links (or explicitly local-only).
- Upload/version/traffic receipt if applicable; activation approval if applicable.
- What changed, known limits, rollback/stop plan and next screen.
- Canonical tracker update status.

A private review note does not itself publish new tracker evidence. Never include synthetic account IDs, private messages or local planning in a public PR just because they appear in private handoffs.

## Rollback and stop conditions

For uncommitted preparation, restore only this screen's known diff while preserving all pre-existing work. For published changes, use a reviewed revert within approval. For hosted activation, retain the prior compatible version and obtain the exact rollback scope; no automatic database restore, security weakening or removal of required checks.

Stop dependent writes on isolation errors, duplicate/lost plays, false Saved receipts, auth outage or breached capacity limits. Preserve evidence and continue independent diagnosis. Do not invent a formula or mutate more data to work around a display issue.

## Prior acceptance that should not be repeated casually

Beverage unchanged-save passed on computer and by owner report on iPhone. Owner deliberately saved Solo 1 to 0 and restored 0 to 1, then confirmed refresh persistence; read-only audit/current-setting queries confirmed those saves. Cancel navigation passed; the exact saved-value checkpoint immediately after Cancel but before re-edit was not separately confirmed. Do not restore Solo again.

Historical games were read back with original rule versions. PR #11 later added a read-only seven-value saved-rule disclosure using the existing game snapshot. Do not rely on the older audit statement that the table is absent from current merged source. It may still be absent on an older hosted version.

Broad physical-phone, concurrency, mail/auth, recovery, capacity and final launch approval remain separate from a single screen's acceptance.

## Existing evidence and canonical records

- Canonical current tracker: https://github.com/Chappy1740/DiamondAlibi/blob/4790f19b7fec25971dfd9490675c3f56905dbdf6/src/data/project-tracker.ts
- Canonical current release guidance: https://github.com/Chappy1740/DiamondAlibi/blob/4790f19b7fec25971dfd9490675c3f56905dbdf6/RELEASE-READINESS.md
- PR #11: https://github.com/Chappy1740/DiamondAlibi/pull/11

## Route aliases and non-screens

/more/team and /more/seasons in the catch-all connected path redirect to /club; use the actual management panels rather than inventing duplicate screens.
/games/live redirects to connected /club/score except the supported sample path.
Explicit /more/profile and /more/settings route files have their own handoffs.
?sample=1, ?shell=1 and review history are distinct demo/shell states, not proof of connected behavior.
/auth/callback and /api/* are redirect/data handlers, not separately redesigned visual screens; their contracts stay covered by the relevant auth/feedback/status handoffs.
Shared header, profile menu, bottom navigation, globals.css, loading/error and 404 states are cross-screen contracts. Recheck consumers when shared code changes rather than redesigning all of them in one task.
