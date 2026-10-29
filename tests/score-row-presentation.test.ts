import test from "node:test";
import assert from "node:assert/strict";
import { scoreRowSummary } from "../src/lib/score-row-presentation.ts";
import { DEFAULT_BOARD, evaluateGame, type Game } from "../src/lib/scoring.ts";

test("over-limit entry displays only Out while replay retains original inputs and Beverage charge", () => {
  const game: Game = {
    id: "game", opponent: "Synthetic opponent", lineup: ["a"], next: 0, complete: false,
    kind: "League", rules: { version: "test", fenceLimit: 0, board: { ...DEFAULT_BOARD, overLimit: 3 } },
    plays: [{ id: "over", playerId: "a", outcome: "Fence HR", runs: 4, rbi: 4, voided: false }],
  };
  const before = structuredClone(game);
  const result = evaluateGame(game, []);
  assert.equal(scoreRowSummary(result.rows[0]), "Out");
  assert.equal(result.rows[0].official, "OLHR");
  assert.equal(result.rows[0].runs, 4);
  assert.equal(result.rows[0].rbi, 4);
  assert.equal(result.rows[0].delta, 3);
  assert.deepEqual([result.totals.a.PA, result.totals.a.AB, result.totals.a.H, result.totals.a.HR, result.totals.a.runs, result.totals.a.RBI], [1, 1, 0, 0, 0, 0]);
  assert.deepEqual(game, before);
  // A corrected limit replays the retained entry as a legal HR, including its original RBI.
  game.rules.fenceLimit = 1;
  assert.equal(scoreRowSummary(evaluateGame(game, []).rows[0]), "Fence HR · 4 runs, 4 RBI");
  game.plays[0].voided = true;
  assert.equal(scoreRowSummary(evaluateGame(game, []).rows[0]), "Voided");
});

test("ordinary results keep their recorded runs and RBI", () => {
  assert.equal(scoreRowSummary({ official: "Out", runs: 1, rbi: 1, voided: false }), "Out · 1 runs, 1 RBI");
  assert.equal(scoreRowSummary({ official: "1B", runs: 0, rbi: 0, voided: false }), "1B · 0 runs, 0 RBI");
});
