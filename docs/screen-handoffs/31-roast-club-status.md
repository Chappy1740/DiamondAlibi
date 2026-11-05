# Roast Club — build status (R1–R4)

Status: AMBER (EYD-PM-001). Code complete and pushed as draft PRs; nothing merged or deployed. Updated 2026-11-03 (evening).

## Pull requests (stacked, merge in order; all draft, owner has not approved merge or deploy)
| PR | Branch | Scope |
| --- | --- | --- |
| #53 | `claude/roast-club-r1-engine` | R1 engine, catalog, mapping |
| #54 | `claude/roast-club-r2-consent` | R2 consent tables/RPCs (migration NOT applied), player control |
| #55 | `claude/roast-club-r3-popup` | R3 popup after confirmed saves |
| #56 | `claude/roast-club-r4-announcer` | R4 announcer, browser test, this doc |

Conflicts to resolve by rebase after Codex lands #52/#47/#49 (not modified by this work): `connected-scorebook.tsx`, `globals.css`, `tests/scorebook-modes-browser.cjs` (#52); `player-dashboard.tsx` (#47, #49); `tests/games-flow-browser.cjs` (#49).

## Continuity / handoff
- Writer: Claude (owner direction 2026-11-03, replacing the default Codex-writes role for Roast Club). Reviewer: Codex or owner; independent review not yet done.
- Continuity: AMBER. A fresh chat is not needed yet. Resume from this doc and PRs #53-#56, not from chat history.
- Next actions: (1) independent review of #53-#56; (2) owner decision on hosted migration plan; (3) rebase over #52/#47/#49; (4) Will tests audio on a real iPhone and speaker.

Owner direction: Will authorized full Roast Club development (supersedes the Nov 3 deferral in `31-roast-club-pilot-readiness.md`); Claude is the writer for this task (role swap recorded here).

## What exists (all on `claude/roast-club-r4-announcer`, stacked R1 → R2 → R3 → R4)
- R1 `src/lib/roast-club.ts`: clean catalog, outcome mapping, consent gate, command-id dedupe, no immediate repeats.
- R2 migration `20261104180000_roast_club_consent.sql` (NOT applied anywhere), `roast-club-consent.ts`, player opt-in control. Everyone starts OUT; only the linked player can change their own choice.
- R3 `roast-club-flow.ts`, `roast-club-popup.tsx`: popup after a confirmed save. Outcome, batter and over-limit verdict are read from the server snapshot row for the saved play id, never from client input.
- R4 `roast-announcer.ts`, `announcer-controls.tsx`: per-device, per-game announcer, muted by default; neutral name-free lines; optional spoken roasts for opted-in players.

## Evidence (run in sandbox 2026-11-03)
- Typecheck clean; 176 unit tests pass; production build compiles.
- Disposable-DB SQL: Roast Club consent (incl. mutation check) and existing optional-lineups, team-beverage pass.
- Chromium (local Chrome): new roast-club-browser test passes; connected-scorebook, scorebook-modes, games-flow, tournament-start-time, beverage-controls pass.
- NOT run: WebKit/Safari, archive-controls (harness ignores local browser path; same on main), real iPhone, real Bluetooth speaker, hosted database.
- Real-device audio check, 2026-11-04 (Will; iPhone, iOS 18.7, headphones, inside the Claude app browser, standalone audio-check page, not yet the live app):
  - PASSED: voice after one tap; sound reached the headphones; a new line replaced the old one; same play spoken once; over-limit line said "out"; clear at volume.
  - FAILED: phone locked, nothing was heard (expected: iOS pauses web pages). Mitigation in R4: screen wake lock while the announcer is on, plus an on-screen "keep this screen on" note. The mitigation is built but NOT yet phone-tested.
  - Second run, Safari (iOS 18.7): same results, and Mute stopped the voice right away (PASSED). Locked phone failed again in Safari, so the lock limitation is the phone, not the browser.
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
