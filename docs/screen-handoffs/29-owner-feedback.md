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

## November 2 continuation � notification draft refreshed

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
