import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_BOARD, type Game } from "../src/lib/scoring.ts";
import {
  addSeasonGame,
  correctSeasonGame,
  correctTournamentBand,
  createSeasonScoring,
  seasonBeverageBoard,
  seasonTotals,
} from "../src/lib/season-scoring.ts";
const game = (
  id: string,
  kind: "League" | "Tournament" = "Tournament",
  limit = 1,
): Game => ({
  id,
  kind,
  opponent: "Synthetic",
  lineup: ["a"],
  next: 0,
  complete: true,
  rules: { version: "v1", fenceLimit: limit, board: { ...DEFAULT_BOARD } },
  plays: [
    {
      id: `${id}-play`,
      playerId: "a",
      outcome: "Fence HR",
      runs: 1,
      rbi: 1,
      voided: false,
    },
  ],
});
test("tournament Bands persist across dates and cannot be recalculated by another game", () => {
  let s = addSeasonGame(
    createSeasonScoring("team", "fall"),
    { dayId: "friday", game: game("g1"), tournamentId: "t1" },
    { a: true },
  );
  s = addSeasonGame(s, {
    dayId: "sunday",
    game: game("g2"),
    tournamentId: "t1",
  });
  assert.equal(seasonBeverageBoard(s).a, -2);
  assert.equal(s.bands[0].firstGameId, "g1");
  assert.throws(
    () =>
      addSeasonGame(
        s,
        { dayId: "sunday", game: game("g3"), tournamentId: "t1" },
        { a: false },
      ),
    /stay fixed/,
  );
  const later = addSeasonGame(
    s,
    { dayId: "next month", game: game("g3"), tournamentId: "t2" },
    { a: false },
  );
  assert.equal(seasonBeverageBoard(later).a, -1);
  assert.equal(later.bands.length, 2);
});
test("late entrants receive their own first-game assignment, including explicit no Band", () => {
  let s = addSeasonGame(
    createSeasonScoring("team", "fall"),
    { dayId: "first", game: game("g1"), tournamentId: "t" },
    { a: false },
  );
  const next = game("g2");
  next.lineup.push("b");
  assert.throws(
    () => addSeasonGame(s, { dayId: "second", game: next, tournamentId: "t" }),
    /first tournament game/,
  );
  s = addSeasonGame(
    s,
    { dayId: "second", game: next, tournamentId: "t" },
    { b: true },
  );
  assert.equal(s.bands.find((b) => b.playerId === "b")?.firstGameId, "g2");
  assert.equal(s.bands.find((b) => b.playerId === "a")?.hasBand, false);
});
test("season Board combines league/tournament; new season starts fresh without rewriting old history", () => {
  let old = addSeasonGame(createSeasonScoring("team", "fall"), {
    dayId: "day1",
    game: game("league", "League"),
    leagueBands: [],
  });
  old = addSeasonGame(
    old,
    { dayId: "day2", game: game("tournament"), tournamentId: "t" },
    { a: true },
  );
  assert.equal(seasonTotals(old, "League").a.board, 1);
  assert.equal(seasonTotals(old, "Tournament").a.board, -1);
  assert.equal(seasonBeverageBoard(old).a, 0);
  const snapshot = JSON.stringify(old);
  const fresh = createSeasonScoring("team", "spring");
  assert.deepEqual(seasonBeverageBoard(fresh), {});
  assert.equal(JSON.stringify(old), snapshot);
});
test("zero fence limit makes fence HR an out while inside-park HR still counts", () => {
  const zero = game("zero", "League", 0);
  zero.plays.push({
    id: "itp",
    playerId: "a",
    outcome: "ITP HR",
    runs: 1,
    rbi: 1,
    voided: false,
  });
  const s = addSeasonGame(createSeasonScoring("team", "fall"), {
    dayId: "day",
    game: zero,
    leagueBands: [],
  });
  assert.equal(seasonTotals(s).a.HR, 1);
  assert.equal(seasonTotals(s).a.RBI, 1);
  assert.equal(seasonBeverageBoard(s).a, 0);
});
test("audited Band correction recalculates all tournament days and preserves original state", () => {
  let s = addSeasonGame(
    createSeasonScoring("team", "fall"),
    { dayId: "first", game: game("g1"), tournamentId: "t" },
    { a: true },
  );
  s = addSeasonGame(s, {
    dayId: "second",
    game: game("g2"),
    tournamentId: "t",
  });
  assert.throws(() => correctTournamentBand(s, "t", "a", false, ""), /reason/);
  const changed = correctTournamentBand(
    s,
    "t",
    "a",
    false,
    "Correct initial designation",
  );
  assert.equal(seasonBeverageBoard(changed).a, 2);
  assert.equal(seasonBeverageBoard(s).a, -2);
  assert.equal(changed.bands[0].firstGameId, "g1");
  assert.equal(changed.audit.length, 1);
});
test("historical game correction recalculates original season and rejects rule/classification changes", () => {
  const original = game("league", "League");
  const s = addSeasonGame(createSeasonScoring("team", "fall"), {
    dayId: "day",
    game: original,
    leagueBands: [],
  });
  const changed = structuredClone(original);
  changed.plays[0].outcome = "K";
  changed.plays[0].runs = 0;
  changed.plays[0].rbi = 0;
  assert.equal(
    seasonTotals(correctSeasonGame(s, changed, "Wrong outcome")).a.HR,
    0,
  );
  assert.equal(seasonTotals(s).a.HR, 1);
  assert.throws(
    () =>
      correctSeasonGame(
        s,
        { ...changed, rules: { ...changed.rules, fenceLimit: 0 } },
        "Change",
      ),
    /original rules/,
  );
  assert.throws(
    () => correctSeasonGame(s, { ...changed, kind: "Tournament" }, "Change"),
    /classification/,
  );
});
