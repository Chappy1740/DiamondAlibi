import { competitionView } from "./competitions.ts";
import { emptyTotals, rates, type Totals } from "./scoring.ts";
import type { LoadedScorebook } from "./scorebook-view.ts";
export type LeaderboardMetric = "H" | "HR" | "RBI" | "board";
export type TournamentPlayer = {
  id: string;
  name: string;
  totals: Totals;
  rates: ReturnType<typeof rates>;
};
export function rankTournamentPlayers(
  players: readonly TournamentPlayer[],
  metric: LeaderboardMetric = "H",
) {
  const rows = [...players].sort(
    (a, b) =>
      b.totals[metric] - a.totals[metric] ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
  let rank = 0;
  return rows.map((row, index) => {
    if (!index || row.totals[metric] !== rows[index - 1].totals[metric])
      rank = index + 1;
    return { ...row, rank };
  });
}
export function tournamentLeaderboard(
  data: LoadedScorebook,
  team: string,
  season: string,
  tournament: string,
  metric: LeaderboardMetric = "H",
) {
  const selected = competitionView(
    data,
    team,
    season,
    "Tournament",
    tournament,
  );
  if (!selected) return [];
  const totals = new Map<string, Totals>();
  for (const game of selected.games) {
    // Use the engine's authoritative effective totals: corrections, voids,
    // over-limit HRs and original rule versions have already been applied.
    for (const [id, value] of Object.entries(game.evaluation.totals)) {
      const combined = totals.get(id) ?? emptyTotals();
      for (const key of Object.keys(combined) as (keyof Totals)[])
        combined[key] += value[key];
      totals.set(id, combined);
    }
  }
  const rows = [...totals]
    .filter(([, value]) => value.PA > 0)
    .map(([id, value]) => ({
      id,
      name:
        data.roster.find((player) => player.id === id)?.display_name ??
        "Former roster player",
      totals: value,
      rates: rates(value),
    }));
  return rankTournamentPlayers(rows, metric);
}
