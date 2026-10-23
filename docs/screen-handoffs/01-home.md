# 01 — Home: Screen handoff

**Status:** Home refinement locally verified; continuing the owner-authorized commit, push and deployment flow. **Owner's requested change:** Three-decimal baseball rates everywhere, four matching Home context controls, and quiet refresh with recurring updates restricted to active games.
**Current screen only:** Home.
**Route/view:** `/`
**Related tracker IDs:** M3-9. Verify current canonical evidence before closing any item.

## Start instruction for the next chat/turn

Work on **Home only**. Read [00-WORKING-STANDARD.md](00-WORKING-STANDARD.md), this handoff, applicable AGENTS.md and CONTRIBUTING.md. Ask the owner what they want changed on this screen if the brief has not already been supplied. Do not ask them to reconstruct the earlier audit. First inspect the existing implementation and applicable states; then carry the agreed reversible local work through verification and review.

This document is a screen work package, not blanket implementation/publication/activation approval. Do not create a separate chat unless the owner requests it.

## Screen contract

Personal greeting, personal statistics and Beverage balance; League/Tournament actions; team/season context; profile access.

## What must remain correct

Keep signed-in Home personal. Do not introduce team-wide totals, other players' records or an unapproved sample notice. Keep full selected names visible.

Shared contracts: team/season/game isolation; established scoring/credits/rule versions; current authorization; truthful Saved/offline/error states; sample versus connected separation; accessible keyboard/touch navigation and return context.

## Version and review target

Current implementation baseline: main `61def28c4f8d42369d66db342b72cc9f74dfaf65` / PR #12, verified October 23, 2026. Recheck branch, status and remote main before subsequent edits.

Record whether the owner is reviewing a local preview, inactive candidate or live site. PR #11's last receipt says its candidate is inactive; this pack did not refresh provider traffic. The live screen may differ from merged code. Keep Error 1102/capacity work distinct from visual acceptance.

## Existing code to inspect and reuse

- `src/components/player-dashboard.tsx`
- `src/app/dashboard-loader.ts`
- `src/components/dashboard-select.tsx`

These are verified file paths in the inspected worktree. Trace imports/data contracts as needed rather than assuming this list is the entire dependency graph. Shared-file changes require checking their other consumers.

## Focused acceptance cases

Check signed-in versus sample, account-linked player versus no linked player, no team/season, long labels, credits, archived context, loading/error/offline refresh, and return from competition pages.

Also apply the working standard's relevant empty/loading/error/offline/permission, narrow-screen, long-text, keyboard/focus and adjacent-navigation checks. Use synthetic isolated data. Name any required hosted writes before executing them.

## Existing verification starting points

- `tests/home-layout-browser.cjs`
- `tests/personal-dashboard.test.ts`
- `tests/dashboard-loader.cjs`

Inspect each script's actual coverage and execution target first. These references do not claim all acceptance is already covered. Reuse focused checks; add a new regression only for meaningful uncovered changed behavior. Complete required CI before specifically approved delivery. Do not install or upgrade dependencies just to review the screen.

## Agreed brief

- Requested change: OBP `75.0%` must read `.750` everywhere; all four Home context controls must be evenly spaced with the same appearance; refresh should be quiet and limited to active games.
- Desired result: owner’s two supplied iPhone screenshots, with rate values in baseball notation and Team / Season / Personal stats / Apply context in a matching two-column grid.
- Existing behavior to retain: the screen contract and preservation rules above.
- Data or policy decisions needed: none for this display and refresh scope.
- Review device: owner supplied real iPhone screenshots; local checks use desktop Chromium and WebKit. Updated physical iPhone acceptance remains pending.
- Review version: local build described below; Home entry, context submission and bottom-navigation return checked.
- Adjacent scope: shared baseball-rate presentation and refresh, as expressly requested. No other screen redesign, scoring formula, saved data or feature-policy change.

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

**Current outcome (October 23, 2026):** Local Home implementation and focused verification completed. Owner review and delivery approval remain pending. No commit, push, upload, deployment or hosted acceptance is claimed for this change.

### Local completion receipt

