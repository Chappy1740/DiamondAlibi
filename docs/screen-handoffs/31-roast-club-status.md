# Roast Club — build status (R1–R4)

Status: AMBER (EYD-PM-001). Code merged to main (PRs #53-#56, 2026-11-05). Hosted DB migration applied. NOT deployed.

## Pull requests (stacked, merge in order; all draft, owner has not approved merge or deploy)
| PR | Branch | Scope |
| --- | --- | --- |
| #53 | `claude/roast-club-r1-engine` | R1 engine, catalog, mapping |
| #54 | `claude/roast-club-r2-consent` | R2 consent tables/RPCs (migration NOT applied), player control |
| #55 | `claude/roast-club-r3-popup` | R3 popup after confirmed saves |
| #56 | `claude/roast-club-r4-announcer` | R4 announcer, browser test, this doc |

Rebase done 2026-11-05: Codex merged #52, #47 and #49 into main; all four branches were rebased onto that main (three conflicts resolved, Codex changes kept; the popup now reads the saved play from the same reloaded data Codex's receipt uses). Branches were force-pushed with owner approval (own unmerged branches only).

CI lesson: any browser test harness that bundles a component importing a new server action must stub it (`tests/support/roast-club-stub.cjs`). Missing stubs failed the `home-layout` and `personal-workflow` tests on the first push; fixed in R2.

## Continuity / handoff
- Writer: Claude (owner direction 2026-11-03, replacing the default Codex-writes role for Roast Club). Reviewer: Codex or owner; independent review not yet done.
- Continuity: AMBER. A fresh chat is not needed yet. Resume from this doc and PRs #53-#56, not from chat history.
- Next actions: (1) independent review of #53-#56; (2) owner decision on hosted migration plan; (3) rebase over #52/#47/#49; (4) Will tests audio on a real iPhone and speaker.

Owner direction: Will authorized full Roast Club development (supersedes the Nov 3 deferral in `31-roast-club-pilot-readiness.md`); Claude is the writer for this task (role swap recorded here).

## What exists (all on `claude/roast-club-r4-announcer`, stacked R1 → R2 → R3 → R4)
- R1 `src/lib/roast-club.ts`: clean catalog, outcome mapping, consent gate, command-id dedupe, no immediate repeats.
- R2 migration `20261104180000_roast_club_consent.sql` (NOT applied anywhere), `roast-club-consent.ts`, player opt-in control. Everyone starts OUT; only the linked player can change their own choice.
- R3 `roast-club-flow.ts`, `roast-club-popup.tsx`: popup after a confirmed save. Outcome, batter and over-limit verdict are read from the server snapshot row for the saved play id, never from client input.
- R4 `roast-announcer.ts`, `announcer-controls.tsx`: per-device, per-game announcer, muted by default; speaks only the Roast Club line (the random line for that result) for opted-in players. No plain result announcements, and nothing is spoken for players who have not opted in (owner decision 2026-11-04).

## Evidence (run in sandbox 2026-11-03)
- Typecheck clean; 176 unit tests pass; production build compiles.
- Disposable-DB SQL: Roast Club consent (incl. mutation check) and existing optional-lineups, team-beverage pass.
- Chromium (local Chrome): new roast-club-browser test passes; connected-scorebook, scorebook-modes, games-flow, tournament-start-time, beverage-controls pass.
- NOT run: WebKit/Safari, archive-controls (harness ignores local browser path; same on main), real iPhone, real Bluetooth speaker, hosted database.
- Real-device audio check, 2026-11-04 (Will; iPhone, iOS 18.7, headphones, inside the Claude app browser, standalone audio-check page, not yet the live app):
  - PASSED: voice after one tap; sound reached the headphones; a new line replaced the old one; same play spoken once; over-limit line said "out"; clear at volume.
  - FAILED: phone locked, nothing was heard (expected: iOS pauses web pages). Mitigation in R4: screen wake lock while the announcer is on, plus an on-screen "keep this screen on" note. The mitigation is built but NOT yet phone-tested.
  - Second run, Safari (iOS 18.7): same results, and Mute stopped the voice right away (PASSED). Locked phone failed again in Safari, so the lock limitation is the phone, not the browser.
  - Voice: owner chose "Daniel (Enhanced)" (iOS Read & Speak voice) as the default. The announcer uses it when installed (Premium, then Enhanced, then standard Daniel), else the phone default. Other built-in voices were judged too robotic; a natural voice service is deferred until after the pilot and needs owner approval (paid service, new secret).
  - NOT TESTED: a Home Screen app, other speakers, the live app with the wake-lock change. Audio is NOT production-ready.

## Gates before any release
1. Owner approves merge and deploy (explicit).
2. Migration changes the deploy-gate fingerprint: hosted apply, verification and fingerprint update need separate approval. Until applied, the Roast Club control and popups stay hidden (fail closed).
3. Independent review (Codex/owner) of the PRs; rebase over PR #52 (`connected-scorebook.tsx`, `globals.css`).
4. Real-device audio test.

## Owner decisions (2026-11-03)
- Re-activated members regain their earlier choice: YES.
- Opted-in player IDs visible to teammates: YES.
- Every scoreable result gets a roast. A plain "Hit" is a single and uses the single lines. Slowpitch has no hit-by-pitch, so HBP stays unmapped.
- Open: category count. The catalog has 15 categories (the 14 result types plus a separate OVER-LIMIT HR set that keeps over-limit home runs from being celebrated).
- Staged option still available: ship text-only first, announcer later.

## Update 2026-11-05 (owner approvals and results)
- Independent review fixes shipped in #56: accepted-and-new receipt allow-list, off-limits name check, widened off-limits words (drunk/hungover/slow jokes kept, owner-approved), consent checks only on score/full screens and throttled to ~1/min, browser test asserts over-limit line says "out".
- Owner approved the hosted database change; `roast_club_consent` applied to the DiamondAlibi Supabase project. Verified: RLS on both private tables, immutable triggers, anon cannot execute, authenticated can, zero opt-ins.
- Owner approved merging; #53-#56 merged to main in order, CI `validate` green on main.
- Deploy NOT approved. Workers Build on main reports failure, consistent with the deploy gate (migration tree changed vs `approvedMigrationTree` in `scripts/worker-release-policy.json`); Cloudflare log not read.
- Owner tested the announcer on his iPhone (Daniel Enhanced voice, check page): works. Locked screen does not speak (OS limit; fine for a phone in use). In-app announcer on a real deploy is still untested.
- Next: owner approves deploy -> small PR updating the migration fingerprint -> deploy -> real-app iPhone/Bluetooth test -> owner acceptance.
