# Security review — October 24, 2026

Scope: Games/League/Tournament presentation and shared signed-BEV rankings on baseline `42ecc95a75622a47dbf03ffd8dd88c1ecb877715`. This is a focused source, dependency, CI and read-only configuration review, not an independent penetration test or a guarantee that no vulnerability exists.

## Findings and remediation

- npm audit initially reported five notices (two high, three moderate), in existing build-tool transitive dependencies. Targeted overrides patch body-parser to 2.4.0 and undici major 6/7 to 6.29.1/7.30.1. The pinned OpenNext/Cloudflare adapters and direct dependencies remain unchanged. Post-install audit reports zero known vulnerabilities at this observation.
- EYD-ARCH-001 choice: retain the existing toolchain and use patched compatible transitive releases. A broad upgrade or npm's suggested adapter downgrades would add unrelated compatibility risk. All three patches are MIT licensed; preserve installed license/copyright notices. Registry metadata and upstream advisories were checked; Node 24 satisfies their engines. Worker build and application regressions pass. Future maintainers should review the overrides when upstream adapters adopt these patches and keep the audit gate enabled.
- CI actions use verified full commit SHAs for official checkout 7.0.1 and setup-node 7.1.0 (MIT, Node 24 runtime), checkout does not retain Git credentials, and workflow permissions remain contents:read. Moderate-or-higher dependency findings now fail CI. Games browser coverage runs on both Chromium and WebKit. The first green run exposed a deprecated Node 20 action-runtime warning; supported upstream releases remove that warning. Direct Node selection/cache inputs remain compatible; no registry-token setup is used.
- No server actions, auth configuration, database schema/policies or Access settings were changed. Presentation flags do not authorize writes. Existing authorization, team/season boundaries, immutable rule versions and audited corrections remain in force.

## Read-only checks

- Supabase security advisor: no warning/error findings; eleven informational RLS-without-policy notices represent deny-by-default tables and are not a reason to grant access.
- Catalog checks: RLS enabled on all 27 application tables; app functions have fixed search paths; privileged implementations are private. Anonymous roles cannot execute application RPCs. Public client-facing functions use existing authenticated/current-membership checks; internal helpers remain restricted. No user records or credentials were retrieved for this review.
- GitHub effective main rules require a pull request, resolved review threads, an up-to-date passing validate check, and prevent deletion/force updates. Classic branch-protection API alone does not describe the active ruleset. Existing protections were retained.
- GitHub secret-scanning open-alert readback returned zero alerts. A redacted credential-pattern scan found no matches in the reviewed source/new files. This does not replace full-history secret scanning or independent review.
- Source review confirmed server-only feedback storage, constrained password-reset origins/redirects, plain React rendering of names and private/no-store authenticated responses. Existing anti-framing, content-type and permission headers remain in place.

## Verification and limits

Production Worker build; unit and isolated SQL authorization/replay tests; password-reset, feedback and loader checks; Games/Home, scorebook, connected disposable SQL/browser, beverage, day-review and built sample-route checks passed locally. Chromium and automated WebKit cover relevant mobile widths and accessibility. No hosted scoring/account/rule writes or test-account secrets were used.

A passing audit reflects the advisory database at check time. Physical iPhone acceptance, authenticated hosted scoring/multi-device synchronization and Error 1102 capacity investigation remain open. No broad account/MFA/network audit, independent pentest or full nonce-based CSP rollout is claimed. Existing CSP is partial; stricter script policy requires compatibility testing in separate scope. Fixes are not live until a separately approved release is activated.

## Sources

- [body-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828)
- [undici advisory](https://github.com/advisories/GHSA-4qv8-2p9j-2685)
- [undici advisory](https://github.com/advisories/GHSA-xjj6-f33q-929c)
- [undici integrity advisory](https://github.com/advisories/GHSA-f72v-6w45-q472)
- [GitHub Actions security guidance](https://docs.github.com/en/actions/reference/security/secure-use)
- [Official checkout action](https://github.com/actions/checkout/releases/tag/v7.0.1)
- [Official setup-node action](https://github.com/actions/setup-node/releases/tag/v7.1.0)
- [npm overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)
- [Supabase product security](https://supabase.com/docs/guides/security/product-security)
