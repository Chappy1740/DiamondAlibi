# 21 — Forgot password: Screen handoff

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** Forgot password.
**Route/view:** `/forgot-password`
**Related tracker IDs:** M2-outgoing-email-brand, M5-7. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Forgot password only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing recovery request form, neutral confirmation and return navigation.

## What must remain correct

Do not reveal whether an email exists or issue real reset mail without the approved synthetic action. Obtain approval for the exact test recipient and reset action.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/app/forgot-password/page.tsx`
- `src/app/forgot-password/actions.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check malformed/blank email, pending/retry/error/success without enumeration, accessible announcements, back-to-login and preserved recovery link behavior in mocks.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/password-reset.cjs`
- `tests/personal-pages-browser.cjs`

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

## November 2, 2026 — custom hostname compatibility, local candidate

Owner chose `diamondalibi.eydrenworks.com` on the existing domain and requested
a guided setup. This paragraph supplies the scoped brief; it supersedes the
pending-brief text above for hostname compatibility only.

- Continuity: GREEN. Actual branch `codex/diamond-alibi-hostname`, baseline and
  checked remote main `e46cc42086d675fc2fd89ffb474801690e0a11ae`. The separate
  notification branch/draft PR #40 is preserved and is not part of this diff.
  Open PRs #38–#40 do not change the forgot-password action or its focused test.
- Owner screenshot shows the custom hostname attached to Production only.
  Fresh signed-out HTTPS read returned 302 to Cloudflare Access login for this
  hostname; no certificate bypass or public-access change was needed.
- Later owner screenshot shows the retained old reset callback and both exact
  new-host callbacks in Supabase Redirect URLs. Site URL remains on the existing
  Worker hostname pending coordinated release and hosted acceptance.
- Implemented locally: add only the exact new HTTPS origin to the existing
  password-reset request allowlist. Keep the original HTTPS origin and existing
  local-development behavior. No arbitrary Host, wildcard or submitted URL is
  accepted as an email destination.
- EYD-ARCH-001: reuse the existing origin check and installed esbuild/Supabase
  mocks. A library or replacement auth flow adds no needed capability. No
  dependency, schema, provider secret or sending service change is proposed.
- Tested locally: `node tests/password-reset.cjs` passes with existing flow and
  both valid origins, correct new-host callback, HTTP/lookalike/path/port denial
  before any mocked mail call. TypeScript passes. No real account, reset email,
  password, session or hosted auth setting was changed by the agent.
- Owner approval November 2: after the scoped hostname draft request, owner
  said "approve, commit, push, and deploy". This grants publication and deployment
  of the hostname patch through the existing reviewed/validated release process.
  It does not authorize notification PR #40, dependency upgrades, live schema
  changes, auth-provider configuration, test email, new services or spending.
- Stage: Implemented and locally Tested; publication/deployment approved but
  not yet completed and not hosted-accepted.
- Next: publish this scoped PR and inspect exact-source checks; preserve the
  existing dependency advisory gate. Before switching Site URL, deploy the
  approved hostname support, keep old callbacks, then accept actual new-host
  sign-in and an explicitly approved single recovery test. Do not repeat the
  tester feedback submission while email notifications remain undeployed.

Reference: https://supabase.com/docs/guides/auth/redirect-urls . Related rollout
receipt: RELEASE-READINESS.md; related acceptance: tracker M5-7.

### Approved dependency unblock — November 2

Hostname implementation is committed/pushed as
`574c879f4dcf8dfb15220de0e8167926d1bb7565`, draft PR #41. The owner approved
hostname commit/push/deployment earlier. Required run `41556959405` failed the
existing dependency advisory step; notification PR #40 remains separate.

In response to the exact proposal to update glob 14.0.2, minimatch 11.0.1 and
their necessary lockfile entries before continuing the approved deployment,
the owner replied "I approve". That scoped dependency update is now authorized;
do not re-request hostname deployment approval. No audit bypass, force-fix,
parent adapter downgrade, unrelated package upgrade or new service is allowed.

EYD-ARCH-001 review: reusing the vulnerable installed versions leaves the
mandatory gate failed; replacing the glob implementation or maintaining an
application patch has more compatibility/maintenance cost. Select the upstream
patched releases with exact npm overrides and review their necessary lockfile
impact. npm registry and upstream releases show both patches published October
27, 2026; Node engines `18 || 20 || >=22` include the project's Node 24 CI.
Both use BlueOak-1.0.0, not MIT; preserve notices per THIRD-PARTY-NOTICES.md.
path-scurry moves to 3.0.0 and @isaacs/nonrecursive-glob-match resolves to 1.0.3;
obsolete nested glob 10/minimatch 9 and their unused dependencies are removed.
No other direct package or adapter/runtime version changes.

The hostname worktree now has its own pinned dependency installation. Its
former node_modules junction was removed without touching the shared checkout.
Codex validation in this session passed: clean pinned `npm ci` in the isolated
worktree, `npm audit --audit-level=moderate` (zero vulnerabilities), TypeScript,
password-reset mocks, 33 release-gate tests, installed glob async/sync/brace
matching and minimatch/minifier-core load, and the normal `npm run build:worker`
(Next/Turbopack and OpenNext packaging). This is local packaging evidence, not
production activation. No shared dependency directory was modified.
Next: publish this scoped update to PR #41, require exact-head CI, then merge
and verify the existing exact-main deployment gate and active version. Existing
hostname deployment approval remains valid; no real recovery email is implied.
