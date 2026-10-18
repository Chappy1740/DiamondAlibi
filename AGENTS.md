# Diamond Alibi agent instructions

Read and follow `CONTRIBUTING.md` before making project changes. Preserve its data isolation, scoring, rule-version, security, verification, and explicit-approval requirements. Inspect the actual branch, working tree, applicable code, and current handoff before editing; do not assume a GitHub view includes uncommitted local work.

## EYD-ARCH-001 — Reuse Before Build

Before implementing a new feature or adding a significant dependency:

1. Inspect the relevant existing code and declared dependencies first. Reuse working project functionality; do not replace it solely because an alternative exists.
2. Perform a brief, targeted search for established solutions when reuse is likely to save meaningful time. Prefer already-installed packages, platform capabilities, and well-maintained libraries; do not assume that open-source means MIT-licensed.
3. For any proposed third-party dependency, confirm its actual license and obligations, maintenance activity, known security advisories, transitive dependency impact, and compatibility with this project's runtime, architecture, and deployment environment. Never assume a license from a repository's owner or description.
4. Compare three choices: reuse an existing project component, adopt an external library, or implement a small focused solution. Consider implementation effort, long-term maintenance, accessibility, security, reliability, and portability.
5. Record the selection and brief rationale in the task or PR; for a new dependency, record the package/version, license, relevant attribution obligations, and update/security ownership in the project's dependency tracking or PR. Preserve required copyright/license notices.
6. Do not install, upgrade, replace, or bulk-audit dependencies without task scope and appropriate authorization. Do not let research become a blocker for small straightforward changes; timebox the investigation proportionately.

Apply this check during feature planning, not as an excuse to refactor unrelated or already-accepted functionality. Preserve all existing project security, verification, approval, and Git rules.
