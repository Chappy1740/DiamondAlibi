# 20 — Sign in and registration: Screen handoff

## November 13, 2026 — PR #104 SMS pilot

**DA-104-20261113 · Partially recovered · AMBER.** Continue this chat:
the current objective and approvals agree with fresh source evidence.
The remaining gaps are provider verification and independent review,
not missing conversation context.

- **Coordination:** Codex implements; independent Claude Code/security
  reviewer reads the exact published head. Scope: invite-only phone
  Auth actions, existing email CAPTCHA compatibility, profile setup,
  tests, a review-only Auth hook proposal and these release records.
  No other branch is owned or changed.
- **Source:** [PR #104](https://github.com/Chappy1740/DiamondAlibi/pull/104),
  `codex/phone-sign-in` at `c8bc01e79dff14b4ad9cea9a9bc15eef8ab66782`
  originally targeted the old #87 branch and conflicted. Its
  [validate](https://github.com/Chappy1740/DiamondAlibi/actions/runs/43262756470)
  and [Workers Build](https://github.com/Chappy1740/DiamondAlibi/runs/131339643093)
  were green. Main `7679ecdd759979c43753f039cc9deee13c6f8ce0` includes
  #87 `41eec59651257905aad9fb5bde5211f3b50f24af` and
  #105 `212c4aaa56b828d15fe742ca2da965a304b0429c`, plus #106–#108;
  validate and Workers Build passed. Main then advanced to
  `79851732093c1a2db654eb024f052d1fc5aaef52` via #110 (AGENTS.md only;
  exact-main validate passed). #109 remains separate and open. The prior privacy patch informed this candidate; the
  unrelated tracker edit in the normal checkout was left in place.
- **Model:** Codex desktop, owner-confirmed selector GPT-6.1 Sol High on
  November 13. Configuration suitable for authentication, abuse analysis
  and multi-layer testing; runtime routing and remaining allowance were
  not independently exposed. Keep this configuration for the bounded
  draft work. No purchased credits, alternate provider or billable
  services were authorized or requested.
- **Reuse:** Keep the installed Supabase client, existing email forms,
  verified contact checks, profile RPC and photo policies. Reuse
  Supabase's built-in Turnstile validation instead of introducing a
  duplicate verification proxy or a new widget dependency. A small
  native widget wrapper handles single-use tokens; the reviewed SQL
  proposal uses Supabase's supported Before User Created hook. No
  package, schema migration or deployment fingerprint changes.

**Completion receipt — Tested locally.** The Worker requires an opt-in
flag, a configured CAPTCHA site key, a trusted request origin and one
exact pilot number. After a valid-format request, success, provider
rejections and non-pilot numbers get the same app result at the same
minimum response window. The provider fetch has a shorter deadline.
Invalid verification uses one generic response; successful verification
requires a session for the expected confirmed number. Profile details
are entered with the OTP, so a corrected retry does not reuse stale
signup metadata. Existing initialized profiles are preserved. Email
sign-in, signup and reset request pass a token when CAPTCHA is configured.

Codex ran typecheck, the production Next/Worker build, 33 Worker release
checks, the existing unit/action and disposable SQL regressions, a pinned
dependency audit (zero advisories), and the new pilot SQL and Chromium
and WebKit synthetic Auth checks. These tests did not exercise Twilio, the hosted
OTP API, or an iPhone. The pilot SQL is a proposal, not an applied
migration. The fresh Supabase advisor returned informational findings
only; it does not check the OTP or Twilio control plane. Cloudflare Access
readback confirmed individual email selectors; the tester's exact
identity and login-method eligibility remain unknown.

**Approval / next action:** Continue scoped draft implementation and
review updates only. No merge, deployment, configuration changes, live
SMS, paid service or Access weakening. First obtain exact-head validation
and independent review, then resolve the provider security gates and
confirm the existing Access identity through the owner. Use the
[release report and iPhone runbook](20-phone-pilot-readiness.md) for
PASS/FAIL/UNKNOWN, approval steps, rollback and owner acceptance.

## November 12, 2026 — Phone sign-in start

**AMBER.** Will asked Codex to start phone sign-in. Local candidate
`codex/phone-sign-in` is based on the open [profile PR #87](https://github.com/Chappy1740/DiamondAlibi/pull/87)
at `277801d7192cdb12acbdb40bc7ec25f8c11a6cef`, which includes main
`b796ed728ea1da046d2173fcd50d0b92f44ba7df`. Keep #87 as the parent of this
work and recheck the diff if its head changes or after it merges.

Use the installed Supabase Auth SDK and existing profile fields and
initialization, with a server-side `DA_PHONE_SIGN_IN_ENABLED` switch that
defaults to off. New players explicitly choose to create a phone account.
Sign-in requests do not create accounts. Verified phone accounts can initialize
their profile and save a photo. The first pass leaves existing email accounts
on the current email flow until verified phone linking and recovery are reviewed.

**Tested locally by Codex.** Production Next.js build with type checking,
199 regression tests, and synthetic Chromium and WebKit checks passed. The
browser checks covered choosing the phone flow, entering a six-digit code,
retrying, explicit new-account registration, and returning to email.

**Hosted checkpoint, November 12.** Will reported a successful Twilio Verify
Console test and saved the Phone provider in DiamondAlibi's hosted Supabase
dashboard. Codex read back that Phone and Email are both enabled and found
zero phone accounts before the first app-side test. The initial owner-run
request returned `sms_send_failed` (422) for an unverified Twilio recipient.
Will confirmed the number in Verified Caller IDs and retried. At 10:41 a.m.
Central, Supabase recorded HTTP 200 for both `/auth/v1/otp` and
`/auth/v1/verify` and one confirmed phone account. This verifies the hosted
provider for the owner's verified test number. The DiamondAlibi phone UI
is a release candidate. Twilio approval to send to new recipients and
the existing Cloudflare Access email gate remain separate launch dependencies.
Will approved committing, pushing, and opening a draft PR for the phone branch.
Next, run GitHub validation and independent review on the draft head.

The [November 6 signup and profile candidate](17-profile.md#november-6-2026--signup-and-private-player-profile)
records the approved signup fields, local verification and remaining approvals.
The screen contract below preserves the original sign-in and recovery behavior.

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** Sign in and registration.
**Route/view:** `/login — existing AuthForm modes`
**Related tracker IDs:** M2-team-phone-review, M5-7. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Sign in and registration only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Existing sign-in and registration presentation, validation and links to recovery/sample entry.

## What must remain correct

Preserve provider security and account enumeration protections. No real-user credential handling, account creation, password testing, email sending or auth-setting change under visual review.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/app/login/page.tsx`
- `src/components/auth-form.tsx`
- `src/app/login/actions.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check empty/invalid fields, pending/error/retry, keyboard autofill labels, understandable mode distinction, recovery link and safe redirect handling in mocks. Actual signup/weak-password rejection remains separately scoped.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/personal-pages-browser.cjs`
- `tests/password-reset.cjs`
- `tests/signout.cjs`

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
