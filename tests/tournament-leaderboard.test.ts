import test from "node:test";
import assert from "node:assert/strict";
import {
  competitionStats,
  rankTournamentPlayers,
  overallTournamentLeaderboard,
  overallTournamentStats,
  tournamentStats,
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

test("Beverage leaders rank most owed first with signed totals, shared ties and effective corrections", () => {
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

test("overall tournament leaders combine all tournament games, exclude league and ignore season-wide personal totals", () => {
  const data = fixture();
  data.snapshot.scope = "League";
  data.snapshot.board = { a: 9999, b: -9999 };
  const before = JSON.stringify(data);
  const rows = overallTournamentLeaderboard(data, "team", "season");
  assert.deepEqual(rows.map(row => [row.id, row.totals.H, row.totals.HR, row.totals.RBI]), [
    ["b", 3, 1, 6], ["a", 2, 1, 1], ["guest", 0, 0, 0],
  ]);
  assert.equal(rows.find(row => row.id === "a")?.rates.OBP, 2 / 3);
  assert.equal(rows.find(row => row.id === "b")?.rates.OBP, 1);
  assert.equal(rows.find(row => row.id === "a")?.totals.board, 0);
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(overallTournamentLeaderboard(data, "other-team", "season"), []);
  assert.deepEqual(overallTournamentLeaderboard(data, "team", "other-season"), []);
  data.snapshot.games = data.snapshot.games.filter(({game}) => game.kind === "League");
  assert.deepEqual(overallTournamentLeaderboard(data, "team", "season"), []);
});

test("overall tournament leaders reflect signed credits and corrected authoritative totals across competitions", () => {
  const data = fixture();
  data.snapshot.games[0].evaluation.totals.a.board = -3;
  data.snapshot.games[1].evaluation.totals.a.board = -2;
  data.snapshot.games[3].evaluation.totals.b.RBI = 9;
  const rows = overallTournamentLeaderboard(data, "team", "season");
  assert.equal(rows.find(row => row.id === "a")?.totals.board, -5);
  assert.equal(rows.find(row => row.id === "b")?.totals.RBI, 11);
});

test("overall tournament team summary uses combined opportunities and signed tournament-only balances", () => {
  const data = fixture();
  const summary = overallTournamentStats(data, "team", "season")!;
  assert.deepEqual([summary.totals.PA, summary.totals.H, summary.totals.HR, summary.totals.RBI], [7, 5, 2, 7]);
  assert.equal(summary.rates.OBP, 6 / 7);
  assert.notEqual(summary.rates.OBP, summary.players.reduce((sum, row) => sum + (row.rates.OBP ?? 0), 0) / summary.players.length);
  assert.equal(summary.totals.board, summary.players.reduce((sum, row) => sum + row.totals.board, 0));
  assert.equal(overallTournamentStats(data, "foreign", "season"), null);
  assert.equal(overallTournamentStats(data, "team", "foreign"), null);
  data.snapshot.games = [];
  const empty = overallTournamentStats(data, "team", "season")!;
  assert.equal(empty.rates.OBP, null);
  assert.equal(empty.totals.PA, 0);
  assert.deepEqual(empty.players, []);
});

test("individual tournament summary reuses effective totals and rejects foreign or unknown tournaments", () => {
  const data = fixture();
  const summary = tournamentStats(data, "team", "season", "cup")!;
  assert.deepEqual([summary.totals.PA, summary.totals.H, summary.totals.HR, summary.totals.RBI], [6, 4, 1, 3]);
  assert.equal(summary.rates.OBP, 5 / 6);
  assert.notEqual(summary.totals.HR, overallTournamentStats(data, "team", "season")!.totals.HR);
  assert.equal(tournamentStats(data, "team", "season", "missing"), null);
  assert.equal(tournamentStats(data, "foreign", "season", "cup"), null);
  assert.equal(tournamentStats(data, "team", "foreign", "cup"), null);
  data.snapshot.games = data.snapshot.games.filter(({game}) => game.tournament_id !== "cup");
  const empty = tournamentStats(data, "team", "season", "cup")!;
  assert.equal(empty.rates.OBP, null);
  assert.equal(empty.totals.PA, 0);
});

test("earned beverages count gross tournament credits before offsets, ignoring voids and opted-out activity", () => {
  const data = fixture();
  const cup = game("earned-cup", "cup", 10, [
    play("band-credit", "a", "Fence HR", 1, 1),
    play("charge", "b", "K"),
    play("inside-credit", "a", "ITP HR", 1, 1),
    play("void-credit", "a", "Fence HR", 4, 4, true),
    play("opted-out", "b", "K"),
  ]);
  cup.evaluation.rows.find(row => row.id === "opted-out")!.beverageParticipating = false;
  cup.evaluation.totals.b.board -= 1;
  const other = game("earned-other", "other-cup", 10, [play("grand-credit", "b", "Fence HR", 4, 4), play("other-charge", "b", "K")]);
  const league = game("excluded-league", "cup", 10, [play("league-credit", "b", "ITP HR", 1, 1)]);
  league.game.kind = "League";
  data.snapshot.games = [cup, other, league];
  const before = JSON.stringify(data);
  const selected = tournamentStats(data, "team", "season", "cup")!;
  assert.deepEqual(selected.beverageActivity, { earned: 2, owed: 1 });
  assert.equal(selected.totals.board, -1);
  assert.deepEqual(tournamentStats(data, "team", "season", "other-cup")!.beverageActivity, { earned: 1, owed: 1 });
  const combined = overallTournamentStats(data, "team", "season")!;
  assert.deepEqual(combined.beverageActivity, { earned: 3, owed: 2 });
  assert.equal(combined.totals.board, combined.beverageActivity!.owed - combined.beverageActivity!.earned);
  assert.equal(JSON.stringify(data), before);
});

test("gross beverage activity stays unknown when historical play details are missing or inconsistent", () => {
  const data = fixture();
  data.snapshot.games[0].evaluation.rows = [];
  assert.equal(tournamentStats(data, "team", "season", "cup")!.beverageActivity, null);
  const complete = fixture();
  complete.snapshot.games[0].evaluation.rows[0].delta = 99;
  assert.equal(overallTournamentStats(complete, "team", "season")!.beverageActivity, null);
});

test("BEV leaders show largest positive debt first, then settled, then credits; equal balances share rank", () => {
  const players = [
    ["large-credit", -5], ["tied-credit", -5], ["small-credit", -2], ["settled", 0], ["small-debt", 1], ["large-debt", 8],
  ].map(([id, balance]) => {
    const totals = { ...emptyTotals(), PA: 1, AB: 1, board: Number(balance) };
    return { id: String(id), name: String(id), totals, rates: rates(totals) };
  });
  const before = JSON.stringify(players);
  assert.deepEqual(rankTournamentPlayers(players, "board").map(row => [row.totals.board, row.rank]), [
    [8, 1], [1, 2], [0, 3], [-2, 4], [-5, 5], [-5, 5],
  ]);
  assert.equal(JSON.stringify(players), before);
});


test("league summaries isolate each league and kind, reuse weighted rates and keep signed activity and leaders", () => {
  const data = fixture();
  function leagueGame(id: string, league: string, plays: Play[]) {
    const row = game(id, "one", 2, plays);
    row.game.kind = "League";
    row.game.league_id = league;
    row.evaluation = evaluateGame({ id, opponent: "Synthetic opponent", kind: "League", lineup: ["a", "b"], next: 0, complete: false,
      rules: { version: "Synthetic", fenceLimit: 2, board: DEFAULT_BOARD }, plays }, []);
    return row;
  }
  data.snapshot.leagues = [{ id: "one", name: "Thursday League", fenceLimit: 2 }, { id: "two", name: "Sunday League", fenceLimit: 2 }, { id: "empty", name: "Upcoming League", fenceLimit: 2 }];
  data.snapshot.games = [
    leagueGame("one-a", "one", [play("hit", "a", "Hit"), play("out", "b", "Out"), play("k", "b", "K"), play("credit", "a", "ITP HR", 1, 1), play("void", "b", "ITP HR", 1, 1, true)]),
    leagueGame("one-b", "one", [play("walk", "a", "BB"), play("rbi", "b", "Hit", 1, 1)]),
    leagueGame("two", "two", [play("solo", "a", "Fence HR", 1, 1), play("charge", "b", "K")]),
    game("tournament-same-id", "one", 100, [play("excluded", "b", "Fence HR", 4, 4)]),
  ];
  data.snapshot.scope = "Tournament";
  data.snapshot.board = { a: 999, b: -999 };
  const before = JSON.stringify(data);
  const one = competitionStats(data, "team", "season", "League", "one")!;
  const two = competitionStats(data, "team", "season", "League", "two")!;
  const overall = competitionStats(data, "team", "season", "League")!;
  assert.deepEqual([one.totals.PA, one.totals.H, one.totals.HR, one.totals.RBI, one.totals.board], [6, 3, 1, 2, 0]);
  assert.equal(one.rates.OBP, 4 / 6);
  assert.deepEqual(one.beverageActivity, { earned: 1, owed: 1 });
  assert.deepEqual(rankTournamentPlayers(one.players, "board").map(row => [row.id, row.totals.board]), [["b", 1], ["a", -1]]);
  assert.deepEqual([two.totals.PA, two.totals.H, two.totals.HR, two.totals.RBI, two.totals.board], [2, 1, 1, 1, 2]);
  assert.equal(two.rates.OBP, .5);
  assert.deepEqual(two.beverageActivity, { earned: 0, owed: 2 });
  assert.deepEqual([overall.totals.PA, overall.totals.H, overall.totals.HR, overall.totals.RBI, overall.totals.board], [8, 4, 2, 3, 2]);
  assert.equal(overall.rates.OBP, 5 / 8);
  assert.deepEqual(overall.beverageActivity, { earned: 1, owed: 3 });
  assert.equal(JSON.stringify(data), before);
  for (const [team, season, id] of [["foreign", "season", "one"], ["team", "foreign", "one"], ["team", "season", "missing"], ["team", "season", "cup"]])
    assert.equal(competitionStats(data, team, season, "League", id), null);
  const empty = competitionStats(data, "team", "season", "League", "empty")!;
  assert.equal(empty.totals.PA, 0); assert.equal(empty.rates.OBP, null); assert.deepEqual(empty.players, []);
  data.snapshot.games[0].evaluation.totals.a.board = -4;
  assert.equal(competitionStats(data, "team", "season", "League", "one")!.players.find(row => row.id === "a")!.totals.board, -4);
  assert.equal(competitionStats(data, "team", "season", "League", "one")!.beverageActivity, null, "inconsistent historical detail stays unknown");
});
