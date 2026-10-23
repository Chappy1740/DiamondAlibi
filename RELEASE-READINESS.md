# Release readiness and recovery

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
