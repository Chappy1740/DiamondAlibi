# Roast Club — build status (R1–R4)

## Current checkpoint — 2026-11-05 (read this first)

**Continuity: AMBER (EYD-PM-001).** Writer: Claude. Reviewer: Codex/owner. Resume from this record, not chat history.
Rungs per item (Implemented, Tested, Merged, Deployed, Owner-accepted):

| Item | Rung | Evidence |
| --- | --- | --- |
| R1 engine (#53) | **Merged** | PR head `224d2d2badfa29c6e653371d75b41edd702fcd82`; merge commit `e3293875472c939fbcb51d5fdb20001194635108` |
| R2 consent + migration file (#54) | **Merged** | head `0b950cdd2957b914fa45345d813e7b463bf51ae8`; merge `6d522a027df0b19e7f74d3051e79cc0155078722` |
| R3 popup (#55) | **Merged** | head `1ba2aeff9160a4229d761460639ea076e0fa3969`; merge `29eb1db0386bcdfbb581cef619d9818d81f715a1` |
| R4 announcer (#56) | **Merged** | head `7445ed19ca9ea739a687c9483b07927adeba1c5f`; merge `1de1e7f1c44b7394c76d2e36ed79f81312c3bb3d` |
| Owner off switch + smoke test (#60) | **Merged** | `ROAST_CLUB_ENABLED` (fails closed; only exact `true` is on) and `32-roast-club-smoke-test.md`; merge `0d282bf60622dcd01948b5ef1a9a539bc4f26e77` (= main at this refresh). Includes a test-only fix for a flaky 44px popup check (measured 43.999998px mid-animation). Not deployed; not owner-accepted. |
| Deploy-gate fingerprint (#61) | **Open, HELD** | head `1a35f6abe8b6b17770461e6d0a90aa2e826e3a77`; one-line `approvedMigrationTree` -> `3c4e320d2c054e26cfd2b0c6b7166998ef090145`; CI green. Merging it lets the next main build deploy, so it stays unmerged. |
| Hosted migration `20261104180000_roast_club_consent.sql` | **Applied and verified** on the DiamondAlibi Supabase project (hosted version `20261105100110`, name `roast_club_consent`) | Read-back: RLS on both private tables; two immutable triggers; `anon` cannot execute the new functions, `authenticated` can; zero opt-ins (every player OUT). Prerequisite helpers checked first. |
| Production | **HELD: not deployed** | See Cloudflare evidence. Nothing from R1-R4 is live. Last confirmed deployment: H5 `ff64f0d` (merge of #52; Worker `232bd809-4815-4cd2-ac46-1aebc0b675f3` at 100% when verified about 2026-11-04 14:41 UTC per the [#52 receipt](https://github.com/Chappy1740/DiamondAlibi/pull/52#issuecomment-6633560050)). **Current Cloudflare traffic is UNVERIFIED** (not rechecked); the failed main builds confirm those attempts produced no new release. |
| Owner acceptance | **Not accepted** | See audio notes below. |

**Approvals recorded (owner, 2026-11-05):** hosted database change approved (04:00 CT); merge of #53-#56 approved (04:12 CT). Codex's finding on this PR was addressed by this update. A deploy approval given at 04:55 CT was **superseded by the owner at 05:28 CT: "hold on 61"**. #60 was merged before that; #61 was not. **Production is held by explicit owner direction. Do not merge #61 until the owner gives a new, explicit deploy approval.**

**Exact CI and Cloudflare evidence.** First, main `1de1e7f1c44b7394c76d2e36ed79f81312c3bb3d` (after #56):
- GitHub Actions "Personal workflow validation" run `42009058568` (event push): **success**; job `validate` `127183110234`, completed 2026-11-05T10:19:06Z.
- Cloudflare "Workers Builds: diamond-alibi-preview" check `127183703583` on that commit: **failure**, build `cc77500d-ed69-4d41-b76c-f1c6188fb8e7`, completed 2026-11-05T10:15:46Z. No Worker version was released from it. **Cause UNKNOWN** (the Cloudflare log was not read). It is consistent with the deploy gate: `supabase/migrations` tree changed from `approvedMigrationTree` `6dc55326d3dfc1ff283fcbd08ea03bf043b2c882` in `scripts/worker-release-policy.json`, which blocks automatic deploy until the fingerprint PR (#61) is approved. Treat as unverified until the log or a later passing build says otherwise.
- Then main `0d282bf60622dcd01948b5ef1a9a539bc4f26e77` (after #60): GitHub Actions run `42017788646` (push) **success**, job `validate` `127212559570`; Cloudflare Workers Builds check `127212934158` (build `f1fc1ed7-769e-416b-9a73-ea9500c1c4ec`) **failure** (completed 2026-11-05T11:18:25Z), cause UNKNOWN (log not read), same gate explanation, no Worker version released. No new release was produced by that build; what Cloudflare is serving now is UNVERIFIED (last confirmed deployment: H5 `ff64f0d`).
- Earlier PR #58 head `8daa560c31a1dfee4c21615fd5673c02fbb95334` Cloudflare preview build `01a06431-3087-42ee-a1c5-dc9afad8f6c7`: success (preview only, not a release).
- Last local run before merge (sandbox, head `7445ed1`): typecheck clean; 177 unit tests, Roast Club SQL test, Roast Club browser test (Chromium) and the connected-scorebook, scorebook-modes, games-flow, home-layout browser tests passed. PR CI `validate` was green on each of the four heads.

**Owner phone result:** on 2026-11-05 the owner tested the announcer on his iPhone with headphones and reported it works with the Daniel (Enhanced) voice; locked screen does not speak (iOS limit; accepted for an in-use phone). This was the standalone audio-check page, not the deployed app. The in-app announcer, wake lock, Bluetooth speaker and Home Screen app remain UNTESTED. Audio is not production-ready.

**Known limits / unknowns:** independent human or Codex review of the merged code not done; screen-reader pass not done; back-to-back lines cut the earlier line; a few catalog lines assume a runner/shortstop.

**One next action:** owner decides whether to approve the deploy (merge #61). Until then nothing ships. After a deploy: run `32-roast-club-smoke-test.md` on the live app and record the result here. Queued: team heads-up message; scorer view of who has opted in.

Linked from: [working standard](00-WORKING-STANDARD.md), [RELEASE-READINESS.md](../../RELEASE-READINESS.md), `src/data/project-tracker.ts` (release status). Draft #59 also edits the top of RELEASE-READINESS.md; whichever merges second needs a trivial conflict resolution at the top of the file.

## History — earlier instructions and evidence (kept; superseded where they conflict with the checkpoint)

Earlier status line (superseded by the checkpoint above): AMBER; code merged, hosted migration applied, not deployed.

## Pull requests as first opened (HISTORY: they were draft then; all four are now merged, see the checkpoint)
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

## Gates before any release (HISTORY: 1 and 2 done; 3 partly; 4 open)
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

## Earlier update 2026-11-05 (HISTORY; superseded by the checkpoint above)
- Independent review fixes shipped in #56: accepted-and-new receipt allow-list, off-limits name check, widened off-limits words (drunk/hungover/slow jokes kept, owner-approved), consent checks only on score/full screens and throttled to ~1/min, browser test asserts over-limit line says "out".
- Owner approved the hosted database change; `roast_club_consent` applied to the DiamondAlibi Supabase project. Verified: RLS on both private tables, immutable triggers, anon cannot execute, authenticated can, zero opt-ins.
- Owner approved merging; #53-#56 merged to main in order, CI `validate` green on main.
- Deploy not approved at that time. Workers Build on main reports failure, consistent with the deploy gate (migration tree changed vs `approvedMigrationTree` in `scripts/worker-release-policy.json`); Cloudflare log not read.
- Owner tested the announcer on his iPhone (Daniel Enhanced voice, check page): works. Locked screen does not speak (OS limit; fine for a phone in use). In-app announcer on a real deploy is still untested.
- Next: owner approves deploy -> small PR updating the migration fingerprint -> deploy -> real-app iPhone/Bluetooth test -> owner acceptance.
