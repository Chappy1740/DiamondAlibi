import type { LoadedScorebook } from "./scorebook-view.ts";
import type { Rules } from "./scoring.ts";

export function tournamentContinuation(
  data: LoadedScorebook | null,
  tournamentId: string,
) {
  const tournament = data?.snapshot.tournaments.find(
    (t) => t.id === tournamentId,
  );
  if (!data || !tournament || tournament.fenceLimit == null) return null;
  const game = data.snapshot.games
    .filter((g) => g.game.tournament_id === tournamentId)
    .sort(
      (a, b) =>
        (b.game.tournament_game_number ?? 0) -
          (a.game.tournament_game_number ?? 0) ||
        b.playedOn.localeCompare(a.playedOn) ||
        b.game.id.localeCompare(a.game.id),
    )[0];
  if (!game || (!game.lineup.length && game.game.batting_mode !== "manual")) return null;
  const columns = {
    strikeout: "strikeout",
    solo: "solo",
    bandSolo: "band_solo",
    grandSlam: "grand_slam",
    overLimit: "over_limit",
    insidePark: "inside_park",
    multiRun: "multi_run",
  } as const;
  const board = {} as Rules["board"];
  for (const [key, column] of Object.entries(columns)) {
    const value = game.rules[column as keyof typeof game.rules];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      Math.abs(value) > 100
    )
      return null;
    board[key as keyof typeof board] = value;
  }
  if (
    game.lineup.some(
      (id) =>
        !data.roster.some((p) => p.id === id) ||
        !data.bands.some(
          (b) => b.tournament_id === tournamentId && b.player_id === id,
        ),
    )
  )
    return null;
  return { tournament, game, board, battingMode: game.game.batting_mode ?? "ordered" };
}
export type TournamentContinuation = NonNullable<
  ReturnType<typeof tournamentContinuation>
>;
