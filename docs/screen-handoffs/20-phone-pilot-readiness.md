# PR #104 SMS pilot — release readiness and iPhone runbook

**November 13, 2026 · AMBER · Hold SMS activation.** Codex owns the
implementation. The objective is one invited pilot, with an SMS-based
Diamond Alibi account and existing Cloudflare Access controls intact.
Hosted Supabase Phone was temporarily disabled under separate approval;
Email remains enabled. Twilio Verify geography and Fraud Guard were
updated under separate approval. Activation, live SMS, additional provider
changes, paid services, merge and deployment still require approval.

| Acceptance criterion | Status | Evidence or exit condition |
| --- | --- | --- |
| No unresolved Medium-or-higher security findings | **FAIL** | Direct managed Auth enumeration and direct SMS paths remain open review findings below. The app-level fix does not change the Supabase API. |
| Final PR head passes required CI | **UNKNOWN** | [Validation](https://github.com/Chappy1740/DiamondAlibi/actions/runs/43457167229) passed on the previous draft head `5e9c34bd1c61462ff24a08e1fd2cbf1f7b281c3d`. Main advanced to `109b0644aebb296c17a6adeb9c03a4ff855060d9`. The reconciliation passed local checks and needs a fresh GitHub run. Require strict `validate`, Workers Build, no conflicts and resolved review threads. |
| Independent review approves the actual final commit | **UNKNOWN** | No approving review on the candidate. Obtain a read-only security review on the exact published head after changes; retest if it changes. |
| Twilio and Supabase restrictions verified | **UNKNOWN** | Twilio allows SMS & RCS only for the U.S., blocks Voice for all 249 destinations, and shows Standard Fraud Guard for the U.S. Safe List exceptions, effective rate limits, and controlled delivery are unverified. Supabase Phone is off and Email is on. Hosted CAPTCHA, SMS route behavior, and pilot-only enforcement remain unverified. |
| Invited tester signs up without an email-based app workaround | **UNKNOWN** | No live test in this pass. The existing Access email identity requirement is separate from the SMS-only app account. Exact identity eligibility and delivery are unverified. |
| Existing email authentication remains functional | **UNKNOWN** | Local synthetic sign-in, signup and reset request passed with CAPTCHA, and existing local validation also passed with CAPTCHA off. Hosted compatibility after enabling the project-wide control is untested. |
| Deployment and rollback procedures documented | **PASS** | Sequencing, release holds, rollback and owner decisions are below. Procedures have not been executed on hosted services. |

## Findings and provider exit tests

- **High — direct SMS abuse / pilot bypass.** The Worker flag and pilot
  destination check guard app actions only. The public project endpoint
  is reachable independently of Access. OTP, signup and resend are
  distinct send routes; existing authenticated accounts can request a
  phone change through the Auth user API. The proposed Before User
  Created hook denies other new phone accounts, but it does not cover
  existing accounts, phone changes, all OTP sends, or abuse of the
  permitted number. Read back and verify each route and cost control.
  Until then the pilot stays off. If the historical Phone provider is
  still enabled without controls, request a separately authorized
  containment decision promptly.
- **Medium — direct enumeration.** Upstream Auth can emit
  `otp_disabled` for a nonexistent number when `create_user=false` and
  takes a different database and delivery path for existing numbers.
  CAPTCHA and throttles increase effort; they do not normalize provider
  status, bodies, headers, cooldowns or timing. A Worker proxy and database
  network restrictions do not remove the public Auth path. Require either
  a verified managed provider fix or a separately reviewed design that
  makes the phone Auth path inaccessible to untrusted clients. Keep SMS
  off if valid-challenge requests still reveal existence.
- **Medium — custom Twilio limits not proven.** The upstream built-in
  Twilio Verify adapter does not populate the Verification API's
  `RateLimits` field. A configured custom service limit does not prove
  that requests are metered by that key. Verify the actual adapter,
  built-in Verify limits and the independent Supabase project, per-number
  and verification attempt limits. If required limits are not enforceable,
  approve a separate implementation or keep SMS off.
- **Medium — recycled number / recovery.** The app offers no self-service
  number change or recovery. Verify that direct authenticated phone
  changes cannot bypass pilot controls before enabling SMS. Agree to
  supervised recovery before launch and do not expand to general
  registration until independent reauthentication is supported.

Suggested controls to approve and verify in the exact project and Verify
service: Supabase Turnstile enabled, phone confirmation required and no
fixed test OTPs in production; set an initial ceiling of 10 SMS per hour
for the pilot, at least 60 seconds per destination between sends, short
six-digit OTP expiry (target five minutes) and a bounded verification
attempt rate. Read back effective limits, including the actual Verify
token expiry, before claiming these values. Keep only the approved
destination country on Verify SMS with Fraud Guard monitoring; block
unneeded destinations/channels and review any Safe List exceptions. A
`+1` prefix alone is not a US destination check. Confirm trial status and
approved recipient eligibility without adding an exception or upgrading
the account. Assign an owner to watch Auth OTP/verify failures, Verify
Fraud Insights, sends and spend during the test. Stop on any unexpected
destination, burst, provider error trend or cost outside the approved cap.
Use redacted counts and timestamps; exclude numbers, challenge tokens,
codes, session tokens and credentials.

In an existing approved disposable Auth environment, use synthetic
existing, unknown and pending numbers. With the exact managed Auth
version and effective configuration, test direct `/auth/v1/otp`,
`/signup`, `/resend`, `/verify` and authenticated `/user` phone change.
Verify missing, invalid, expired and reused challenge behavior separately
from successful CAPTCHA. Compare invalid-code and known/unknown responses
for HTTP status, body, size, headers, repeated requests, rate and cooldown
behavior, and randomized timing samples. Verify non-pilot account
creation and sends are denied, including authenticated phone change.
Test retries with corrected profile details, app sign-out/sign-in and
email with CAPTCHA. An isolated Supabase instance can use fixed codes for
synthetic numbers with a short lifetime, or use a controlled test SMS
receiver; never add a fixed OTP for a real user or to production. Fixed
codes do not test Twilio or carrier restrictions. Twilio Verify test
credentials do not exercise Verify delivery; that requires the separate
live SMS approval. Do not probe production send endpoints under the
current authorization.

## Account recovery and number changes

For this pilot, keep the account on its original Supabase user ID. Do not
create an email account to recover the user's teams or stats. Treat a
reported lost phone, SIM swap or number reassignment as a lockout: confirm
identity through a previously agreed independent channel, revoke refresh
sessions and account access where appropriate, account for already issued
JWT lifetime, and record only a redacted event. If the owner cannot verify
identity independently, leave the account locked. Never ask for an OTP,
accept caller ID alone or infer ownership from a roster name.

Before offering self-service changes, require fresh authentication and
independent proof of the existing account (for example a pre-enrolled
passkey or authenticator), then verify the new number with the provider's
`phone_change` challenge. Keep the same account ID; revoke old sessions,
confirm the old number cannot sign in and notify the user through the
independent channel. For the pilot any administrative change requires
separate authorization, an independently verified recovery process, and
reverification of the allowlist/limits. Leave it unavailable if managed
Auth cannot enforce that policy on the direct API.

## Release and rollback

1. Keep the Worker SMS flag off. Verify current main, draft head and
   merge-triggered Worker delivery. Publish reviewed code to the existing
   draft only. Require green exact-head CI, resolved threads and
   independent review; provider findings are release blockers.
2. Prepare a redacted read-only settings snapshot for the exact Supabase
   project, Twilio Verify service, Worker and Access app. Confirm one
   existing Access identity under the current login method by exact
   match or owner-run Access policy test. If the tester has no eligible
   identity, stop and let Will decide whether to approve an exact
   identity addition with existing requirements intact. Do not add a
   bypass or broaden a rule.
3. With separate approval, apply the exact reviewed Auth hook SQL (starts
   with no pilot) and activate the hook after verifying grants. Use the
   same single approved number in the private hook and Worker runtime
   settings; never put the number in GitHub. Configure CAPTCHA, verify
   email continuity and add provider restrictions in a coordinated
   sequence that keeps the phone path disabled until verified. Turnstile's
   site key is public; the validation secret belongs only in Supabase Auth.
4. Only after the provider and security gates pass, obtain explicit
   exact-head merge and Worker deployment approval. The main push can
   trigger Workers Builds. Preserve the approved profile/Storage migration
   fingerprint and deployed Edge Function compatibility. Record prior and
   candidate Worker version IDs, exact-main CI, Workers Build and active
   traffic. Release with SMS hidden first, verify email sign-in, and
   activate the one-recipient flag only with explicit pilot authorization.
5. On any stop condition, halt tests and tell the owner. On preapproved
   rollback, disable SMS at Supabase or contain delivery at Twilio first
   to stop direct sends, then disable the Worker flag and remove the
   private pilot allowlist entry. Do not disable the signup hook while
   Phone can still accept requests. Preserve Access and email. If reverting
   to a Worker without CAPTCHA support, coordinate with the prior Auth
   settings to avoid locking out email; record the provider and Worker
   configuration readback, active traffic, and email smoke check. Revoke
   sessions on suspected compromise. Retain the account and audit records.

## Live iPhone acceptance — owner-run after explicit approval

1. Confirm the approved build and active version, the expected Access
   identity and its existing login method, pilot number and allowed cost
   cap through a private channel. Use Safari on the iPhone in a clean
   session; record Safari and Home Screen app separately if both are
   in scope.
2. Open the protected app and pass Access normally. Choose **Use a mobile
   number**, then **Create a pilot phone account**. Complete the challenge
   and request one code. Confirm SMS delivery and enter the six digits
   using iOS autofill if offered. Stop for a missing or unexpectedly
   delayed text until the cooldown and budget are checked.
3. Enter the correct display name and optional fields; verify the code.
   Confirm the correct profile and private photo prompt. In the separately
   approved retry, correct the fields after a failed/expired-code attempt
   and confirm one account/profile with only the corrected values.
4. Upload an approved non-sensitive photo. Confirm it persists after
   refresh, appears on the correct profile, and does not alter a team
   roster alias. Verify sign-out returns to sign-in and the profile is
   unavailable signed out.
5. Use **Sign in with your phone** to request a second code. Verify the
   same account, profile and photo. Check an existing email user's
   sign-in on the same build without enrolling a new email account for
   the tester. Record PASS/FAIL/UNKNOWN per step and the build/time only.
   Review redacted provider counts and leave general phone registration
   closed. Do not send beyond the approved budget.

## Source references

[Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha) ·
[Rate limits](https://supabase.com/docs/guides/auth/rate-limits) ·
[Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) ·
[Testing Auth flows](https://supabase.com/docs/guides/auth/testing-auth-flows) ·
[Upstream OTP handling](https://github.com/supabase/auth/blob/master/internal/api/otp.go) ·
[Upstream Twilio adapter](https://github.com/supabase/auth/blob/master/internal/api/sms_provider/twilio_verify.go) ·
[Twilio Verify service limits](https://www.twilio.com/docs/verify/api/service-rate-limits) ·
[Verify Geo Permissions](https://www.twilio.com/docs/verify/preventing-toll-fraud/verify-geo-permissions) ·
[Verify Fraud Guard](https://www.twilio.com/docs/verify/preventing-toll-fraud/sms-fraud-guard) ·
[Cloudflare Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).

- Handoff ID: HANDOFF-20261113-DA-104
- Status: Ready for Review
- Relevant environment (no secrets): isolated Windows candidate; synthetic Auth and disposable PostgreSQL; hosted settings read-only.

## Project and repository
- Coordination contract: GitHub-first
- Work item (issue/task URL or ID): https://github.com/Chappy1740/DiamondAlibi/pull/104
- Active implementer: Codex
- Receiving implementer (if transferring): None
- Review-only agent (if applicable): Claude Code or independent security reviewer
- Project: Diamond Alibi
- Repository (owner/name): Chappy1740/DiamondAlibi
- Continuity state at handoff: AMBER — local checks pass; direct Auth findings and hosted acceptance open.

## Objective and phase
- Objective: Secure SMS signup and repeat sign-in for one invited tester, with general registration closed and existing Access requirements intact.
- Phase: Draft review. No activation approved.

## Verified source
- Branch: codex/phone-sign-in
- PR URL: https://github.com/Chappy1740/DiamondAlibi/pull/104
- Previously verified PR head: `5e9c34bd1c61462ff24a08e1fd2cbf1f7b281c3d`.
- PR base branch: `main`.
- Main merged into this candidate: `109b0644aebb296c17a6adeb9c03a4ff855060d9`. Use the PR for the current published head.
- Verified how and when: November 13 GitHub PR/checks and isolated local fetch; the regular checkout's unrelated tracker edit is excluded.

## Status ladder
- App pilot flow and CAPTCHA compatibility — Tested — Codex local action tests and loopback Chromium/WebKit, no real delivery.
- Before User Created hook proposal — Tested — Codex disposable PostgreSQL; no hosted schema or provider setting changed.
- Exact-head independent security review — Not started — No approval observed for the candidate.
- Pilot iPhone acceptance — Not started — Explicit SMS and release approval required.

## Outstanding work
- Read back and verify restrictions, resolve direct API findings, establish exact Access identity, and secure independent review on the actual head.

## Decisions and requirements
- Keep one pilot, disabled by default, with no general registration or new dependency — sign-in handoff and PR.
- Keep Auth hooks, CAPTCHA and provider settings separately approved; no live testing with fixed codes on production — this runbook.
- EYD-MODEL-001 v1.1: owner-confirmed GPT-6.1 Sol High selector, configuration observed; runtime and exact remaining allowance UNKNOWN. No switch or paid action. Suitability of selected configuration PASS; no paid continuation approved.

## Bugs, blockers and dependencies
- #87 and #105 are ancestors of current main. Reconciliation retains #106–#110, including #109's sign-in mount reset for the previous profile photo.
- [Main CI](https://github.com/Chappy1740/DiamondAlibi/actions/runs/43462176435) failed intermittently when WebKit reported a speculative `/review` fetch. This candidate turns off prefetch for the affected return link and tests the return navigation and same-origin frame. Existing error assertions still run. Local Chromium and eight consecutive WebKit runs passed the updated regression test.
- Direct Supabase Auth response/timing, abuse paths, effective Twilio limits, phone change and hosted email compatibility are open.

## Authorization boundaries
- Granted (exact scope, what remains): Scoped implementation, tests and review updates on the existing Codex-owned #104 draft.
- Pending owner decision: Provider/hook configuration and containment; identity eligibility; exact-head merge/Worker release and bounded iPhone SMS run after security gates.
- Not authorized: Merge, deploy, send live SMS, change provider configuration, introduce billable services or weaken Access.
- Transfer approval and preserved work (if transferring): None.

## Evidence references
- Sign-in screen handoff and completion receipt; RELEASE-READINESS.md; project tracker M5-7.
- Prior baseline #104 CI run 43262756470 and current main validate run 43453409308; exact candidate CI is tracked on the PR.

## Unknowns and discrepancies
- Direct managed Auth behavior with a valid challenge, effective Twilio controls and invited tester Access identity/eligibility have no fresh end-to-end evidence.

## Next action
- Main next action: Independently review the exact published PR head and verify exact-head CI; hold release for unresolved security findings.
- Acceptance criteria: Strict validate, Worker build and review gate pass on the actual head, plus each acceptance row above.
- Queued (max 2): Verify approved provider controls and close findings; run the separately approved iPhone pilot.

## Receiving-session acceptance
- Recovery outcome: Partially recovered
- Disposition: Recovery pending
- Evidence and remaining restrictions: Old draft/head and its main dependency are verified; current provider and iPhone evidence is absent. No authority transfers.
