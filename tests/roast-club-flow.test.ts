import test from "node:test";
import assert from "node:assert/strict";
import { confirmedScore, planConfirmedRoast, type PlanInput, type SnapshotGame } from "../src/lib/roast-club-flow.ts";
import { ROAST_CATALOG, createRoastPlanner } from "../src/lib/roast-club.ts";
import type { RoastClubState } from "../src/lib/roast-club-consent.ts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const row = (over: Partial<SnapshotGame["evaluation"]["rows"][number]> = {}) => ({
  id: id(50), playerId: id(101), outcome: "Fence HR", official: "Fence HR", voided: false, ...over,
});
const games = (rows = [row()], gameId = id(4)): SnapshotGame[] => [{ game: { id: gameId }, evaluation: { rows } }];
const consent = (ids: string[] = [id(101)], over: Partial<RoastClubState> = {}): RoastClubState => ({
  teamId: id(1), canToggle: true, optedIn: false, optedInPlayerIds: ids, ...over,
});
function input(over: Partial<PlanInput> = {}) {
  const calls = { reads: 0 };
  const value: PlanInput = {
    planner: createRoastPlanner({ random: () => 0 }),
    commandId: id(7), playId: id(50), gameId: id(4), receipt: { status: "accepted", duplicate: false },
    games: games(), displayName: () => "Synthetic Alex",
    cachedConsent: consent(), readConsent: async () => { calls.reads++; return consent(); },
    ...over,
  };
  return { value, calls };
}

test("the confirmed score comes only from the server row", () => {
  assert.deepEqual(confirmedScore(games(), id(4), id(50)), { playerId: id(101), outcome: "Fence HR", overLimitFenceHr: false });
  assert.deepEqual(confirmedScore(games([row({ official: "OLHR" })]), id(4), id(50)), { playerId: id(101), outcome: "Fence HR", overLimitFenceHr: true });
});

test("missing, duplicated, voided or unknown rows are never celebrated", () => {
  assert.equal(confirmedScore(games(), id(4), id(99)), null);
  assert.equal(confirmedScore(games(), id(5), id(50)), null);
  assert.equal(confirmedScore([...games(), ...games()], id(4), id(50)), null);
  assert.equal(confirmedScore(games([row(), row()]), id(4), id(50)), null);
  assert.equal(confirmedScore(games([row({ voided: true })]), id(4), id(50)), null);
  assert.equal(confirmedScore(games([row({ official: "Voided" })]), id(4), id(50)), null);
  assert.equal(confirmedScore(games([row({ outcome: "Grand Slam" })]), id(4), id(50)), null);
});

test("an opted-in batter gets a roast after a confirmed save, with a fresh consent check", async () => {
  const { value, calls } = input();
  const decision = await planConfirmedRoast(value);
  assert.equal(decision.kind, "show");
  if (decision.kind !== "show") return;
  assert.equal(decision.category, "HR");
  assert.ok(decision.text.includes("Synthetic Alex"));
  assert.equal(calls.reads, 1);
});

test("an over-limit fence HR is judged by the server verdict and gets no home-run celebration", async () => {
  const { value } = input({ games: games([row({ official: "OLHR" })]) });
  const decision = await planConfirmedRoast(value);
  assert.equal(decision.kind === "show" && decision.category, "OVER-LIMIT HR");
  assert.ok(decision.kind === "show" && !ROAST_CATALOG.HR.some((line) => decision.text === line.replace("{name}", "Synthetic Alex")));
});

test("nonparticipants cost no network call and are never targeted", async () => {
  for (const cachedConsent of [null, consent([]), consent([id(102)])]) {
    const { value, calls } = input({ cachedConsent });
    assert.deepEqual(await planConfirmedRoast(value), { kind: "skip", reason: "no-consent" });
    assert.equal(calls.reads, 0);
  }
});

test("an opt-out made after the cache was filled is honored at display time", async () => {
  const { value, calls } = input({ readConsent: async () => consent([]) });
  assert.deepEqual(await planConfirmedRoast(value), { kind: "skip", reason: "no-consent" });
  assert.equal(calls.reads, 0);
  let reads = 0;
  const second = input({ readConsent: async () => { reads++; return consent([id(102)]); } }).value;
  assert.deepEqual(await planConfirmedRoast(second), { kind: "skip", reason: "no-consent" });
  assert.equal(reads, 1);
});

test("an unreadable or failing consent check fails closed", async () => {
  assert.deepEqual(await planConfirmedRoast(input({ readConsent: async () => null }).value), { kind: "skip", reason: "no-consent" });
  assert.deepEqual(await planConfirmedRoast(input({ readConsent: async () => { throw new Error("net"); } }).value), { kind: "skip", reason: "no-consent" });
});

test("duplicate, conflicting and replayed saves never roast and never read consent", async () => {
  for (const receipt of [{ duplicate: true }, { status: "conflict" }, {}, { status: "rejected" }, { status: "accepted" }]) {
    const { value, calls } = input({ receipt });
    assert.deepEqual(await planConfirmedRoast(value), { kind: "skip", reason: "not-confirmed" });
    assert.equal(calls.reads, 0);
  }
  const planner = createRoastPlanner({ random: () => 0 });
  assert.equal((await planConfirmedRoast(input({ planner }).value)).kind, "show");
  assert.deepEqual(await planConfirmedRoast(input({ planner }).value), { kind: "skip", reason: "duplicate-command" });
});

test("plain hits get a roast; unknown names stay silent", async () => {
  assert.equal((await planConfirmedRoast(input({ games: games([row({ outcome: "Hit", official: "Hit" })]) }).value)).kind, "show");
  assert.deepEqual(await planConfirmedRoast(input({ displayName: () => undefined }).value), { kind: "skip", reason: "unsafe-name" });
});

test("the batter comes from the server row, not from anything the client claims", async () => {
  const { value } = input({ cachedConsent: consent([id(102)]), readConsent: async () => consent([id(102)]) });
  // Client "claims" nothing about the player; the server row says id(101), who is not opted in.
  assert.deepEqual(await planConfirmedRoast(value), { kind: "skip", reason: "no-consent" });
});
