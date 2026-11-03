# Diamond Alibi — Tester Register Standard

Status: Owner authorized adoption/publication with the November 3 release through PR #46. This source snapshot precedes combined CI/merge/live verification; see docs/screen-handoffs/00-WORKING-STANDARD.md and the codex/uat-release-through-pr46 release PR for the completion receipt. Individual tester readiness remains unverified.
Created: 2026-10-31. Target pre-test: 2026-11-07.

## Security and source of truth

This public repository contains **only the register schema and anonymized operational summary**. Never commit tester names, email addresses, authentication identifiers, invite codes, tokens, passwords, login links, or personally attributable feedback. Store identifiable tester records in an owner-controlled private system with least-privilege access. Do not infer account creation or invitation acceptance from a sent email.

## Private register fields

- Stable tester ID (T-001 etc.)
- Name and contact email (private only)
- Invitation status: not sent / sent / accepted / declined / delivery failed
- Invitation date and evidence reference (private)
- Supabase registration: unverified / registered / failed
- Login verification: untested / passed / failed, with date
- Cloudflare Access permission: unverified / granted / denied (separate from app membership)
- Test-team membership: unverified / granted / denied
- Assigned test scenarios, feedback references, blocking issues, last check date, and readiness: unknown / blocked / ready
- Owner of follow-up and next action

## Baseline (unverified account statuses)

The owner reports five existing testers and one newly invited tester (six total, excluding the owner). Individual identities, overlap, invitation outcomes, and account status must be reconciled privately before assigning permanent IDs. An invitation email was sent to the sixth candidate on 2026-10-31; acceptance, registration, login, preview access, and team membership remain unverified. Historical reviewer login-code delivery failures require follow-up; do not attribute them to an unnamed person in this public document.

## Acceptance workflow

1. Reconcile the five existing testers against private owner records and Supabase Auth read-only; do not create duplicate users.
2. Confirm email delivery/acceptance independently of account registration.
3. Verify signup or existing authentication and email confirmation, recording only pass/fail and timestamps in the private register.
4. Verify Cloudflare Access authorization independently from Supabase authentication and team membership.
5. Grant the minimum necessary test-team access through the existing invite workflow after explicit authorization; never share credentials.
6. Run mobile scoring, tournament continuation, navigation, stats, feedback, and logout/re-login checks. Record blockers and evidence privately.
7. Mark Ready only after login, preview access, membership, and assigned acceptance scenarios pass.

## Change boundaries

No Supabase Auth writes, Cloudflare changes, new infrastructure, production data changes, deployments, or external invitations are authorized by this document. Apply EYD-ARCH-001 Reuse Before Build and the project's AGENTS.md workflow. Keep any actual roster with personal data out of this repository.
