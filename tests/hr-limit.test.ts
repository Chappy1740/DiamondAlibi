import test from "node:test";
import assert from "node:assert/strict";
import {
  createScorebook,
  applyCommand,
  aggregate,
  DEFAULT_BOARD,
  type Command,
} from "../src/lib/scoring.ts";
test("whole-game HR corrections recalculate every batter, preserve siblings/defaults and support finals", () => {
  let book = createScorebook({
    teamId: "t",
    seasonId: "s",
    dayId: "d",
    players: [
      { id: "a", name: "Alex" },
      { id: "b", name: "Morgan" },
    ],
    bands: ["a"],
    rules: { version: "original", fenceLimit: 1, board: { ...DEFAULT_BOARD } },
  });
  function send(command: Command) {
    book = applyCommand(book, {
      commandId: `c${book.revision}`,
      expectedRevision: book.revision,
      actor: "synthetic",
      at: "2026-10-09T12:00:00Z",
      command,
    });
  }
  send({
    type: "start",
    gameId: "g",
    opponent: "Visitors",
    kind: "Tournament",
    lineup: ["a", "b"],
  });
  send({
    type: "score",
    gameId: "g",
    playId: "pa",
    playerId: "a",
    outcome: "Fence HR",
    runs: 1,
    rbi: 1,
  });
  send({
    type: "score",
    gameId: "g",
    playId: "pb",
    playerId: "b",
    outcome: "Fence HR",
    runs: 2,
    rbi: 2,
  });
  send({
    type: "start",
    gameId: "sibling",
    opponent: "Other",
    kind: "Tournament",
    lineup: ["a"],
  });
  send({ type: "complete", gameId: "g" });
  send({
    type: "hrLimit",
    gameId: "g",
    fenceLimit: 0,
    reason: "Correct field rules",
  });
  let totals = aggregate(book, "Overall");
  assert.equal(totals.a.HR, 0);
  assert.equal(totals.b.HR, 0);
  assert.equal(totals.b.RBI, 0);
  assert.equal(totals.a.board, 1);
  assert.equal(totals.b.board, 1);
  assert.equal(book.games[1].rules.fenceLimit, 1);
  assert.equal(book.rules.fenceLimit, 1);
  send({
    type: "hrLimit",
    gameId: "g",
    fenceLimit: 2,
    reason: "Confirmed posted limit",
  });
  totals = aggregate(book, "Overall");
  assert.equal(totals.a.HR, 1);
  assert.equal(totals.b.HR, 1);
  assert.equal(totals.b.RBI, 2);
  assert.equal(totals.a.board, -1);
  assert.equal(totals.b.board, 0);
  assert.equal(book.audit.at(-1)?.reason, "Confirmed posted limit");
  assert.throws(() =>
    send({ type: "hrLimit", gameId: "g", fenceLimit: 2, reason: "" }),
  );
  assert.throws(() =>
    send({ type: "hrLimit", gameId: "g", fenceLimit: -1, reason: "Invalid" }),
  );
});
