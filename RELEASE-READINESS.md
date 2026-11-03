# Release readiness and recovery

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
