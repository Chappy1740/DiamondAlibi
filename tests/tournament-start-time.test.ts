import test from "node:test";
import assert from "node:assert/strict";
import {
  validStartTime,
  tournamentStartLabel,
} from "../src/lib/tournament-start-time.ts";
import {
  connectedScoring,
  type ScoringClient,
} from "../src/lib/connected-scoring.ts";
test("venue time stays stable across device zones and missing times are not guessed", () => {
  assert.equal(
    tournamentStartLabel({
      firstGameTime: "08:00",
      firstGameZone: "America/Chicago",
    }),
    "8:00 AM Central",
  );
  assert.equal(
    tournamentStartLabel({ firstGameTime: "00:00", firstGameZone: "UTC" }),
    "12:00 AM UTC",
  );
  assert.equal(
    tournamentStartLabel({
      firstGameTime: "23:59",
      firstGameZone: "America/New_York",
    }),
    "11:59 PM Eastern",
  );
  for (const value of [
    {},
    { firstGameTime: null },
    { firstGameTime: "24:00", firstGameZone: "UTC" },
    { firstGameTime: "08:00", firstGameZone: "CST" },
  ])
    assert.equal(tournamentStartLabel(value), null);
  assert.equal(validStartTime(null, "America/Chicago"), true);
  for (const time of ["", "8:00", "24:00", "08:60", {}, undefined])
    assert.equal(validStartTime(time, "America/Chicago"), false);
});
test("time writes authenticate, reject forged fields and keep retry identity", async () => {
  const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const request = {
    type: "tournamentStartTime",
    teamId: id(1),
    seasonId: id(2),
    tournamentId: id(3),
    commandId: id(4),
    expectedRevision: 0,
    time: "08:00",
    zone: "America/Chicago",
  };
  let calls = 0;
  const client: ScoringClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: id(9) } }, error: null }),
    },
    rpc: async (name, args) => {
      calls++;
      assert.equal(name, "da_set_tournament_start_time");
      assert.equal(args.p_time, "08:00");
      assert.equal(args.p_command, id(4));
      throw Error("Synthetic uncertain save");
    },
  };
  for (const bad of [
    { ...request, time: "8:00" },
    { ...request, zone: "CST" },
    { ...request, expectedRevision: -1 },
    { ...request, actorId: id(9) },
  ])
    assert.deepEqual(await connectedScoring(client, bad), {
      status: "invalid",
    });
  assert.equal(calls, 0);
  assert.deepEqual(await connectedScoring(client, request), {
    status: "uncertain",
    commandId: id(4),
  });
  client.auth.getUser = async () => ({ data: { user: null }, error: null });
  assert.deepEqual(await connectedScoring(client, request), {
    status: "auth-required",
  });
  assert.equal(calls, 1);
});
