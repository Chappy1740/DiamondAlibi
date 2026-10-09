import test from "node:test";
import assert from "node:assert/strict";
import {
  validScoreboard,
  connectedScoreboard,
} from "../src/lib/game-scoreboard.ts";
import {
  createScorebook,
  applyCommand,
  aggregate,
  DEFAULT_BOARD,
  type Command,
} from "../src/lib/scoring.ts";
test("unknown history stays unknown; whole-score and inning bounds reject bad values", () => {
  assert.equal(connectedScoreboard({}), null);
  const v = { teamRuns: 0, opponentRuns: 0, inning: 1, half: "Top" };
  assert.ok(validScoreboard(v));
  for (const change of [
    { teamRuns: -1 },
    { opponentRuns: 1000 },
    { inning: 0 },
    { inning: 1.5 },
    { half: "Unknown" },
    { teamRuns: "1" },
  ])
    assert.equal(validScoreboard({ ...v, ...change }), false);
});
test("scoreboard edits are audited/retry safe and do not alter player accounting", () => {
  let book = createScorebook({
    teamId: "team",
    seasonId: "season",
    dayId: "day",
    players: [{ id: "a", name: "Synthetic" }],
    bands: [],
    rules: { version: "v1", fenceLimit: 0, board: { ...DEFAULT_BOARD } },
  });
  const send = (command: Command, id = `c-${book.revision}`) =>
    applyCommand(book, {
      commandId: id,
      expectedRevision: book.revision,
      actor: "synthetic",
      at: "2026-10-09T12:00:00Z",
      command,
    });
  book = send({
    type: "start",
    gameId: "game",
    kind: "League",
    opponent: "Visitors",
    lineup: ["a"],
  });
  assert.equal(book.games[0].scoreboard, undefined);
  const totals = aggregate(book, "Overall");
  const command: Command = {
    type: "scoreboard",
    gameId: "game",
    teamRuns: 8,
    opponentRuns: 6,
    inning: 3,
    half: "Bottom",
    reason: "Confirmed field scoreboard",
  };
  book = send(command, "board-id");
  assert.equal(send(command, "board-id"), book);
  assert.deepEqual(aggregate(book, "Overall"), totals);
  assert.equal(book.audit.at(-1)?.reason, "Confirmed field scoreboard");
  book = send({ type: "complete", gameId: "game" });
  book = send({ ...command, teamRuns: 9, reason: "Final score correction" });
  assert.equal(book.games[0].scoreboard?.teamRuns, 9);
  assert.throws(() => send({ ...command, reason: "" }));
  assert.throws(() =>
    applyCommand(book, {
      commandId: "stale",
      expectedRevision: 0,
      actor: "synthetic",
      at: "2026-10-09T12:00:00Z",
      command,
    }),
  );
});
