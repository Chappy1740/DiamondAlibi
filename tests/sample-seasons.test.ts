import test from "node:test";
import assert from "node:assert/strict";
import { createSampleSeasons, sampleScope } from "../src/lib/sample-seasons.ts";
import { personalDashboard } from "../src/lib/personal-dashboard.ts";

test("four seasons share twelve players and each has sixteen league games", () => {
  const books = createSampleSeasons();
  assert.equal(books.length, 4);
  for (const b of books) {
    assert.equal(b.roster.length, 12);
    assert.equal(
      b.snapshot.games.filter((g) => g.game.kind === "League").length,
      16,
    );
    assert.deepEqual(
      b.roster.map((p) => p.id),
      books[0].roster.map((p) => p.id),
    );
  }
  assert.deepEqual(createSampleSeasons(), books);
});
test("seven tournaments satisfy four 3gg and three 2gg with additional games", () => {
  const books = createSampleSeasons();
  const tournaments = books.flatMap((b) => b.snapshot.tournaments);
  assert.equal(tournaments.length, 7);
  assert.equal(tournaments.filter((t) => t.guaranteedGames === 3).length, 4);
  assert.equal(tournaments.filter((t) => t.guaranteedGames === 2).length, 3);
  const counts = tournaments.map(
    (t) =>
      books
        .flatMap((b) => b.snapshot.games)
        .filter((g) => g.game.tournament_id === t.id).length,
  );
  assert.ok(counts.some((count, i) => count > tournaments[i].guaranteedGames!));
  assert.ok(new Set(counts).size > 1);
  for (const [i, count] of counts.entries())
    assert.ok(count >= tournaments[i].guaranteedGames!);
});
test("scope totals reconcile, board stays season-wide, old history stays separate", () => {
  const books = createSampleSeasons();
  for (const b of books) {
    const league = sampleScope(b, "League"),
      tournament = sampleScope(b, "Tournament");
    assert.deepEqual(league.snapshot.board, b.snapshot.board);
    assert.deepEqual(tournament.snapshot.board, b.snapshot.board);
    for (const player of b.roster) {
      const overall = b.snapshot.totals[player.id];
      assert.equal(
        overall.PA,
        league.snapshot.totals[player.id].PA +
          tournament.snapshot.totals[player.id].PA,
      );
      assert.equal(
        overall.HR,
        league.snapshot.totals[player.id].HR +
          tournament.snapshot.totals[player.id].HR,
      );
      assert.equal(
        b.snapshot.board[player.id],
        b.snapshot.games.reduce(
          (sum, g) => sum + (g.evaluation.totals[player.id]?.board ?? 0),
          0,
        ),
      );
    }
    assert.equal(b.leagueBands.length, 0);
  }
  assert.notDeepEqual(books[0].snapshot.board, books[3].snapshot.board);
  const latest = books[3];
  const personal = personalDashboard(latest, {
    userId: latest.roster[0].user_id!,
    teamId: latest.snapshot.teamId,
    seasonId: latest.snapshot.seasonId,
  });
  assert.equal(personal?.liveGames.length, 1);
});
