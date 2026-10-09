import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_BOARD, evaluateGame } from "../src/lib/scoring.ts";
import {
  applySeasonCommand,
  bandsForGame,
  createSeasonScorebook,
  replaySeasonJournal,
  type SeasonCommand,
  type SeasonScorebook,
} from "../src/lib/season-scorebook.ts";
import {
  seasonBeverageBoard,
  seasonTotals,
} from "../src/lib/season-scoring.ts";
const rules = (limit = 1, version = "v1") => ({
  version,
  fenceLimit: limit,
  board: { ...DEFAULT_BOARD },
});
const roster = [
  { id: "a", name: "Synthetic A" },
  { id: "b", name: "Synthetic B" },
];

test("tournament Game 4 is numbered and scoreboard updates preserve season totals", () => {
  let b = fixture();
  for (let n = 1; n <= 4; n++) b = start(b, `numbered-${n}`, `2026-10-${String(n).padStart(2,"0")}`, n === 1 ? { a: false } : {});
  assert.deepEqual(b.seasons[0].scoring.games.map(g => g.game.tournamentGameNumber), [1,2,3,4]);
  const before = seasonTotals(b.seasons[0].scoring);
  const command: SeasonCommand = { type:"game", seasonId:"fall", change:{ type:"scoreboard", gameId:"numbered-4", teamRuns:8,opponentRuns:6,inning:3,half:"Bottom",reason:"Confirmed field score" } };
  b = run(b, command);
  assert.equal(b.seasons[0].scoring.games[3].game.scoreboard?.teamRuns,8);
  assert.equal(b.audit.at(-1)?.reason,"Confirmed field score");
  assert.deepEqual(seasonTotals(b.seasons[0].scoring),before);
});
function run(
  book: SeasonScorebook,
  command: SeasonCommand,
  id = `cmd-${book.revision}`,
) {
  return applySeasonCommand(book, {
    commandId: id,
    expectedRevision: book.revision,
    actor: "synthetic-member",
    at: "2026-10-09T12:00:00Z",
    command,
  });
}
function fixture() {
  let b = run(createSeasonScorebook("team", roster), {
    type: "season",
    seasonId: "fall",
    name: "Fall",
    rules: rules(),
  });
  return run(b, {
    type: "tournament",
    seasonId: "fall",
    tournamentId: "cup",
    name: "Cup",
    rules: rules(),
  });
}
function start(
  b: SeasonScorebook,
  id: string,
  date: string,
  choices: Record<string, boolean> = {},
  lineup = ["a"],
) {
  return run(b, {
    type: "start",
    seasonId: "fall",
    dayId: date,
    gameId: id,
    kind: "Tournament",
    tournamentId: "cup",
    opponent: "Synthetic",
    lineup,
    rules: rules(),
    bands: choices,
  });
}
function hr(b: SeasonScorebook, id: string, player = "a") {
  return run(b, {
    type: "game",
    seasonId: "fall",
    change: {
      type: "score",
      gameId: id,
      playId: `${id}-${b.revision}`,
      playerId: player,
      outcome: "Fence HR",
      runs: 1,
      rbi: 1,
    },
  });
}
test("season journal reuses scoring controls with fixed cross-date tournament Bands and audited corrections", () => {
  let b = hr(start(fixture(), "g1", "2026-10-09", { a: true }), "g1");
  b = run(b, {
    type: "game",
    seasonId: "fall",
    change: { type: "complete", gameId: "g1" },
  });
  b = hr(start(b, "g2", "2026-10-10"), "g2");
  assert.equal(seasonBeverageBoard(b.seasons[0].scoring).a, -2);
  assert.throws(() => start(b, "g3", "2026-10-11", { a: false }), /stay fixed/);
  const corrected = run(b, {
    type: "band",
    seasonId: "fall",
    tournamentId: "cup",
    playerId: "a",
    hasBand: false,
    reason: "Correct first assignment",
  });
  assert.equal(seasonBeverageBoard(corrected.seasons[0].scoring).a, 2);
  assert.equal(seasonBeverageBoard(b.seasons[0].scoring).a, -2);
  assert.equal(corrected.seasons[0].scoring.bands[0].firstGameId, "g1");
  const first = corrected.seasons[0].scoring.games[0].game;
  const changed = run(corrected, {
    type: "game",
    seasonId: "fall",
    change: {
      type: "correct",
      gameId: "g1",
      playId: first.plays[0].id,
      outcome: "K",
      runs: 0,
      rbi: 0,
      voided: false,
      reason: "Wrong outcome",
    },
  });
  assert.equal(changed.audit.at(-1)?.reason, "Wrong outcome");
  assert.equal(seasonTotals(changed.seasons[0].scoring).a.HR, 1);
});
test("late entrants receive first-game decisions; invalid lineup assignment rolls back all changes", () => {
  let b = start(fixture(), "g1", "first", { a: false });
  assert.throws(
    () =>
      run(b, {
        type: "game",
        seasonId: "fall",
        change: { type: "lineup", gameId: "g1", lineup: ["a", "b"] },
      }),
    /first tournament game/,
  );
  b = run(b, {
    type: "game",
    seasonId: "fall",
    change: { type: "lineup", gameId: "g1", lineup: ["a", "b"] },
    firstGameBands: { b: true },
  });
  assert.equal(
    b.seasons[0].scoring.bands.find((p) => p.playerId === "b")?.firstGameId,
    "g1",
  );
  const snapshot = JSON.stringify(b);
  assert.throws(
    () =>
      run(b, {
        type: "game",
        seasonId: "fall",
        change: { type: "lineup", gameId: "g1", lineup: ["a", "unknown"] },
        firstGameBands: { unknown: true },
      }),
    /roster/,
  );
  assert.equal(JSON.stringify(b), snapshot);
  assert.deepEqual(bandsForGame(b.seasons[0], "g1"), ["b"]);
});
test("league and tournament rules freeze per game; zero override and fresh season preserve history", () => {
  let b = hr(start(fixture(), "t1", "day", { a: true }), "t1");
  b = run(b, {
    type: "start",
    seasonId: "fall",
    dayId: "later",
    gameId: "league",
    kind: "League",
    opponent: "Synthetic",
    lineup: ["a"],
    rules: rules(0, "zero"),
    bands: { a: false },
  });
  b = hr(b, "league");
  const s = b.seasons[0].scoring;
  assert.equal(seasonTotals(s, "League").a.HR, 0);
  assert.equal(seasonTotals(s, "Tournament").a.HR, 1);
  assert.equal(seasonBeverageBoard(s).a, 0);
  b = run(b, {
    type: "rules",
    seasonId: "fall",
    tournamentId: "cup",
    rules: rules(0, "future"),
  });
  assert.equal(b.seasons[0].scoring.games[0].game.rules.fenceLimit, 1);
  const snapshot = JSON.stringify(b.seasons[0]);
  b = run(b, {
    type: "season",
    seasonId: "spring",
    name: "Spring",
    rules: rules(3),
  });
  assert.deepEqual(seasonBeverageBoard(b.seasons[1].scoring), {});
  assert.equal(JSON.stringify(b.seasons[0]), snapshot);
  assert.equal(
    evaluateGame(b.seasons[0].scoring.games[1].game, []).rows[0].official,
    "OLHR",
  );
});
test("whole-book revision and command identity protect cross-date changes and retry property order", () => {
  const b = fixture();
  const command: SeasonCommand = {
    type: "start",
    seasonId: "fall",
    dayId: "one",
    gameId: "g1",
    opponent: "Synthetic",
    kind: "Tournament",
    tournamentId: "cup",
    lineup: ["a"],
    rules: rules(),
    bands: { a: true },
  };
  const request = {
    commandId: "retry",
    expectedRevision: b.revision,
    actor: "member",
    at: "2026-10-09T12:00:00Z",
    command,
  };
  const next = applySeasonCommand(b, request);
  const reordered = Object.fromEntries(
    Object.entries(command).reverse(),
  ) as SeasonCommand;
  assert.equal(
    applySeasonCommand(next, {
      ...request,
      command: reordered,
      at: "2026-10-10T12:00:00Z",
    }),
    next,
  );
  assert.throws(
    () =>
      applySeasonCommand(next, {
        ...request,
        command: { ...command, dayId: "two" },
      }),
    /different change/,
  );
  assert.throws(
    () => applySeasonCommand(next, { ...request, commandId: "other" }),
    /changed/,
  );
});
test("journal replay validates context, nested payloads and bounds without trusting stored totals", () => {
  const command: SeasonCommand = {
    type: "season",
    seasonId: "fall",
    name: "Synthetic",
    rules: rules(),
  };
  const request = {
    commandId: "init",
    expectedRevision: 0,
    actor: "synthetic",
    at: "2026-10-09T12:00:00Z",
    command,
  };
  const journal = {
    format: 2 as const,
    initial: { teamId: "team", players: roster },
    requests: [request],
  };
  assert.equal(replaySeasonJournal(journal).revision, 1);
  assert.throws(
    () =>
      replaySeasonJournal({
        ...journal,
        requests: [
          {
            ...request,
            command: { ...command, totals: { HR: 900 } } as SeasonCommand,
          },
        ],
      }),
    /unrecognized/,
  );
  assert.throws(
    () =>
      run(createSeasonScorebook("team", roster), {
        ...command,
        rules: { ...rules(), board: { ...DEFAULT_BOARD, secret: 1 } },
      } as SeasonCommand),
    /unrecognized/,
  );
  assert.throws(
    () =>
      replaySeasonJournal({ ...journal, requests: Array(1001).fill(request) }),
    /Unrecognized/,
  );
});
