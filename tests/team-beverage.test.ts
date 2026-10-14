import test from "node:test";
import assert from "node:assert/strict";
import {
  teamBeverage,
  type BeverageRequest,
} from "../src/lib/team-beverage.ts";
import { DEFAULT_BOARD } from "../src/lib/scoring.ts";
const teamId = "00000000-0000-4000-8000-000000000010";
const commandId = "00000000-0000-4000-8000-000000000011";
const input: BeverageRequest = {
  type: "change",
  teamId,
  commandId,
  expectedRevision: 1,
  change: { type: "participation", participating: false },
};
function fixture(
  data: unknown = { status: "accepted", duplicate: false },
  code?: string,
) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  return {
    calls,
    client: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "server-user" } },
          error: null,
        }),
      },
      rpc: async (name: string, args: Record<string, unknown>) => {
        calls.push({ name, args });
        return { data, error: code ? { code } : null };
      },
    },
  };
}
test("Beverage transport sends own-session choice, never player, actor, date or balance", async () => {
  const f = fixture();
  assert.equal((await teamBeverage(f.client, input)).status, "accepted");
  assert.deepEqual(f.calls, [
    {
      name: "da_change_team_beverage",
      args: {
        p_team: teamId,
        p_command: commandId,
        p_expected: 1,
        p_change: input.change,
      },
    },
  ]);
  for (const extra of [
    { actor: "other" },
    { playerId: "other" },
    { balance: 0 },
    { at: "yesterday" },
  ])
    assert.equal(
      (
        await teamBeverage(f.client, {
          ...input,
          change: { ...input.change, ...extra },
        })
      ).status,
      "invalid",
    );
  assert.equal(f.calls.length, 1);
});
test("Beverage transport validates finalized rule shape and authoritative state", async () => {
  const f = fixture({
    teamId,
    revision: 3,
    finalized: true,
    rules: DEFAULT_BOARD,
    canToggle: true,
    participating: false,
  });
  assert.equal(
    (await teamBeverage(f.client, { type: "read", teamId })).status,
    "ok",
  );
  for (const invalid of [
    { teamId: "other" },
    { participating: "false" },
    { revision: -1 },
    { rules: { ...DEFAULT_BOARD, solo: 101 } },
  ]) {
    const bad = fixture({
      teamId,
      revision: 3,
      finalized: true,
      rules: DEFAULT_BOARD,
      canToggle: true,
      participating: false,
      ...invalid,
    });
    assert.equal(
      (await teamBeverage(bad.client, { type: "read", teamId })).status,
      "unavailable",
    );
  }
  const change = fixture();
  assert.equal(
    (
      await teamBeverage(change.client, {
        ...input,
        change: { type: "finalize", rules: DEFAULT_BOARD },
      })
    ).status,
    "accepted",
  );
  assert.equal(
    (
      await teamBeverage(change.client, {
        ...input,
        change: { type: "finalize", rules: { ...DEFAULT_BOARD, solo: 1.5 } },
      })
    ).status,
    "invalid",
  );
});
test("Beverage saves retain retry identifiers, distinguish conflicts and require authentication", async () => {
  const f = fixture(null, "NETWORK");
  assert.deepEqual(await teamBeverage(f.client, input), {
    status: "uncertain",
    commandId,
  });
  assert.equal(
    (
      await teamBeverage(
        fixture({ status: "conflict", revision: 2 }).client,
        input,
      )
    ).status,
    "conflict",
  );
  assert.equal(
    (
      await teamBeverage(fixture(null, "PGRST202").client, {
        type: "read",
        teamId,
      })
    ).status,
    "unsupported",
  );
  assert.equal(
    (await teamBeverage(fixture(null, "42501").client, input)).status,
    "access-denied",
  );
  const noAuth = fixture();
  noAuth.client.auth.getUser = async () => ({
    data: { user: null as never },
    error: null,
  });
  assert.equal(
    (await teamBeverage(noAuth.client, input)).status,
    "auth-required",
  );
  assert.equal(noAuth.calls.length, 0);
});
