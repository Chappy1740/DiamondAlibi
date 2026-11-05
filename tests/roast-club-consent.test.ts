import test from "node:test";
import assert from "node:assert/strict";
import { consentMap, roastClubConsent, roastClubEnabled, type RoastClubState } from "../src/lib/roast-club-consent.ts";
import type { ScoringClient } from "../src/lib/connected-scoring.ts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
type Call = { name: string; args: Record<string, unknown> };
function client(rpc: (call: Call) => { data?: unknown; error?: { code?: string } | null } | Promise<never>, user = true) {
  const calls: Call[] = [];
  const fake: ScoringClient = {
    auth: { getUser: async () => (user ? { data: { user: { id: id(9) } }, error: null } : { data: { user: null }, error: null }) },
    rpc: async (name, args) => {
      const call = { name, args };
      calls.push(call);
      const result = await rpc(call);
      return { data: result.data ?? null, error: result.error ?? null };
    },
  } as ScoringClient;
  return { fake, calls };
}
const state = (over: Partial<RoastClubState> = {}): RoastClubState => ({
  teamId: id(1), canToggle: true, optedIn: false, optedInPlayerIds: [], ...over,
});
const read = { type: "read", teamId: id(1) };
const change = (optedIn: boolean, commandId = id(5)) => ({ type: "change", teamId: id(1), commandId, optedIn });

test("reads a validated state and submits only the team", async () => {
  const { fake, calls } = client(() => ({ data: state({ optedIn: true, optedInPlayerIds: [id(101)] }) }));
  const result = await roastClubConsent(fake, read);
  assert.deepEqual(result, { status: "ok", data: state({ optedIn: true, optedInPlayerIds: [id(101)] }) });
  assert.deepEqual(calls, [{ name: "da_read_roast_club", args: { p_team: id(1) } }]);
});

test("a change submits only team, command and the explicit choice — never a player or actor", async () => {
  const { fake, calls } = client(() => ({ data: { status: "accepted", duplicate: false, optedIn: true, revision: 1 } }));
  assert.deepEqual(await roastClubConsent(fake, change(true)), { status: "accepted", duplicate: false, optedIn: true });
  assert.deepEqual(calls, [{ name: "da_change_roast_club", args: { p_team: id(1), p_command: id(5), p_opted_in: true } }]);
});

test("forged or malformed requests never reach the database", async () => {
  const { fake, calls } = client(() => ({ data: state() }));
  for (const input of [
    null, "read", [], {}, { type: "read" }, { type: "read", teamId: "nope" },
    { ...read, playerId: id(102) }, { ...read, extra: 1 },
    { ...change(true), playerId: id(102) }, { ...change(true), actorId: id(2) },
    change("yes" as unknown as boolean), change(1 as unknown as boolean), change(undefined as unknown as boolean),
    { ...change(true), commandId: "nope" }, { type: "delete", teamId: id(1) },
  ]) assert.deepEqual(await roastClubConsent(fake, input), { status: "invalid" }, JSON.stringify(input));
  assert.equal(calls.length, 0);
});

test("signed-out callers are refused before any database call", async () => {
  const { fake, calls } = client(() => ({ data: state() }), false);
  assert.deepEqual(await roastClubConsent(fake, read), { status: "auth-required" });
  assert.deepEqual(await roastClubConsent(fake, change(true)), { status: "auth-required" });
  assert.equal(calls.length, 0);
});

test("missing database functions read as unsupported so the control stays hidden", async () => {
  for (const code of ["PGRST202", "42883"]) {
    const { fake } = client(() => ({ error: { code } }));
    assert.deepEqual(await roastClubConsent(fake, read), { status: "unsupported" });
    assert.deepEqual(await roastClubConsent(fake, change(true)), { status: "unsupported" });
  }
});

test("database refusals map to access-denied and invalid", async () => {
  assert.deepEqual(await roastClubConsent(client(() => ({ error: { code: "42501" } })).fake, read), { status: "access-denied" });
  assert.deepEqual(await roastClubConsent(client(() => ({ error: { code: "22023" } })).fake, change(true)), { status: "invalid" });
});

test("uncertain writes retain the command id; failed reads are merely unavailable", async () => {
  assert.deepEqual(await roastClubConsent(client(() => ({ error: { code: "XX000" } })).fake, change(true, id(7))), { status: "uncertain", commandId: id(7) });
  assert.deepEqual(await roastClubConsent(client(() => Promise.reject(new Error("net"))).fake, change(false, id(8))), { status: "uncertain", commandId: id(8) });
  assert.deepEqual(await roastClubConsent(client(() => ({ error: { code: "XX000" } })).fake, read), { status: "unavailable" });
});

test("a write receipt that does not match the request is never treated as saved", async () => {
  for (const data of [
    { status: "accepted", duplicate: false, optedIn: false },
    { status: "accepted", duplicate: "no", optedIn: true },
    { status: "conflict" }, null, "ok",
  ]) {
    const result = await roastClubConsent(client(() => ({ data })).fake, change(true, id(9)));
    assert.deepEqual(result, { status: "uncertain", commandId: id(9) });
  }
  const dup = await roastClubConsent(client(() => ({ data: { status: "accepted", duplicate: true, optedIn: true } })).fake, change(true));
  assert.deepEqual(dup, { status: "accepted", duplicate: true, optedIn: true });
});

test("malformed or inconsistent state is unavailable, never trusted", async () => {
  for (const data of [
    state({ teamId: id(2) }), { ...state(), canToggle: "yes" }, { ...state(), optedIn: null },
    { ...state(), optedInPlayerIds: "x" }, { ...state(), optedInPlayerIds: ["nope"] },
    { ...state(), optedInPlayerIds: [123] },
    state({ canToggle: false, optedIn: true }), null, [],
  ]) assert.deepEqual(await roastClubConsent(client(() => ({ data })).fake, read), { status: "unavailable" }, JSON.stringify(data));
});

test("consent map lists only effective opt-ins; unknown players and missing state are not consented", () => {
  const map = consentMap(state({ optedInPlayerIds: [id(101), id(102)] }));
  assert.equal(map.get(id(101)), true);
  assert.equal(map.get(id(103)), undefined);
  assert.equal(consentMap(null).size, 0);
  assert.equal(consentMap(undefined).get(id(101)), undefined);
});

test("the owner off switch fails closed", () => {
  assert.equal(roastClubEnabled("true"), true);
  for (const v of [undefined, "", "false", "TRUE", "1", " true", "off"]) assert.equal(roastClubEnabled(v), false, String(v));
});