- **Scope:** Home layout; owner explicitly requested baseball-rate formatting everywhere and a shared refresh adjustment. No other screen redesign or new feature policy.
- **Source:** branch `codex/home-only`, based on main `61def28c4f8d42369d66db342b72cc9f74dfaf65` (merged PR #12). Existing laptop changes were copied with hash verification before using a separate, clean, current checkout; original files remain untouched.
- **Result:** shared `formatBaseballRate` produces `.750`, `.000`, `1.000` or an em dash for missing rates. Home, team/tournament leaders, connected statistics and practice statistics use it. Only display formatting changed; rankings still use unrounded values and counts remain counts.
- **Home controls:** native selects and a submit button retain their semantics; equal-width/equal-height cells, matching borders/fill/type, 12px gaps and complete wrapping selected names. Styles apply only to Home. Sample history retains its extra player selector.
- **Refresh:** Home and other dashboard views have no recurring timer or 15-second copy. Manual refresh remains, with quiet refresh on visible return/reconnection and explicit offline/loading feedback. Connected scoring polls every 15 seconds only for the selected active game in score/full mode, while visible and online. Completed, archived, setup, management and unavailable-game views do not poll. Existing save/read locking and uncertain-save recovery remain in place.
- **Files:** `src/lib/baseball-rate.ts`; `src/components/player-dashboard.tsx`, `dashboard-refresh.tsx`, `tournament-leaderboard.tsx`, `connected-scorebook.tsx`, `practice-scorebook.tsx`; Home-scoped additions in `src/app/globals.css`; `tests/baseball-rate.test.ts`, `tests/home-layout-browser.cjs`, `tests/scorebook-modes-browser.cjs`; this handoff.
- **Reuse decision (EYD-ARCH-001):** retain native controls and existing scorebook rate semantics, use a small shared presentation helper and the browser visibility API. Existing components/platform features cover the need; no dependency or service added.
- **Checks passed:** 85 local unit tests; typecheck; production Next build with hosted credentials disabled; diff whitespace check; Home and scorebook modes in Chromium and WebKit; authorized-context loader checks; connected save/correction/offline/retry checks against a disposable local database; both local practice suites; built Home native form submission, 320–1440px layout and automated accessibility. A test selector was corrected and the WebKit reconnect assertion now waits for the React transition to settle; reruns passed.
- **Review target:** loopback-only built app at `http://127.0.0.1:3130/?sample=1`, synthetic sample data. Separate synthetic signed-in Home captures show the four-control layout without an extra sample selector. This local URL works on the laptop; it is not a phone-hosted release.
- **Evidence limits:** automated desktop Chromium and Safari-engine WebKit are local evidence. No physical iPhone test, hosted write, capacity/Error 1102 acceptance, live authentication acceptance or new release claim. No live game/account/rule data changed; no email sent.
- **Delivery:** uncommitted local diff only. No new PR/candidate/version/traffic change. Owner acceptance pending; Home remains the active screen. Canonical M3-9 is unchanged and is not closed by these checks.
- **Rollback:** restore only this documented Home/rate/refresh diff in its isolated checkout, preserving the laptop’s earlier local files. Stop publication if isolation, duplicate/lost-save, misleading Saved state or security/capacity failures appear; investigate without changing live data or protections.

### Delivery authorization — October 23, 2026

After the local review receipt, the owner explicitly instructed: "Yes. I have stated, push commit and deploy". This authorizes delivery of this Home/rate/refresh diff through the existing protected PR, checks and deployment flow. Release is in progress at this source checkpoint; exact commit, checks, merge, provider version and hosted readback will be recorded in the linked PR release receipt. No new service, security weakening, spending, schema change or hosted write test is authorized by this UI release.

### Home summary refinement — October 23, 2026

The owner confirmed the deployed decimal formatting through an iPhone screenshot and requested: top row OBP / Reach Base %, second row Hits / RBI / Home runs / Beverages owed or credit, all centered and evenly spaced in boxes. This continues the active Home screen and its existing commit/push/deploy authorization; no repeated permission request is needed for this refinement.

- Baseline is deployed PR #13, main 3d9b45cc5ddcec5963c36b2f46cd9ad5a93673a6 / Worker version 1f61fa24. Previous delivery checks and 100% traffic were recorded in PR #13.
- Reuse: existing account-linked personal projection, decimal formatter and signed Beverage balance; native definition lists and CSS Grid provide two equal rate tiles above four equal total tiles. No new library, model, service or query is needed.
- Layout: centered My season heading, selected-context text, tile labels, values and balance qualifier. PA is removed from this compact Home summary to match the requested six metrics; its underlying data and full statistics elsewhere remain unchanged. Beverage amount uses an absolute display value with an explicit owed/in-credit/settled qualifier; unknown balance is an em dash with No balance. No-player/no-statistics messages and the previously visible fallback balance remain truthful.
- Scope: Home markup and Home-specific CSS, expanded existing Home browser regression, and this handoff. Other screens, refresh, formulas, saved data, rules, authorization, security settings and dependencies are unchanged.
- Local verification: typecheck; Chromium and WebKit at 320–1440px verify exact 2+4 order, row placement, equal per-row tile dimensions and centered labels/values, context controls, personal-only data, balance states, empty/unlinked cases and refresh behavior. Production CI and exact-source provider upload must still pass before activation.
- Owner review: supplied iPhone image is the brief and confirms the prior decimal fix, not physical-device acceptance of this refinement. Home remains active; M3-9 is not closed by local checks. Final source, checks, version/traffic and hosted readback will be recorded in the refinement PR receipt.
