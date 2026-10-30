# Diamond Alibi agent instructions

Read and follow `CONTRIBUTING.md` before making project changes. Preserve its data isolation, scoring, rule-version, security, verification, and explicit-approval requirements. Inspect the actual branch, working tree, applicable code, and current handoff before editing; do not assume a GitHub view includes uncommitted local work.

## EYD-ARCH-001 — Reuse Before Build

Master: [shared engineering standard](https://github.com/Chappy1740/eydren-governance/blob/main/governance/EYD-ARCH-001.md). The local rules below remain enforceable when the private master is inaccessible.

Before implementing a new feature or adding a significant dependency:

1. Inspect the relevant existing code and declared dependencies first. Reuse working project functionality; do not replace it solely because an alternative exists.
2. Perform a brief, targeted search for established solutions when reuse is likely to save meaningful time. Prefer already-installed packages, platform capabilities, and well-maintained libraries; do not assume that open-source means MIT-licensed.
3. For any proposed third-party dependency, confirm its actual license and obligations, maintenance activity, known security advisories, transitive dependency impact, and compatibility with this project's runtime, architecture, and deployment environment. Never assume a license from a repository's owner or description.
4. Compare three choices: reuse an existing project component, adopt an external library, or implement a small focused solution. Consider implementation effort, long-term maintenance, accessibility, security, reliability, and portability.
5. Record the selection and brief rationale in the task or PR; for a new dependency, record the package/version, license, relevant attribution obligations, and update/security ownership in the project's dependency tracking or PR. Preserve required copyright/license notices.
6. Do not install, upgrade, replace, or bulk-audit dependencies without task scope and appropriate authorization. Do not let research become a blocker for small straightforward changes; timebox the investigation proportionately.

Apply this check during feature planning, not as an excuse to refactor unrelated or already-accepted functionality. Preserve all existing project security, verification, approval, and Git rules.

## EYD-PM-001 — Conversation continuity and recovery

Master: [EYD-PM-001](https://github.com/Chappy1740/eydren-governance/blob/main/governance/EYD-PM-001.md), with its handoff template, recovery checklist and acceptance tests in the central `templates/` directory and `governance/EYD-PM-001-ACCEPTANCE.md`. The master repository is private; the rules below apply here on their own.

- Chat history and agent memory are temporary. Current owner direction and approved requirements determine intent and authorization; fresh evidence determines actual state. Verify current evidence (branch, HEAD, remote head, PRs, checks, deployment or version IDs) against the current `docs/screen-handoffs/` handoff and completion receipt, `RELEASE-READINESS.md`, `src/data/project-tracker.ts` and dated handoffs; record discrepancies. Unverified chat summaries rank last.
- At significant checkpoints, evaluate **Is it still necessary to continue this chat?** Report state, reason, evidence checked and next step; do not invent context percentages.
- Assess continuity at milestones, phase changes, significant decisions and before approval requests. **GREEN:** continue. **AMBER:** record chat-only decisions, approvals or results in the current handoff in `docs/screen-handoffs/` with its completion receipt, `RELEASE-READINESS.md` and `src/data/project-tracker.ts` before continuing. **RED:** stop new implementation and prepare a verified handoff. **RECOVERY:** read-only verification for the affected scope until records and evidence agree. Never use chat length or an invented context percentage as the measure.
- A handoff states project and repository, objective and phase, verified branch and full SHA, each item at one rung (Implemented, Tested, Merged, Deployed, Owner-accepted), decisions and requirements with where they are recorded, blockers, approvals with exact remaining scope, evidence, unknowns and discrepancies, and one next action with acceptance criteria. Store it in or link it from the current handoff in `docs/screen-handoffs/` with its completion receipt, `RELEASE-READINESS.md` and `src/data/project-tracker.ts`; never start a competing record.
- Before resuming dependent work from a handoff or new chat, verify repository, branch, HEAD, remote head, working tree, decisions and approvals against these sources. Report Recovered, Partially recovered or Not recovered with evidence; never claim Recovered without it.

This section grants no new permission and relaxes no rule in this file.

## Codex and Claude Code tandem

Codex and Claude Code both follow this file (Claude Code loads it through `CLAUDE.md`, which imports `@AGENTS.md`). These rules bind both agents and add to, never relax, the rules above.

- **One writer per task.** A branch belongs to the agent that created it: `codex/<task>` or `claude/<task>`. Never commit to, rebase, or force-push the other agent's branch. To continue another agent's work, branch from its head under your own prefix and say so in the handoff.
- **Default roles.** Codex implements approved scope. Claude Code reviews and advises: read-only PR review, audits, architecture and risk analysis, and teaching. The owner may swap roles for a specific task; record that in the handoff.
- **Review handshake.** Implementation ends as a draft PR with its handoff or receipt. Review findings go in PR comments with severity, file:line, evidence and a suggested fix. The implementing agent applies fixes; a reviewer does not push fixes unless the owner assigns that task.
- **Check before starting.** Fetch, then check open PRs, `codex/*` and `claude/*` branches touching the same files, and any active run recorded in the handoff. Never duplicate another agent's active run, resources, migrations, deployments or hosted tests; coordinate through the owner.
- **One shared memory.** The current handoff in `docs/screen-handoffs/` (with its completion receipt), `RELEASE-READINESS.md` and `src/data/project-tracker.ts` are the only cross-agent record. Chat history and agent-local memory are not shared. Record approvals there or in the PR with their exact scope, so either agent can carry them forward without asking again and without widening them.
- **Same evidence rules.** State which agent ran which checks in the current session, keep stage labels distinct, and never present another agent's recorded results as freshly verified.
