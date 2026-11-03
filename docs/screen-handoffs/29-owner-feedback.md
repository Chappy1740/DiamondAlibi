# 29 — Owner feedback inbox: Screen handoff

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** Owner feedback inbox.
**Route/view:** `/owner/feedback`
**Related tracker IDs:** M2-team-phone-review. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Owner feedback inbox only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing owner-only feedback inbox and message review controls.

## What must remain correct

Non-owner access remains denied; do not expose private feedback or change roles/allowlists. Inspect fixtures before rendering screenshots; no real message modifications or deletion during layout review.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/app/owner/feedback/page.tsx`
- `src/components/review-feedback.tsx`
- `src/app/api/feedback/route.ts`
- `src/lib/feedback-access.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check owner versus reviewer/anonymous denial, empty/error/list/detail fixtures, long/untrusted content treated as text, keyboard access and no server-secret leakage.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/feedback-api.cjs`
- `tests/feedback-sql.cjs`
- `tests/game-day-review-browser.cjs`

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

## November 2, 2026 — owner email alerts, local preparation

Current brief supersedes the pending-brief text above for this scoped change.
Owner requirement: new Challenge the Call feedback must notify the owner;
requiring the owner to poll Booth Reviews is an identified pilot gap. The owner
selected their existing personal destination for now; keep its actual value in
private runtime configuration. A dedicated product domain/mailbox is not required.

- Continuity: GREEN. Continue this chat; no separate chat is necessary. Actual
  branch `codex/feedback-owner-alerts`, baseline and checked remote main
  `e46cc42086d675fc2fd89ffb474801690e0a11ae`. Existing open PRs #38/#39 do not
  overlap the feedback implementation. The older primary checkout and its
  existing next-env/private-note changes were preserved in place.
- Implemented locally: durable notification row in the feedback transaction;
  five-minute scheduled dispatch on the existing Worker; bounded retries with
  leases and frozen email payloads; generic Resend alerts linking to the protected
  inbox; queued/retry/attention/provider-accepted status in the owner inbox;
  missing-configuration warning; submit receipt says saved to the owner's inbox.
- Reuse decision (EYD-ARCH-001): extend existing feedback storage, installed
  Supabase client, OpenNext Worker and existing Resend provider. A new mail SDK
  adds no needed capability; built-in fetch is sufficient. A separate queue,
  service or replacement inbox adds operational overhead. No package added,
  upgraded or installed. No infrastructure/service provisioned.
- Privacy: alerts contain only a generic notice, feedback reference and inbox
  link. Name/message remain inside Booth Reviews. Mailbox identity does not
  alter the configured Cloudflare owner identity or team/scoring permissions.
- Retry boundary: maximum five jobs per invocation, twelve attempts per job,
  exponential five-minute-to-one-hour backoff. Active leases prevent competing
  sends; retries stop 23 hours after the first attempt, before Resend's documented
  24-hour deduplication window ends. Provider acceptance is not inbox delivery.
  Exhausted/expired jobs remain visible as needing attention. No historical
  messages are automatically emailed by this migration.
- Locally tested: TypeScript; feedback authorization/API and original SQL
  regressions; eleven focused unit/disposable-SQL/Worker-wrapper checks;
  real-component Chromium and WebKit tests for retry identity, truthful receipt,
  configuration/queued status, owner controls, text safety, 320–1440px layouts
  and accessibility; Next.js production webpack build. No hosted test or email.
- Packaging limitation: OpenNext packaging on this Windows junction-backed
  worktree fails resolving native `sharp` binaries. The standalone Next build
  passes; no dependency or adapter workaround was changed. Linux CI must pass
  the normal Worker build before delivery. This is not a successful Worker build.
- Not merged, not deployed, not hosted-accepted. No real email, live migration,
  provider/auth/access configuration, domain purchase or paid action occurred.
- Owner approval on November 2: in response to the draft-publication request,
  the owner said "yes approve and commit". This authorizes the exact notification
  package's commit, push and draft PR only. Subsequent
  live migration, notification settings/key, cron activation, test email and
  merge/deployment need their named scope after review. Original release gate
  migration fingerprint remains unchanged and blocks unapproved schema release.
- Domain decision: owner chose the existing-domain app hostname
  `diamondalibi.eydrenworks.com` and requested a walkthrough. No domain purchase,
  DNS change, route activation or authentication setting change is performed by
  this publication. Notification recipient remains separately configurable.
- Next action: publish the approved draft and check Linux CI; retain draft for
  review. Use RELEASE-READINESS.md activation/rollback steps after separate live
  approval. Walk through the custom hostname separately, preserving Access.

References: [OpenNext custom Worker](https://opennext.js.org/cloudflare/howtos/custom-worker),
[Cloudflare scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/),
[Resend send API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

### Publication and validation receipt — November 2

- Committed and pushed as `88fc3fac614b3b1e4424f509172ae21726b289b8`;
  [draft PR #40](https://github.com/Chappy1740/DiamondAlibi/pull/40).
  This receipt update adds documentation only to that same approved branch.
- Cloudflare branch build `83c07526-c58c-49e0-ad2d-aad5b482bc13` passed for
  `88fc3fa`, establishing hosted Worker packaging for that exact candidate.
  It does not establish production deployment or migration acceptance.
- GitHub run `41555238834`, job `125652404450`, failed at the existing
  dependency advisory check before the application tests. It reports moderate
  glob/minimatch advisories GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249.
  This feature did not change dependencies or the lockfile. Do not bypass the
  audit or run an unreviewed force-fix; dependency changes need scoped review.
- Owner added the production-only custom hostname. A fresh signed-out HTTPS
  request to `https://diamondalibi.eydrenworks.com/` returned 302 to the configured
  Cloudflare Access login for that hostname. Actual new-host app sign-in and
  feedback have not been accepted. Source inspection also finds password-reset
  origin validation still restricted to the old Worker hostname; preparing the
  new-host origin and auth redirect settings is separate from PR #40.
- Continuity remains GREEN. Next: retain PR #40 in draft, resolve the scoped
  dependency validation blocker with owner approval, and continue the guided
  new-domain authentication setup. No live notification activation occurred.

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
