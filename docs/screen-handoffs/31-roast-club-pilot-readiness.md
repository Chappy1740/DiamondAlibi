# Roast Club — November 7 Pilot Readiness and Owner Decision

**Owner decision (November 3, 2026):** Defer personalized Roast Club, consent storage, popups and Bluetooth audio until after the November 7 tournament pilot. Prioritize stable tournament scoring. This replaces the earlier proposed November 4–5 Roast Club implementation schedule. Documentation-only authorization; no code, migration, deployment or merge authorized.

## Saturday pilot: CONDITIONAL GO (Claude read-only UAT assessment)

- A1 and A3 passed on laptop, including over-limit fence HR as OUT without runs or RBI. This is reported UAT evidence, not independently retested here.
- A2 failed: per-game stat line absent. A4 failed: scoring flow and screen clutter. H1–H5 need implementation and retest before Thursday's go/no-go.
- Batch 2 on hold; C–F not run. Tournament continuation, cross-device, voice and some navigation remain unverified.
- H6 (new outcomes) and H7 (remove any game) require migrations and hosted verification according to Claude; choose priority based on actual tournament blocker and available validation window, not arbitrary order.
- H1–H8 decisions, Beverage values (BB 0, SF −1, ROE 0), and remove-any-game decision were identified by Claude as chat/UTA-only; **do not invent their full specifications**. Reconcile the actual UTA and current branch evidence, then record approved details in the existing canonical handoff/tracker under separately appropriate scope.

## Allow low-risk fun, but not at the expense of scoring

- Preserve existing Beverage Board and established Diamond Alibi clubhouse voice.
- Optional clean, **generic, nonpersonalized** empty-state or game-day copy may be proposed only if it fits existing UI, does not add clutter, needs no migration, and passes focused tests.
- No funny subtitles on main scoring buttons (owner decision). No personalized jokes, targeted announcements, consent shortcuts, or Bluetooth audio before the post-pilot feature.
- Suggested generic copy (proposal only): “The stats don't lie. The excuses are already warming up.”
- Stop optional fun work if H1–H5, UAT, or release readiness is at risk.

## After the pilot: proposed sequence (requires separate authorization)

1. Reuse account-linked Beverage opt-in UX pattern, but use a separate server-authoritative consent store; default OFF, self-service opt-in and immediate opt-out.
2. Visual popups only for confirmed non-duplicate score changes, deduplicated by play ID; no targeted output without verified current consent. No popup for failed/duplicate saves or removed/invalidated games.
3. One designated announcer device, explicit session ownership and mute; real iPhone/Bluetooth/speech tests; nonblocking playback queue with consent recheck and cancellation.
4. Broader clean content catalog, nicknames and advanced preferences later.

## Go/no-go and evidence

- Thursday: require verified H1–H5 acceptance and A2/A4 retest; then continue the pilot UTA's remaining batches as time permits. Saturday uses only a stable, approved and tested build.
- Do not infer browser speech support, real iPhone acceptance, hosted scoring success, PR checks, or deployment from laptop tests or draft documentation.
- Follow `AGENTS.md`, `CONTRIBUTING.md`, `RELEASE-READINESS.md`, `src/data/project-tracker.ts`, existing `docs/screen-handoffs/` records and EYD-PM-001 continuity rules. Claude's UTA is to be reconciled, not replaced.

## Authorization boundary

Owner approved this planning direction and documentation PR preparation. No implementation, migration, live test, merge, deployment or provider change is authorized by these documents. Do not edit other agents' active branches.
