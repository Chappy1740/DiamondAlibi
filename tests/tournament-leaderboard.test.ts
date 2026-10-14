import test from "node:test";
import assert from "node:assert/strict";
import { tournamentLeaderboard } from "../src/lib/tournament-leaderboard.ts";
import { DEFAULT_BOARD, emptyTotals, evaluateGame, type Game, type Play } from "../src/lib/scoring.ts";
import type { ConnectedGame, LoadedScorebook } from "../src/lib/scorebook-view.ts";
function game(id: string, cup: string, limit: number, plays: Play[]): ConnectedGame {
  const source: Game = { id, opponent: "Synthetic opponent", kind: "Tournament", lineup: ["a", "b"], next: 0, complete: false, rules: { version: "Synthetic", fenceLimit: limit, board: DEFAULT_BOARD }, plays };
  return { game: { id, day_id: "day", tournament_id: cup, kind: "Tournament", opponent: source.opponent, completed: false, next_batter_position: 0 }, playedOn: "2026-10-13", dayRevision: 0, tournamentRevision: 0, lineup: source.lineup, rules: { version_label: "Synthetic", fence_limit: limit }, evaluation: evaluateGame(source, ["a"]) };
}
const play = (id: string, playerId: string, outcome: Play["outcome"], runs = 0, rbi = 0, voided = false): Play => ({ id, playerId, outcome, runs, rbi, voided });
function fixture(): LoadedScorebook {
  const first = game("first", "cup", 0, [play("over", "a", "Fence HR", 4, 4), play("hit-a", "a", "Hit"), play("hit-b", "b", "Hit"), play("void", "b", "Fence HR", 1, 1, true)]);
  const second = game("second", "cup", 2, [play("hr", "a", "Fence HR", 1, 1), play("hit-b2", "b", "Hit", 2, 2), play("guest", "guest", "BB")]);
  const league = game("league", "cup", 100, [play("unrelated", "b", "Fence HR", 4, 4)]); league.game.kind = "League"; league.game.league_id = "league";
  return { archived: false, roster: [{ id: "a", display_name: "Alex", is_guest: false }, { id: "b", display_name: "Blair", is_guest: false }], bands: [], leagueBands: [], participation: [], snapshot: { teamId: "team", seasonId: "season", scope: "Overall", board: { a: -2 }, totals: { a: { ...emptyTotals(), H: 999 } }, games: [first, second, league, game("other", "other-cup", 100, [play("unrelated2", "b", "Fence HR", 4, 4)])], tournaments: [{ id: "cup", name: "Cup", revision: 0 }, { id: "other-cup", name: "Other cup", revision: 0 }] } };
}
test("leaderboard uses only selected tournament effective totals, corrections/voids/HR limits and existing rates", () => {
  const data = fixture(), before = JSON.stringify(data);
  const rows = tournamentLeaderboard(data, "team", "season", "cup");
  assert.deepEqual(rows.map(row => [row.name, row.rank, row.totals.H, row.totals.HR, row.totals.RBI]), [["Alex", 1, 2, 1, 1], ["Blair", 1, 2, 0, 2], ["Former roster player", 3, 0, 0, 0]]);
  assert.equal(rows[0].rates.OBP, 2 / 3);
  assert.equal(rows[0].totals.board, 0); // zero-limit charge and retained Band credit both survive aggregation
  assert.deepEqual(tournamentLeaderboard(data, "team", "season", "cup", "RBI").map(row => row.id), ["b", "a", "guest"]);
  assert.equal(JSON.stringify(data), before);
});
test("leaderboard rejects mixed team/season/unknown competition and updates from corrected authoritative totals", () => {
  const data = fixture();
  assert.deepEqual(tournamentLeaderboard(data, "other", "season", "cup"), []);
  assert.deepEqual(tournamentLeaderboard(data, "team", "other", "cup"), []);
  assert.deepEqual(tournamentLeaderboard(data, "team", "season", "missing"), []);
  data.snapshot.games[1].evaluation.totals.a = emptyTotals();
  assert.equal(tournamentLeaderboard(data, "team", "season", "cup")[0].id, "b");
});

test("tournament Beverage totals preserve credit, charges and voids without using season or other-competition balances", () => {
  const data = fixture();
  data.snapshot.board = { a: 500, b: -500 };
  data.snapshot.games = [game("beverages", "cup", 2, [play("credit", "a", "Fence HR", 1, 1), play("charge", "b", "K"), play("void-credit", "a", "Fence HR", 1, 1, true)]), game("other", "other-cup", 2, [play("excluded-credit", "a", "Fence HR", 1, 1)])];
  const rows = tournamentLeaderboard(data, "team", "season", "cup");
  assert.equal(rows.find(row => row.id === "a")?.totals.board, -1);
  assert.equal(rows.find(row => row.id === "b")?.totals.board, 1);
  data.snapshot.games[0].evaluation.totals.a.board = -3;
  assert.equal(tournamentLeaderboard(data, "team", "season", "cup").find(row => row.id === "a")?.totals.board, -3);
});
