# Roast Club — November 7 Pilot Readiness (planning)

**Status:** Conditional proposal only. No Roast Club audit, implementation, real iPhone audio test or pilot acceptance is claimed.

## Priority and decision gate

Tournament scoring reliability outranks announcer novelty. Claude's existing pilot UTA and current verified repository/release evidence must be reconciled before a GO decision. Historical concerns (verify whether still open): tournament game creation/continuation, navigation back to game, per-game box score, Beverage adjustment UX, tester authentication, cross-device scoring, voice readiness and over-limit HR OUT-only behavior.

## Proposed sequence, subject to owner approval

1. **Nov 3 — Read-only discovery:** verify current branch/head, active work and UTA; audit scoring save lifecycle, opt-in patterns, audio and reuse; return evidence-backed GO / CONDITIONAL GO / NO-GO.
2. **Nov 4 — If approved:** isolated labels, consent and visual roasts using existing components; synthetic regression coverage.
3. **Nov 5 — If approved:** one-device audio integration and real iPhone/Bluetooth verification; consent/queue/failure tests.
4. **Nov 6 — Decision:** regression, accessibility, pilot rehearsal and rollback/mute verification; release only by separately approved exact scope.
5. **Nov 7 — Pilot:** use the verified stable build; disable/defer Roast Club if any consent, audio or scoring issue persists.

## Minimum candidate acceptance criteria

- Individual affirmative opt-in OFF by default; opt-out cancels pending and future visual/spoken roasts; consent rechecked before playback.
- No roast of nonparticipants, including on shared speaker; no unconsented public opt-out message.
- 13 visible scoring actions plus special over-limit HR outcome mapped correctly; curated clean SFW lines only.
- No toast/speech on failed or duplicate saves; no scoring blocked by popup/audio.
- Single active announcer, user-activated audio, mute, Bluetooth pairing test on real iPhone and a no-audio fallback.
- Existing scoring/undo/rule/HR limit/DP/SF/Beverage Board/analytics unaffected.
- No live testing or deployment without explicit scoped authorization.

## Known risks / unknowns

- Existing UTA status and open work are not independently reconciled in this document.
- Browser text-to-speech may require user activation and may behave differently with iOS/Bluetooth.
- Consent storage, authorization and stale cross-device state require source inspection.
- Popup text under buttons may be too long; official codes and accessible names must stay clear.
- Real-world pilot deadline is not evidence of readiness.

## Governance and handoff

Read `AGENTS.md`, `CONTRIBUTING.md`, `RELEASE-READINESS.md`, `src/data/project-tracker.ts`, `docs/screen-handoffs/00-WORKING-STANDARD.md` and `08-scorebook.md`; consult Claude's existing UTA. Follow EYD-ARCH-001 reuse-before-build, EYD-PM-001 continuity, and one writer per task. This document supplements, not replaces, the canonical pilot UTA or release readiness. No source code, tests, schema, providers, release settings or deployments are authorized by this documentation.
