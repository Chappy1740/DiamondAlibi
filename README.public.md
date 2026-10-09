# Diamond Alibi development preview

A phone-first recreational slow-pitch softball application built with Next.js, React and TypeScript.

## Local setup

Use Node.js 24 and the pinned package lockfile. Install dependencies with `npm ci --ignore-scripts`. Copy `.env.example` to `.env.local` and configure the project's Supabase URL and publishable key locally. Never place service-role keys in client configuration or source control.

Run `npm run dev` and open `http://127.0.0.1:3000`. The sample shell uses fictional records. My clubhouse provides authenticated team/season workflows. `/practice` is a separate synthetic scorebook saved in browser storage; it does not synchronize scores across devices.

Run `npm run typecheck`, `npm run test:rules` and `npm run build`. Browser checks require a running preview and Playwright Chromium or `BROWSER_EXECUTABLE` pointing to an installed compatible browser. Run `npm run test:browser`, `npm run test:practice` and `npm run test:alibi`. Connected membership tests require explicitly authorized, isolated synthetic accounts with cleanup; do not use personal accounts.

Hosting configuration is development preparation only. No deployment or production acceptance is implied by a successful local build. Repository publication, hosting changes, authentication configuration and production release require owner approval.

Build the Cloudflare artifact with `npm run build:worker`, then run `npm run preview:worker` for a loopback-only Worker emulator on port 3002. The pinned adapter currently needs a version-checked build compatibility fix for Next.js 16.4's preview-props manifest; `scripts/build-worker.cjs` applies it during the build and restores the installed adapter afterward. Review/remove this fix when upgrading the adapter. A scoped dependency override pins patched glob 10.5.0 under the build minifier.

Public Worker/preview URLs are disabled in the prepared configuration. Deployment requires a reviewed HTTPS access-protection setup and authenticated hosted acceptance. No remote storage/cache service is provisioned by this configuration. The adapter warns about Windows and experimental Node middleware support; prefer a verified Linux build environment for release and test session refresh over HTTPS.

## Working from two computers

Each computer uses its own checkout, dependencies and ignored local environment. Finish a branch and publish reviewed changes only when authorized, then fetch/pull on the other computer. Uncommitted edits, credentials and browser practice journals do not synchronize through Git. Use a hosted HTTPS preview to review the same deployed app from computers and phones.

Locked branding artwork remains pending. Text placeholders preserve the selected direction without introducing replacement artwork. No license or asset redistribution rights are granted by this source snapshot.
