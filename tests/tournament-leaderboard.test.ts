import test from "node:test";
import assert from "node:assert/strict";
import {
  rankTournamentPlayers,
  teamLeaderboard,
  tournamentLeaderboard,
} from "../src/lib/tournament-leaderboard.ts";
import {
  DEFAULT_BOARD,
  emptyTotals,
  evaluateGame,
  rates,
  type Game,
  type Play,
} from "../src/lib/scoring.ts";
import type {
  ConnectedGame,
  LoadedScorebook,
} from "../src/lib/scorebook-view.ts";
function game(
  id: string,
  cup: string,
  limit: number,
  plays: Play[],
): ConnectedGame {
  const source: Game = {
    id,
    opponent: "Synthetic opponent",
    kind: "Tournament",
    lineup: ["a", "b"],
    next: 0,
    complete: false,
    rules: { version: "Synthetic", fenceLimit: limit, board: DEFAULT_BOARD },
    plays,
  };
  return {
    game: {
      id,
      day_id: "day",
      tournament_id: cup,
      kind: "Tournament",
      opponent: source.opponent,
      completed: false,
      next_batter_position: 0,
    },
    playedOn: "2026-10-13",
    dayRevision: 0,
    tournamentRevision: 0,
    lineup: source.lineup,
    rules: { version_label: "Synthetic", fence_limit: limit },
    evaluation: evaluateGame(source, ["a"]),
  };
}
const play = (
  id: string,
  playerId: string,
  outcome: Play["outcome"],
  runs = 0,
  rbi = 0,
  voided = false,
): Play => ({ id, playerId, outcome, runs, rbi, voided });
function fixture(): LoadedScorebook {
  const first = game("first", "cup", 0, [
    play("over", "a", "Fence HR", 4, 4),
    play("hit-a", "a", "Hit"),
    play("hit-b", "b", "Hit"),
    play("void", "b", "Fence HR", 1, 1, true),
  ]);
  const second = game("second", "cup", 2, [
    play("hr", "a", "Fence HR", 1, 1),
    play("hit-b2", "b", "Hit", 2, 2),
    play("guest", "guest", "BB"),
  ]);
  const league = game("league", "cup", 100, [
    play("unrelated", "b", "Fence HR", 4, 4),
  ]);
  league.game.kind = "League";
  league.game.league_id = "league";
  return {
    archived: false,
    roster: [
      { id: "a", display_name: "Alex", is_guest: false },
      { id: "b", display_name: "Blair", is_guest: false },
    ],
    bands: [],
    leagueBands: [],
    participation: [],
    snapshot: {
      teamId: "team",
      seasonId: "season",
      scope: "Overall",
      board: { a: -2 },
      totals: { a: { ...emptyTotals(), H: 999 } },
      games: [
        first,
        second,
        league,
        game("other", "other-cup", 100, [
          play("unrelated2", "b", "Fence HR", 4, 4),
        ]),
      ],
      tournaments: [
        { id: "cup", name: "Cup", revision: 0 },
        { id: "other-cup", name: "Other cup", revision: 0 },
      ],
    },
  };
}
test("leaderboard uses only selected tournament effective totals, corrections/voids/HR limits and existing rates", () => {
  const data = fixture(),
    before = JSON.stringify(data);
  const rows = tournamentLeaderboard(data, "team", "season", "cup");
  assert.deepEqual(
    rows.map((row) => [
      row.name,
      row.rank,
      row.totals.H,
      row.totals.HR,
      row.totals.RBI,
    ]),
    [
      ["Alex", 1, 2, 1, 1],
      ["Blair", 1, 2, 0, 2],
      ["Former roster player", 3, 0, 0, 0],
    ],
  );
  assert.equal(rows[0].rates.OBP, 2 / 3);
  assert.equal(rows[0].totals.board, 0); // zero-limit charge and retained Band credit both survive aggregation
  assert.deepEqual(
    tournamentLeaderboard(data, "team", "season", "cup", "RBI").map(
      (row) => row.id,
    ),
    ["b", "a", "guest"],
  );
  assert.equal(JSON.stringify(data), before);
});

test("OBP ranks by the existing unrounded rate descending, ties share ranks and undefined rates stay unranked", () => {
  const player = (id: string, AB: number, H: number, BB = 0) => {
    const totals = { ...emptyTotals(), PA: AB + BB, AB, H, BB };
    return { id, name: id, totals, rates: rates(totals) };
  };
  const players = [
    player("undefined", 0, 0),
    player("zero", 1, 0),
    player("half", 2, 1),
    player("walk", 1, 0, 1),
    player("higher", 3, 2),
    player("perfect", 1, 1),
  ];
  const before = JSON.stringify(players);
  assert.deepEqual(
    rankTournamentPlayers(players, "OBP").map((row) => [row.id, row.rank]),
    [
      ["perfect", 1],
      ["higher", 2],
      ["half", 3],
      ["walk", 3],
      ["zero", 5],
      ["undefined", null],
    ],
  );
  assert.equal(JSON.stringify(players), before);
  const data = fixture();
  assert.deepEqual(
    tournamentLeaderboard(data, "team", "season", "cup", "OBP").map(
      (row) => row.id,
    ),
    ["b", "guest", "a"],
  );
});

