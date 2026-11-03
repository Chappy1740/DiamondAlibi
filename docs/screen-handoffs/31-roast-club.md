# 31 — Roast Club / Full Clubhouse Announcer — Owner requirements

**Status:** Approved product direction; implementation NOT authorized. **Target pilot:** November 7, 2026 (conditional, not a delivery commitment).
**Related screen:** [08 — Live scorebook](08-scorebook.md). **Governance:** root `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `00-WORKING-STANDARD.md`, EYD-ARCH-001 and EYD-PM-001.

## Purpose and owner decisions (November 3, 2026)

Add an optional, personalized **Roast Club — Full Clubhouse Announcer** to Diamond Alibi's slow-pitch scoring experience. **Absolutely Savage — Clean Edition** means sharp, funny, performance-based teasing, but **100% safe for work**. No profanity, vulgarity, sexual material, discriminatory/personal attacks, ridicule of actual injuries, or explicit adult humor. Suitable for families, workplaces, and public ballfields. The later clean-content decision **supersedes** earlier adult/profane examples.

### Consent — non-negotiable

- Player-specific, affirmative opt-in; OFF by default. A captain or scorer cannot silently enroll another player.
- A player may opt out at any time. No personalized roast popup, spoken announcement, queued message, or other targeted roast for a nonparticipant.
- Cancel queued announcements on opt-out; recheck consent immediately before displaying/speaking. No public announcement when someone opts out.
- Consent to be roasted is distinct from enabling the announcer device's audio. Do not confuse Roast Club with Beverage Board participation; investigate whether existing participation architecture can be reused without coupling their data.
- Audit identity, authorization, cross-device consent freshness and privacy before proposing persistence.

### Scoring and audio

- Retain official abbreviations, authoritative scoring identifiers, stats, game history, rule versions, audit trail and scoring UX.
- Proposed funny subtitles beneath official scoring codes; **resolve conflict with nonparticipant experience** before implementation: do not expose a nonparticipant to targeted roast labels.
- For opted-in batters, after a **confirmed successful** scoring event, select a short curated event-specific line including a safe display name; show a nonblocking dismissible popup and, when enabled, speak via the designated scorer device's current audio output (including paired Bluetooth speaker).
- One designated announcer device; explicit enable/mute; browser speech/audio restrictions and actual iPhone/Bluetooth operation require physical testing. No scoring dependence on audio.
- Avoid repeated lines and duplicate callbacks/retries; handle failed saves, corrections, undo, rapid plays, refresh and pending audio. Recheck consent at playback.
- Full clubhouse coverage: 1B, 2B, 3B, HR, ITP HR, swinging K, looking K, SOFO, DP, OUT, BB, SF, E, and special over-limit HR OUT. Verify actual event identifiers rather than assuming UI labels equal database codes.
- Long-term content target: 20 curated clean lines per category (280 total); pilot candidate: 5–10 per category, contingent on audit. No runtime generative AI requirement.
- Future settings under consideration: Off / Clean / Absolutely Savage Clean, per-player preferences, optional nicknames. Not yet approved for implementation.

## Proposed clean scoring subtitles (review for fit and tone)

| Code | Proposed subtitle |
|---|---|
| 1B | Even a Blind Squirrel |
| 2B | Two Bases? Alert the Media |
| 3B | Somebody Get the Oxygen |
| HR | The Fence Never Had a Chance |
| ITP HR | Four Bases, Zero Breath |
| K (swinging) | All Swing, No Talent |
| K (looking) | Bat's Just for Decoration |
| SOFO | Fouled Up Everything |
| DP | Two Outs, One Bad Idea |
| OUT | Sit Down, Superstar |
| BB | Free Pass, Zero Effort |
| SF | Congrats, You Failed Up |
| E | Defense Felt Sorry for You |

Examples of clean announcements (substitute an opted-in batter's safe display name only): 
- K: “{name}! The pitcher threw it underhand. UNDERHAND!”
- DP: “{name}! Most players disappoint one teammate at a time. You managed two!”
- HR: “{name}! That ball is gone! Even the fence wants a rematch!”
- E: “{name}! That wasn't a hit. That was a charitable donation!”
- Over-limit HR: “{name}! You hit it out of the park and still made an out. Remarkable!”

These are content proposals, not approved final copy. Build a broader clean catalog only after scope approval.

## Scoring integrity acceptance

Humor is presentation-only and must not alter hits, at-bats, plate appearances, outs, BB, ROE, SF, runs, RBI, base advancement, OBP, Reach Base %, tournament/league rules, Beverage Board or audited corrections. **Over-limit fence HR = OUT ONLY**, with no credited hit/HR/RBI/run or advancement from that event. Verify actual implementation, including double-play and sacrifice-fly handling.

## Phase 0 audit (READ-ONLY)

Inspect current branch, handoff, `src/components/connected-scorebook.tsx`, `src/components/batting-outcome-picker.tsx`, `src/app/club/scoring-actions.ts`, relevant persistence/types, participation/preferences, toast UI, audio facilities and tests. These are starting points, not verified exhaustive dependencies. Identify reusable components, precise save-confirmation point, consent storage, browser speech constraints, risks, tests, accessibility and scope. Report evidence paths/lines and unknowns. **Do not modify code, run write-producing tests, install, commit, deploy, migrate or change provider configuration under this audit.**

## Owner approval boundary

This documentation PR is not authorization to implement, merge, deploy, alter schema, enable audio or run hosted scoring tests. Claude has an existing pilot UTA; reconcile this document with that UTA before implementation planning. Follow one-writer-per-task and continuity/receipt requirements.
