# 17 — Bio and profile: Screen handoff

## November 10, 2026 — Team-visible profile photos

Will approved the design at 19:05 CT after Claude Code's read-only review.
Codex owns implementation in [PR #87](https://github.com/Chappy1740/DiamondAlibi/pull/87).
Only the owner can add, replace or remove their photo. A viewer can read a
photo when both accounts have an active membership on any shared team.
The roster uses its explicit account link. Guest rows use initials, and
account preferences and team aliases keep their existing visibility.

The private bucket serves the fixed account avatar through authenticated reads.
The app checks current membership on each request and sends private, no-store
responses. Storage policies disallow signed read URLs. In a hosted synthetic
check, load a teammate's photo through both the app and Storage, then deactivate
the last shared membership and repeat the same requests with the same session.
Both paths must deny the next request, including after an earlier cached read.
Verify both teams of a multi-team account, remaining access when a different
shared active team still exists, and denied signed URL creation. Disposable SQL
does not exercise the hosted Storage CDN.

The existing canvas keeps normal uploads at 512px or less and strips source
metadata. Keep the current JPEG and byte limits for the pilot. An owner can
upload directly to Storage, so the app's checks cannot guarantee that every
object lacks metadata. The profile page tells owners who can see their photo.

For an assisted account-deletion request, confirm the request and have the
owner use **Remove photo** while their session is active. Verify that the
Storage API removed the object and stop if it did not. Separately authorized
Auth deletion follows only after reviewing references from teams, roster and
audit data and deciding which records to retain. Keep historical orphan
cleanup as a separate decision. Photo removal uses the owner's session.

Keep signup skill levels pending owner review and test the TypeScript choices
against the SQL constraints. Release requires independent review of the revised
head, required CI, authorization and readback for the hosted migration, and
the revocation check. Apply the migration before deploying code that depends on
it. Keep the existing migration fingerprint until hosted verification.

Codex recovered a clean source worktree at
`a833b95e8cf4cd8588e7928f150dc265d64bfd0a` and cloned an isolated task
checkout. Current main `9a50962ac787749b54b9c90575384edd53367870` was
integrated with a history-preserving merge, retaining the source commit and
the newer owner acceptance records. Will authorized commit, push, merge and
deploy. He also explicitly approved applying and verifying
`20261106164718_player_signup_profile.sql` and
`20261111011626_team_profile_photo_access.sql` on Diamond Alibi's hosted
Supabase project, then updating the deployment fingerprint after review.

Codex's local checks passed for TypeScript, the production Next.js build,
the unit suite, 33 release-gate tests, disposable roster/profile/Storage SQL,
the new route and list-parity tests, and synthetic roster and Home/Profile
checks in Chromium and WebKit. The route tests verify a repeated request
after membership removal reaches 404 before a Storage download. The browser
checks exercise linked-account images, guest initials, preview, replacement,
removal, phone layout and accessibility. The initial sandbox Worker tests
failed on denied loopback connections and passed when rerun with local
server access. Docker's engine is unavailable, so the actual Storage API
and CDN check remains open. Independent review must cover the revised head.

Claude Code reviewed `921b441917c40d85325c2aea5ed61bc14cd7fda1` read-only.
GitHub validation and the Workers build passed on that head. Codex read back
the hosted operation helpers and verified that they normalize the
`storage.` prefix and deny missing operation context. The pinned SDK forwards
the route's cache option to fetch. Follow-up changes make the route test
assert the roster and active membership filters and clarify the profile copy.

Apply the signup/profile migration first and verify the bucket is private
and owner-only. The second migration grants Storage API access as soon as it
is applied. Schedule the synthetic check alongside that migration, while
the bucket contains only test images. If a revoked viewer can still download
the photo, stop the rollout and remove the teammate select policy. Keep the
private bucket and profile columns in place so owner data is preserved.
Restore the previous application version if dependent code has shipped.
Keep credentials with the owner and record only the synthetic outcome.

Hosted readback. The signup/profile migration was applied as
`20261111014757` on Diamond Alibi's Supabase project. Codex confirmed both
profile columns, authenticated-only execution of the new details RPC, and
the private JPEG-only bucket with a 512 KiB limit. The bucket contained zero
objects and still had its owner-only policy at readback. Stage the
owner-run synthetic revocation check before applying the access migration.

## November 6, 2026 — Signup and private player profile

**Tested locally by Codex.** Will approved the signup display name, optional
level and position, private profile photo, and photo selection after email
verification. Codex implemented in `codex/player-profile-signup` from
`028bd942cc54f1f468b37958448a72d12a6a9db9` and reconciled the branch with
GitHub main `496ef3ae767b77c88657385477e2358330891082` before the first push.
The reconciliation retains the merged Beverage Board changes and the Roast Club
and Worker receipts. The owner’s main checkout retains its uncommitted edits.

Reuse the [registration form](20-sign-in.md), account nickname record and Bio
editor. Signup carries the validated answers through email confirmation and
seeds the profile once at verified sign-in. The existing Bio text stays in
Auth metadata. Team creation and invitation redemption can seed legacy
profiles and preserve established account names. Team roster aliases and
captain lineup decisions stay separate from profile preferences.

More → Profile opens the existing page. A native photo picker previews a
normalized square JPEG before saving. One owner-only Storage object per account
supports replacement and removal, with initials when there is no photo.
The existing Supabase SDK handles storage and the browser handles preview,
so the change uses the pinned dependencies. The migration adds nullable
preferences and a private photo bucket. The release fingerprint stays at the
last approved migration tree pending hosted review and approval.

Codex verified the Next.js production build, TypeScript, all 183 unit tests,
33 release-gate tests, password recovery, roster actions, disposable PostgreSQL
profile/roster and Storage policy tests, and synthetic Chromium and WebKit
Home/Profile tests with accessibility checks. Storage policies ran against
disposable tables and the browser used a synthetic upload transport.
After reconciling main, the production build, 183 unit tests, disposable
profile and roster checks, and Chromium and WebKit Home/Profile checks passed
again with the merged Beverage Board coverage.

**AMBER.** Will approved local implementation, verification, commit, and push
of the feature branch. Draft PR publication, hosted migration, deployment, and
phone acceptance remain open. Next action is owner approval to open a draft PR.
Once authorized and published, Claude Code reviews the draft. The hosted
phone check uses a fresh synthetic account to confirm email, preview an iPhone
photo, verify Bio and preferences after reload, replace and remove the photo,
and confirm the initials fallback. Repeat with a legacy account and a second
account to verify photo isolation. The [release checkpoint](../../RELEASE-READINESS.md#november-6-2026--player-profile-local-candidate)
and tracker M3-9 record the release boundary.

## November 5, 2026 — Clubhouse Extras pilot candidate

Will requested the **Clubhouse Extras** preview for the pilot. Its profile-menu
link uses the tagline “Cold ones. Hot takes.” and opens `/more/clubhouse-extras`
with separate Beverage and Roast Club choices for the selected team. Moving
the existing preferences section reuses the team selector, active membership
checks and save actions. A second settings implementation or library would
duplicate those behaviors. The release diff is scoped to the menu and opt-in
page, with the existing Beverage roster typography retained.

Codex recovered the uncommitted `codex/clubhouse-extras` preview based on
`c136e17ecdbce745abcb400904abbad2c15edd44` and applied the scoped changes to an
isolated `codex/clubhouse-extras-pilot` checkout based on verified GitHub main
`95a8c4953b4121b544b07b4a88b5ffaef059bef2`. The original preview is preserved.

**Tested locally.** The production Next.js build (Webpack), TypeScript,
navigation and Roast Club unit tests, dashboard loader, and signed-out route
redirect passed. Chromium and WebKit verified menu entry from the Beverage
Board, independent saves across two teams and reloads, inactive-team denial,
44 px controls, and automated accessibility. Both opt-in actions fit above
the bottom navigation at 390 × 844. The standalone Roast Club control test
reports the same 320 px overflow in Windows WebKit with both main and candidate
styles. The new page passed its 320 px check.

**AMBER.** Will approved committing, pushing, merging after validation, and
deploying Clubhouse Extras to the pilot. [PR #78](https://github.com/Chappy1740/DiamondAlibi/pull/78)
records the Claude Code review and current checks. Bio & profile continues to
use the existing active-team filter for return links. Release through the
existing main validation gate. Hosted phone acceptance is pending.

## November 5, 2026 — Team participation preferences

This records the earlier placement before the Clubhouse Extras pilot change.

Will asked to put Beverage participation and Roast Club under **Profile menu →
Bio & profile → Team preferences**, with the Beverage tab reserved for team and
season balances. Codex implements this screen-placement task on the isolated
`codex/team-participation-preferences` branch from main
`0a1a48cfa5c4e187fb048a9b6c2b65d6768b85dd`. Claude's open Roast Club announcer
and scorer work is separate.

The profile opens with the team from the current dashboard, or the existing
saved selection for a direct visit. The section names the team and lets a
player switch among active memberships. The two choices save independently
through their existing controls and server actions. Switching teams drops the
previous team's season. [Beverage Board](11-beverage-board.md) shows balances,
and [the smoke test](32-roast-club-smoke-test.md) uses the profile entry.

Reuse the existing active-membership filter, native team selector and
participation controls. A separate settings store, new dependency or custom
selector would duplicate working authorization and input behavior. This change
requires no schema or provider changes.

**Tested locally by Codex.** The production build, TypeScript, the scoped
dashboard loader, and Beverage and Roast Club regressions passed. Chromium and
WebKit passed the profile entry from the board, independent choices for two
teams after switching and reloading, inactive-team denial, and phone layout
and accessibility. The built sample board also passed season switching and
scope independence. Hosted phone acceptance remains open.

**Continuity:** GREEN for the combined placement. Will approved committing,
pushing, and deploying this change on November 5 and then confirmed that both
controls belong under the account area. Claude's
[PR #69](https://github.com/Chappy1740/DiamondAlibi/pull/69) is a separate,
overlapping Roast Club-only placement. Release the combined placement through
its own PR and preserve Claude's branch. The tested work was brought onto main
`5352920ef26ee25421cf80330e53f1d3f026ea3e`, which had added only the previously
merged announcer fix. The migration fingerprint still matches main. Next action
is validation and release of the combined PR through the existing gate.

## Historical screen brief

**Status:** Ready for owner brief. **Owner's requested change:** Not yet supplied.
**Current screen only:** Bio and profile.
**Route/view:** `/more/profile`
**Related tracker IDs:** M3-9. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Bio and profile only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Private nickname and bio editing plus navigation back to Home/account.

## What must remain correct

Account profile fields must not replace team-specific roster aliases. No auth credential changes or user_metadata-based authorization. Profile saves require a scoped synthetic user case.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Baseline source: main `4790f19b7fec25971dfd9490675c3f56905dbdf6` / PR #11, verified October 23, 2026. Recheck the current branch, working tree and remote main before edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/app/more/profile/page.tsx`
- `src/components/profile-menu.tsx`
- `src/components/club-form.tsx`
- `src/app/club/actions.ts`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check signed-out redirect, missing/error profile, nickname length 40, bio length 400, validation and error messaging, own-account privacy, keyboard labels and cancellation/navigation.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/personal-pages-browser.cjs`
- `tests/personal-workflow-browser.cjs`

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