test("HR leaderboard includes inside-the-park and legal fence HRs but excludes over-limit and voided HRs", () => {
  const data = fixture();
  data.snapshot.games = [
    game("both-hrs", "cup", 1, [
      play("fence", "a", "Fence HR", 1, 1),
      play("inside", "a", "ITP HR", 1, 1),
      play("over", "b", "Fence HR", 1, 1),
      play("void", "b", "ITP HR", 1, 1, true),
    ]),
  ];
  assert.deepEqual(
    tournamentLeaderboard(data, "team", "season", "cup", "HR").map((row) => [
      row.id,
      row.totals.HR,
    ]),
    [
      ["a", 2],
      ["b", 0],
    ],
  );
});
test("leaderboard rejects mixed team/season/unknown competition and updates from corrected authoritative totals", () => {
  const data = fixture();
  assert.deepEqual(tournamentLeaderboard(data, "other", "season", "cup"), []);
  assert.deepEqual(tournamentLeaderboard(data, "team", "other", "cup"), []);
  assert.deepEqual(
    tournamentLeaderboard(data, "team", "season", "missing"),
    [],
  );
  data.snapshot.games[1].evaluation.totals.a = emptyTotals();
  assert.equal(tournamentLeaderboard(data, "team", "season", "cup")[0].id, "b");
});

test("tournament Beverage totals preserve credit, charges and voids without using season or other-competition balances", () => {
  const data = fixture();
  data.snapshot.board = { a: 500, b: -500 };
  data.snapshot.games = [
    game("beverages", "cup", 2, [
      play("credit", "a", "Fence HR", 1, 1),
      play("charge", "b", "K"),
      play("void-credit", "a", "Fence HR", 1, 1, true),
    ]),
    game("other", "other-cup", 2, [
      play("excluded-credit", "a", "Fence HR", 1, 1),
    ]),
  ];
  const rows = tournamentLeaderboard(data, "team", "season", "cup");
  assert.equal(rows.find((row) => row.id === "a")?.totals.board, -1);
  assert.equal(rows.find((row) => row.id === "b")?.totals.board, 1);
  data.snapshot.games[0].evaluation.totals.a.board = -3;
  assert.equal(
    tournamentLeaderboard(data, "team", "season", "cup").find(
      (row) => row.id === "a",
    )?.totals.board,
    -3,
  );
});

test("Beverage ranking uses signed tournament net totals, shared ranks and effective corrections", () => {
  const data = fixture();
  data.snapshot.games = [
    game("rank-beverages", "cup", 2, [
      play("charge-a", "a", "K"),
      play("charge-b", "b", "K"),
      play("credit", "guest", "ITP HR", 1, 1),
    ]),
  ];
  data.snapshot.board = { a: 500, b: -500, guest: 999 };
  const before = JSON.stringify(data);
  const rows = tournamentLeaderboard(data, "team", "season", "cup", "board");
  assert.deepEqual(
    rows.map((row) => [row.id, row.rank, row.totals.board]),
    [
      ["a", 1, 1],
      ["b", 1, 1],
      ["guest", 3, -1],
    ],
  );
  assert.equal(JSON.stringify(data), before);
  // Effective RPC totals have already handled opt-out, voids and corrections.
  data.snapshot.games[0].evaluation.totals.a.board = 0;
  assert.deepEqual(
    tournamentLeaderboard(data, "team", "season", "cup", "board").map((row) => [
      row.id,
      row.totals.board,
    ]),
    [
      ["b", 1],
      ["a", 0],
      ["guest", -1],
    ],
  );
  data.snapshot.games[0].evaluation.totals.guest.board = 3;
  assert.equal(
    tournamentLeaderboard(data, "team", "season", "cup", "board")[0].id,
    "guest",
  );
});

test("team leaders use only the selected team, season and scope, including scoped Beverage totals", () => {
  const data = fixture();
  data.snapshot.scope = "League";
  data.snapshot.totals = {
    a: { ...emptyTotals(), PA: 2, AB: 2, H: 1, HR: 1, RBI: 3, board: -2 },
    b: { ...emptyTotals(), PA: 1, AB: 1, H: 1, board: 1 },
    noPlays: emptyTotals(),
  };
  // Separate season balances must never leak into a filtered leaderboard.
  data.snapshot.board = { a: 999, b: -999 };
  const before = JSON.stringify(data);
  const rows = teamLeaderboard(data, "team", "season", "League");
  assert.deepEqual(
    rows.map((row) => [row.id, row.totals.board]),
    [
      ["a", -2],
      ["b", 1],
    ],
  );
  assert.deepEqual(
    rankTournamentPlayers(rows, "OBP").map((row) => row.id),
    ["b", "a"],
  );
  for (const [team, season, scope] of [
    ["other", "season", "League"],
    ["team", "old", "League"],
    ["team", "season", "Overall"],
    ["team", "season", "Tournament"],
  ] as const)
    assert.deepEqual(teamLeaderboard(data, team, season, scope), []);
  assert.equal(JSON.stringify(data), before);
  // Rows are a plain independent projection safe to pass to the client UI.
  rows[0].totals.board = 123;
  assert.equal(data.snapshot.totals.a.board, -2);
  data.snapshot.totals.a.RBI = 0;
  assert.equal(
    teamLeaderboard(data, "team", "season", "League")[0].totals.RBI,
    0,
  );
});
