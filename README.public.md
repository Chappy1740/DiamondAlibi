# Diamond Alibi development preview

A phone-first recreational slow-pitch softball application built with Next.js, React and TypeScript.

## Local setup

Use Node.js 24 and the pinned package lockfile. Install dependencies with `npm ci --ignore-scripts`. Copy `.env.example` to `.env.local` and configure the project's Supabase URL and publishable key locally. Never place service-role keys in client configuration or source control.

Run `npm run dev` and open `http://127.0.0.1:3000`. The sample shell uses fictional records. My clubhouse provides authenticated team/season workflows. `/practice` is a separate synthetic scorebook saved in browser storage; it does not synchronize scores across devices.

Run `npm run typecheck`, `npm run test:rules` and `npm run build`. Browser checks require a running preview and Playwright Chromium or `BROWSER_EXECUTABLE` pointing to an installed compatible browser. Run `npm run test:browser`, `npm run test:practice` and `npm run test:alibi`. Connected membership tests require explicitly authorized, isolated synthetic accounts with cleanup; do not use personal accounts.

Hosting configuration is development preparation only. No deployment or production acceptance is implied by a successful local build. Repository publication, hosting changes, authentication configuration and production release require owner approval.

Build the Cloudflare artifact with `npm run build:worker`, then run `npm run preview:worker` for a loopback-only Worker emulator on port 3002. The pinned adapter currently needs a version-checked build compatibility fix for Next.js 16.4's preview-props manifest; `scripts/build-worker.cjs` applies it during the build and restores the installed adapter afterward. Review/remove this fix when upgrading the adapter. A scoped dependency override pins patched glob 10.5.0 under the build minifier.

Public Worker/preview URLs are disabled in the prepared configuration. Deployment requires a reviewed HTTPS access-protection setup and authenticated hosted acceptance. No remote storage/cache service is provisioned by this configuration. The adapter warns about Windows and experimental Node middleware support; prefer a verified Linux build environment for release and test session refresh over HTTPS.

## Password recovery

`/login` links to `/forgot-password`. Requests return a generic response for registered/unregistered addresses, delivery failures and throttling. The server uses only `AUTH_SITE_URL` for email and callback destinations; set it to the exact application origin in each local/hosted environment (HTTPS except exact loopback HTTP). It never trusts request headers or user-supplied redirect targets. The existing `/auth/callback` also requires this setting.

The default Supabase PKCE reset email can redirect to `/auth/recovery`. Open it in the browser that requested the reset. The callback exchanges the code, including `sb_flow_id` when present, and strips credentials from the URL. `/update-password` and its server action require verified, unexpired claims with a recovery AMR no older than 15 minutes, plus a live user check. Passwords must match and contain 12–256 characters. A successful change requests global sign-out; access tokens on other devices can remain valid until their expiry.

Before live acceptance, the owner must approve/verify Supabase's exact redirect allowlist entry `AUTH_SITE_URL/auth/recovery`, email delivery and existing reset template behavior. No auth configuration is changed by this branch. For an approved cross-browser reset template, use `<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset password</a>`; the callback verifies only recovery tokens and ignores `next`/`redirect_to`. Keep the default PKCE template if cross-browser recovery is unnecessary.

Run `npm run test:password-recovery` for security/action checks. `npm run test:password-recovery-browser` starts an isolated local app on port 3010 and a synthetic Auth server, exercises real SSR cookies/PKCE and the password form, and sends no emails. Supply `BROWSER_EXECUTABLE` if Playwright Chromium is unavailable. A passing synthetic test does not establish live email or hosted acceptance. Never use a personal account for automated recovery tests.

## Working from two computers

Each computer uses its own checkout, dependencies and ignored local environment. Finish a branch and publish reviewed changes only when authorized, then fetch/pull on the other computer. Uncommitted edits, credentials and browser practice journals do not synchronize through Git. Use a hosted HTTPS preview to review the same deployed app from computers and phones.

Locked branding artwork remains pending. Text placeholders preserve the selected direction without introducing replacement artwork. No license or asset redistribution rights are granted by this source snapshot.
