import assert from "node:assert/strict";
import { test } from "node:test";
import { createScorebook, DEFAULT_BOARD } from "../src/lib/scoring.ts";
import {
  submitScoringCommand,
  type ScoringStore,
  type ScoringSubmission,
} from "../src/lib/scoring-service.ts";

function fixture() {
  let book = createScorebook({
    teamId: "team",
    seasonId: "season",
    dayId: "day",
    players: [{ id: "player", name: "Synthetic" }],
    bands: [],
    rules: { version: "v1", fenceLimit: 1, board: { ...DEFAULT_BOARD } },
  });
  let member = true,
    fail = false,
    writes = 0,
    reads = 0;
  let queue: Promise<unknown> = Promise.resolve();
  const store: ScoringStore = {
    transaction(context, work) {
      const next = queue.then(async () => {
        let pending = book;
        const result = await work({
          canScore: async () =>
            member &&
            context.teamId === "team" &&
            context.seasonId === "season" &&
            context.dayId === "day",
          read: async () => {
            reads++;
            return structuredClone(book);
          },
          write: async (value) => {
            if (fail) throw new Error("Simulated commit failure");
            pending = value;
            writes++;
          },
        });
        book = pending;
        return result;
      });
      queue = next.catch(() => undefined);
      return next;
    },
  };
  const request: ScoringSubmission = {
    teamId: "team",
    seasonId: "season",
    dayId: "day",
    commandId: "start-1",
    expectedRevision: 0,
    command: {
      type: "start",
      gameId: "game",
      opponent: "Synthetic opponent",
      kind: "League",
      lineup: ["player"],
    },
  };
  const dependencies = {
    authenticatedUser: async () => "member",
    store,
    now: () => "2026-10-09T12:00:00Z",
  };
  return {
    request,
    dependencies,
    current: () => book,
    writes: () => writes,
    reads: () => reads,
    revoke: () => {
      member = false;
    },
    fail: () => {
      fail = true;
    },
  };
}

test("session owns audit identity and time; forged client identity is rejected", async () => {
  const f = fixture();
  assert.equal(
    (
      await submitScoringCommand(
        { ...f.request, actor: "other", at: "yesterday" },
        f.dependencies,
      )
    ).status,
    "invalid",
  );
  assert.equal(f.writes(), 0);
  assert.equal(
    (await submitScoringCommand(f.request, f.dependencies)).status,
    "accepted",
  );
  assert.equal(f.current().audit[0].actor, "member");
  assert.equal(f.current().audit[0].at, "2026-10-09T12:00:00Z");
});
test("nonmembers and cross-context requests cannot read or write a scorebook", async () => {
  const f = fixture();
  assert.equal(
    (
      await submitScoringCommand(f.request, {
        ...f.dependencies,
        authenticatedUser: async () => null,
      })
    ).status,
    "forbidden",
  );
  assert.equal(
    (
      await submitScoringCommand(
        { ...f.request, teamId: "other" },
        f.dependencies,
      )
    ).status,
    "forbidden",
  );
  assert.equal(
    (
      await submitScoringCommand(
        { ...f.request, seasonId: "other" },
        f.dependencies,
      )
    ).status,
    "forbidden",
  );
  f.revoke();
  assert.equal(
    (await submitScoringCommand(f.request, f.dependencies)).status,
    "forbidden",
  );
  assert.equal(f.reads(), 0);
  assert.equal(f.writes(), 0);
});
test("concurrent writers with one expected revision accept exactly one", async () => {
  const f = fixture();
  const results = await Promise.all([
    submitScoringCommand(f.request, f.dependencies),
    submitScoringCommand(
      {
        ...f.request,
        commandId: "start-2",
        command: {
          ...f.request.command,
          type: "start",
          gameId: "game-2",
          opponent: "Other",
          kind: "League",
          lineup: ["player"],
        },
      },
      f.dependencies,
    ),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    ["accepted", "conflict"],
  );
  assert.equal(f.current().revision, 1);
  assert.equal(f.current().games.length, 1);
});
test("ambiguous-response retry is idempotent despite stale revision and property order", async () => {
  const f = fixture();
  await submitScoringCommand(f.request, f.dependencies);
  const reordered = {
    ...f.request,
    command: {
      lineup: ["player"],
      kind: "League",
      opponent: "Synthetic opponent",
      gameId: "game",
      type: "start",
    },
  };
  const retry = await submitScoringCommand(reordered, f.dependencies);
  assert.equal(retry.status, "accepted");
  if (retry.status === "accepted") assert.equal(retry.duplicate, true);
  assert.equal(f.writes(), 1);
  const changed = await submitScoringCommand(
    { ...f.request, command: { type: "complete", gameId: "game" } },
    f.dependencies,
  );
  assert.equal(changed.status, "invalid");
  f.revoke();
  assert.equal(
    (await submitScoringCommand(f.request, f.dependencies)).status,
    "forbidden",
  );
});
test("malformed/oversized inputs cannot mutate state; failed persistence never reports acceptance", async () => {
  const f = fixture();
  for (const value of [
    null,
    [],
    { ...f.request, expectedRevision: 0.5 },
    { ...f.request, command: { type: "constructor" } },
    {
      ...f.request,
      command: { type: "complete", gameId: "game", extra: true },
    },
    { ...f.request, command: { type: "start", opponent: "x".repeat(40000) } },
  ])
    assert.equal(
      (await submitScoringCommand(value, f.dependencies)).status,
      "invalid",
    );
  assert.equal(f.writes(), 0);
  f.fail();
  await assert.rejects(
    submitScoringCommand(f.request, f.dependencies),
    /commit failure/,
  );
  assert.equal(f.current().revision, 0);
  assert.equal(f.current().audit.length, 0);
});
