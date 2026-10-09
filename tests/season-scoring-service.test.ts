import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_BOARD } from "../src/lib/scoring.ts";
import {
  applySeasonCommand,
  createSeasonScorebook,
  type SeasonCommand,
} from "../src/lib/season-scorebook.ts";
import {
  submitSeasonScoring,
  type SeasonStore,
} from "../src/lib/season-scoring-service.ts";
function fixture() {
  let book = createSeasonScorebook("team", [{ id: "a", name: "Synthetic" }]);
  const rules = { version: "v1", fenceLimit: 1, board: { ...DEFAULT_BOARD } };
  const setup = (command: SeasonCommand) => {
    book = applySeasonCommand(book, {
      commandId: `setup-${book.revision}`,
      expectedRevision: book.revision,
      actor: "member",
      at: "2026-10-09T12:00:00Z",
      command,
    });
  };
  setup({ type: "season", seasonId: "fall", name: "Fall", rules });
  setup({
    type: "tournament",
    seasonId: "fall",
    tournamentId: "t",
    name: "Synthetic Cup",
    rules,
  });
  for (const [gameId, dayId] of [
    ["g1", "friday"],
    ["g2", "sunday"],
  ])
    setup({
      type: "start",
      seasonId: "fall",
      dayId,
      gameId,
      opponent: "Synthetic",
      kind: "Tournament",
      tournamentId: "t",
      lineup: ["a"],
      rules,
      bands: gameId === "g1" ? { a: true } : {},
    });
  let member = true,
    archived = false,
    fail = false,
    writes = 0,
    reads = 0;
  let queue: Promise<unknown> = Promise.resolve();
  const store: SeasonStore = {
    transaction(teamId, work) {
      const job = queue.then(async () => {
        let pending = book;
        const result = await work({
          canScore: async (user, command) =>
            member &&
            !archived &&
            user === "member" &&
            teamId === "team" &&
            command.seasonId === "fall",
          read: async () => {
            reads++;
            return structuredClone(book);
          },
          write: async (value) => {
            pending = value;
          },
        });
        if (fail) throw new Error("Simulated commit failure");
        if (pending !== book) writes++;
        book = pending;
        return result;
      });
      queue = job.catch(() => undefined);
      return job;
    },
  };
  const command: SeasonCommand = {
    type: "band",
    seasonId: "fall",
    tournamentId: "t",
    playerId: "a",
    hasBand: false,
    reason: "Correct initial designation",
  };
  const request = {
    teamId: "team",
    commandId: "correction",
    expectedRevision: book.revision,
    command,
  };
  return {
    request,
    deps: {
      store,
      authenticatedUser: async () => "member",
      now: () => "2026-10-09T15:00:00Z",
    },
    current: () => book,
    writes: () => writes,
    reads: () => reads,
    revoke: () => {
      member = false;
    },
    archive: () => {
      archived = true;
    },
    fail: () => {
      fail = true;
    },
  };
}
test("cross-date Band correction and scoring serialize on one revision; a stale writer must review", async () => {
  const f = fixture();
  const score = {
    ...f.request,
    commandId: "score",
    command: {
      type: "game" as const,
      seasonId: "fall",
      change: {
        type: "score" as const,
        gameId: "g2",
        playId: "play",
        playerId: "a",
        outcome: "Fence HR" as const,
        runs: 1,
        rbi: 1,
      },
    },
  };
  const results = await Promise.all([
    submitSeasonScoring(f.request, f.deps),
    submitSeasonScoring(score, f.deps),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    ["accepted", "conflict"],
  );
  assert.equal(f.writes(), 1);
  assert.equal(f.current().seasons[0].scoring.bands[0].hasBand, false);
  assert.equal(f.current().audit.at(-1)?.actor, "member");
  assert.equal(f.current().audit.at(-1)?.at, "2026-10-09T15:00:00Z");
});
test("revoked, archived and cross-team requests cannot read or retry accepted changes", async () => {
  for (const deny of ["revoke", "archive"] as const) {
    const f = fixture();
    assert.equal(
      (await submitSeasonScoring(f.request, f.deps)).status,
      "accepted",
    );
    const reads = f.reads();
    f[deny]();
    assert.equal(
      (await submitSeasonScoring(f.request, f.deps)).status,
      "forbidden",
    );
    assert.equal(f.reads(), reads);
  }
  const f = fixture();
  assert.equal(
    (await submitSeasonScoring({ ...f.request, teamId: "other" }, f.deps))
      .status,
    "forbidden",
  );
  assert.equal(f.reads(), 0);
});
test("ambiguous response retries retain command identity; forged actor/totals and commit failure are rejected", async () => {
  const f = fixture();
  assert.equal(
    (await submitSeasonScoring({ ...f.request, actor: "owner" }, f.deps))
      .status,
    "invalid",
  );
  assert.equal(
    (
      await submitSeasonScoring(
        {
          ...f.request,
          command: { ...f.request.command, totals: { board: 900 } },
        },
        f.deps,
      )
    ).status,
    "invalid",
  );
  assert.equal(
    (await submitSeasonScoring(f.request, f.deps)).status,
    "accepted",
  );
  const duplicate = await submitSeasonScoring(f.request, f.deps);
  assert.equal(duplicate.status, "accepted");
  if (duplicate.status === "accepted") assert.equal(duplicate.duplicate, true);
  assert.equal(f.writes(), 1);
  const broken = fixture();
  const before = JSON.stringify(broken.current());
  broken.fail();
  await assert.rejects(
    submitSeasonScoring(broken.request, broken.deps),
    /commit failure/,
  );
  assert.equal(JSON.stringify(broken.current()), before);
});
