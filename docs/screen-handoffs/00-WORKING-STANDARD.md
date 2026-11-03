# Diamond Alibi — Screen-by-screen working standard

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
