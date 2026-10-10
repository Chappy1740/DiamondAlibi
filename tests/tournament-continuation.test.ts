import test from "node:test";
import assert from "node:assert/strict";
import { tournamentContinuation } from "../src/lib/tournament-continuation.ts";
import type {
  ConnectedGame,
  LoadedScorebook,
} from "../src/lib/scorebook-view.ts";

function fixture(): LoadedScorebook {
  const game: ConnectedGame = {
    game: {
      id: "game-1",
      day_id: "day",
      tournament_id: "cup",
      opponent: "Other team",
      kind: "Tournament",
      completed: false,
      next_batter_position: 0,
      tournament_game_number: 1,
    },
    playedOn: "2026-10-09",
    dayRevision: 1,
    tournamentRevision: 1,
    lineup: ["b", "a"],
    rules: {
      version_label: "Saved",
      fence_limit: 4,
      strikeout: 2,
      solo: 3,
      band_solo: -2,
      grand_slam: -4,
      over_limit: 5,
      inside_park: 0,
      multi_run: -1,
    },
    evaluation: { rows: [], fenceUsed: 0, totals: {} },
  };
  return {
    snapshot: {
      teamId: "team",
      seasonId: "season",
      scope: "Overall",
      totals: {},
      board: {},
      games: [game],
      tournaments: [
        {
          id: "cup",
          name: "Cup",
          revision: 1,
          fenceLimit: 0,
          guaranteedGames: 3,
        },
      ],
    },
    roster: [
      { id: "a", display_name: "Alex", is_guest: false },
      { id: "b", display_name: "Blair", is_guest: false },
    ],
    bands: [
      { tournament_id: "cup", player_id: "a", has_band: true },
      { tournament_id: "cup", player_id: "b", has_band: false },
    ],
    participation: [],
    leagueBands: [],
    archived: false,
  };
}

test("continuation preserves lineup/custom Board and uses competition zero rather than a previous game override", () => {
  const data = fixture();
  const before = structuredClone(data);
  const result = tournamentContinuation(data, "cup");
  assert.ok(result);
  assert.equal(result.tournament.fenceLimit, 0);
  assert.deepEqual(result.game.lineup, ["b", "a"]);
  assert.deepEqual(result.board, {
    strikeout: 2,
    solo: 3,
    bandSolo: -2,
    grandSlam: -4,
    overLimit: 5,
    insidePark: 0,
    multiRun: -1,
  });
  assert.deepEqual(data, before);
});

test("only the latest game in the selected tournament supplies carried settings", () => {
  const data = fixture();
  const second = structuredClone(data.snapshot.games[0]);
  second.game.id = "game-2";
  second.game.tournament_game_number = 2;
  second.lineup = ["a"];
  second.rules.solo = 7;
  const unrelated = structuredClone(second);
  unrelated.game.id = "unrelated";
  unrelated.game.tournament_id = "another-cup";
  unrelated.game.tournament_game_number = 20;
  data.snapshot.games.push(unrelated, second);
  const result = tournamentContinuation(data, "cup");
  assert.equal(result?.game.game.id, "game-2");
  assert.equal(result?.board.solo, 7);
  assert.deepEqual(result?.game.lineup, ["a"]);
});

test("incomplete historical settings retain explicit setup instead of guessing defaults", () => {
  for (const mutate of [
    (d: LoadedScorebook) => {
      d.snapshot.tournaments[0].fenceLimit = null;
    },
    (d: LoadedScorebook) => {
      delete d.snapshot.games[0].rules.solo;
    },
    (d: LoadedScorebook) => {
      d.bands = [];
    },
    (d: LoadedScorebook) => {
      d.roster = [];
    },
    (d: LoadedScorebook) => {
      d.snapshot.games = [];
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.equal(tournamentContinuation(data, "cup"), null);
  }
});
