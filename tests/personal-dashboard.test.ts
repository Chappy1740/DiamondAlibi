import test from "node:test";
import assert from "node:assert/strict";
import { personalDashboard } from "../src/lib/personal-dashboard.ts";
import { emptyTotals } from "../src/lib/scoring.ts";
import type { LoadedScorebook } from "../src/lib/scorebook-view.ts";

const context = { userId: "member", teamId: "team", seasonId: "season" };
function fixture(): LoadedScorebook {
  return {
    snapshot: {
      teamId: "team", seasonId: "season", scope: "League",
      totals: { player: { ...emptyTotals(), PA: 4, AB: 4, H: 3 } },
      board: { player: -2 }, games: [], tournaments: [],
    },
    roster: [{ id: "player", user_id: "member", display_name: "Sample", is_guest: false }],
    bands: [], participation: [], leagueBands: [], archived: false,
  };
}
test("keeps season board separate from filtered stats and reflects corrections", () => {
  const loaded = fixture();
  const result = personalDashboard(loaded, context)!;
  assert.equal(result.statistics?.OBP, .75);
  assert.equal(result.beverageBalance, -2);
  assert.equal("AVG" in result.statistics!, false);
  loaded.snapshot.totals.player.H = 2;
  assert.equal(personalDashboard(loaded, context)?.statistics?.OBP, .5);
});
test("rejects mixed contexts and never guesses personal identity or missing values", () => {
  const loaded = fixture();
  assert.equal(personalDashboard(loaded, { ...context, teamId: "other" }), null);
  assert.equal(personalDashboard(loaded, { ...context, seasonId: "old" }), null);
  loaded.roster[0].is_guest = true;
  assert.equal(personalDashboard(loaded, context)?.player, null);
  loaded.roster[0].is_guest = false;
  loaded.roster.push({ ...loaded.roster[0], id: "duplicate" });
  assert.equal(personalDashboard(loaded, context)?.player, null);
  loaded.roster.pop();
  delete loaded.snapshot.totals.player;
  delete loaded.snapshot.board.player;
  assert.equal(personalDashboard(loaded, context)?.statistics, null);
  assert.equal(personalDashboard(loaded, context)?.beverageBalance, null);
});
test("promotes active games and preserves next batter without mutating the snapshot", () => {
  const loaded = fixture();
  const game = {
    game: { id: "live", day_id: "day", tournament_id: null, opponent: "Visitors",
      kind: "League" as const, completed: false, next_batter_position: 0 },
    playedOn: "2026-10-09", dayRevision: 1, tournamentRevision: null,
    lineup: ["player"], rules: { version_label: "v1", fence_limit: 0 },
    evaluation: { rows: [], fenceUsed: 0, totals: {} },
  };
  loaded.snapshot.games = [game, { ...game, game: { ...game.game, id: "done", completed: true } }];
  const before = JSON.stringify(loaded);
  const live = personalDashboard(loaded, context)!.liveGames;
  assert.equal(live.length, 1);
  assert.equal(live[0].currentBatter, "Sample");
  assert.equal(live[0].participating, true);
  assert.equal(JSON.stringify(loaded), before);
});
