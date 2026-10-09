import test from "node:test";
import assert from "node:assert/strict";
import {
  connectedScoring,
  type ScoringClient,
} from "../src/lib/connected-scoring.ts";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const change = {
  type: "change",
  teamId: id(1),
  seasonId: id(2),
  dayId: id(3),
  gameId: id(4),
  commandId: id(5),
  expectedRevision: 0,
  tournamentRevision: null,
  change: { type: "complete", gameId: id(4) },
};
function client(rpc: ScoringClient["rpc"]): ScoringClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: id(9) } }, error: null }),
    },
    rpc,
  };
}
test("fresh authentication is required and forged envelopes never reach RPC", async () => {
  let calls = 0;
  const c = client(async () => {
    calls++;
    return { data: {}, error: null };
  });
  for (const request of [
    { ...change, actor: id(9) },
    { ...change, totals: {} },
    { ...change, expectedRevision: -1 },
    { ...change, type: "delete" },
    { ...change, change: { reason: "x".repeat(32769) } },
  ])
    assert.deepEqual(await connectedScoring(c, request), { status: "invalid" });
  c.auth.getUser = async () => ({ data: { user: null }, error: null });
  assert.deepEqual(await connectedScoring(c, change), {
    status: "auth-required",
  });
  assert.equal(calls, 0);
});
test("transport retains command identity and returns authoritative conflict/duplicate responses", async () => {
  const seen: Record<string, unknown>[] = [];
  const c = client(async (name, args) => {
    assert.equal(name, "da_apply_scoring_game_change");
    seen.push(args);
    return {
      data: {
        status: seen.length === 1 ? "conflict" : "accepted",
        duplicate: seen.length > 1,
        revision: 7,
      },
      error: null,
    };
  });
  assert.deepEqual(await connectedScoring(c, change), {
    status: "ok",
    data: { status: "conflict", duplicate: false, revision: 7 },
  });
  await connectedScoring(c, change);
  assert.equal(seen[0].p_command, seen[1].p_command);
  assert.equal(seen[0].p_expected, 0);
  assert.equal("actor" in seen[0], false);
});
test("uncertain writes keep the retry ID; errors reveal no database details", async () => {
  const failed = client(async () => {
    throw Error("secret backend details");
  });
  assert.deepEqual(await connectedScoring(failed, change), {
    status: "uncertain",
    commandId: id(5),
  });
  assert.deepEqual(
    await connectedScoring(failed, {
      type: "tournament",
      teamId: id(1),
      seasonId: id(2),
      tournamentId: id(6),
      name: "Synthetic",
    }),
    { status: "uncertain", tournamentId: id(6) },
  );
  for (const [code, status] of [
    ["42501", "access-denied"],
    ["55000", "paused"],
    ["22023", "invalid"],
  ])
    assert.deepEqual(
      await connectedScoring(
        client(async () => ({ data: null, error: { code } })),
        change,
      ),
      { status },
    );
  assert.deepEqual(
    await connectedScoring(failed, {
      type: "snapshot",
      teamId: id(1),
      seasonId: id(2),
      scope: "Overall",
    }),
    { status: "unavailable" },
  );
});
test("checked read and setup dispatch do not infer rules or request extra privileges", async () => {
  const names: string[] = [];
  const c = client(async (name) => {
    names.push(name);
    return { data: {}, error: null };
  });
  await connectedScoring(c, {
    type: "snapshot",
    teamId: id(1),
    seasonId: id(2),
    scope: "League",
  });
  await connectedScoring(c, {
    type: "audit",
    teamId: id(1),
    seasonId: id(2),
    limit: 50,
  });
  await connectedScoring(c, {
    type: "tournament",
    teamId: id(1),
    seasonId: id(2),
    tournamentId: id(6),
    name: "Synthetic",
  });
  assert.deepEqual(names, [
    "da_read_scoring_season",
    "da_read_scoring_audit",
    "da_create_scoring_tournament",
  ]);
  assert.deepEqual(
    await connectedScoring(c, {
      type: "audit",
      teamId: id(1),
      seasonId: id(2),
      limit: 101,
    }),
    { status: "invalid" },
  );
});
