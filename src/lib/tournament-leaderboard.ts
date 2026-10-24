import { competitionView, type CompetitionKind } from "./competitions.ts";
import { emptyTotals, rates, type Scope, type Totals } from "./scoring.ts";
import type { ConnectedGame, LoadedScorebook } from "./scorebook-view.ts";
export type LeaderboardMetric = "OBP" | "H" | "HR" | "RBI" | "board";
export type TournamentPlayer = {
  id: string;
  name: string;
  totals: Totals;
  rates: ReturnType<typeof rates>;
};
export function leaderboardValue(
  row: TournamentPlayer,
  metric: LeaderboardMetric,
) {
  return metric === "OBP" ? row.rates.OBP : row.totals[metric];
}
export function rankTournamentPlayers(
  players: readonly TournamentPlayer[],
  metric: LeaderboardMetric = "H",
) {
  const value = (row: TournamentPlayer) => leaderboardValue(row, metric);
  const rows = [...players].sort(
    (a, b) =>
      (value(b) ?? -Infinity) - (value(a) ?? -Infinity) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
  let rank = 0;
  return rows.map((row, index) => {
    if (!index || value(row) !== value(rows[index - 1])) rank = index + 1;
    return { ...row, rank: value(row) == null ? null : rank };
  });
}
/** Projects an already-authorized, scoped season snapshot; never grants access. */
export function teamLeaderboard(
  data: LoadedScorebook,
  team: string,
  season: string,
  scope: Scope,
) {
  const snapshot = data.snapshot;
  if (
    snapshot.teamId !== team ||
    snapshot.seasonId !== season ||
    snapshot.scope !== scope
  )
    return [];
  // Use scoped totals.board, never the separate season-wide snapshot.board.
  return Object.entries(snapshot.totals)
    .filter(([, totals]) => totals.PA > 0)
    .map(([id, totals]) => ({
      id,
      name:
        data.roster.find((player) => player.id === id)?.display_name ??
        "Former roster player",
      totals: { ...totals },
      rates: rates(totals),
    }));
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
  return playersFromGames(data, selected.games, metric);
}

/** All Tournament games in this authorized team/season, regardless of personal stats scope. */
export function overallTournamentLeaderboard(
  data: LoadedScorebook,
  team: string,
  season: string,
) {
  if (data.snapshot.teamId !== team || data.snapshot.seasonId !== season) return [];
  return playersFromGames(data, data.snapshot.games.filter(({ game }) => game.kind === "Tournament"));
}

export function overallTournamentStats(data: LoadedScorebook, team: string, season: string) {
  return competitionStats(data, team, season, "Tournament");
}

export function tournamentStats(data: LoadedScorebook, team: string, season: string, tournament: string) {
  return competitionStats(data, team, season, "Tournament", tournament);
}

/** Reuses authorized game evaluations for either a single competition or its season-wide kind. */
export function competitionStats(data: LoadedScorebook, team: string, season: string, kind: CompetitionKind, id?: string) {
  if (data.snapshot.teamId !== team || data.snapshot.seasonId !== season) return null;
  if (id !== undefined) {
    const selected = competitionView(data, team, season, kind, id);
    return selected ? statsForGames(data, selected.games) : null;
  }
  return statsForGames(data, data.snapshot.games.filter(({ game }) => game.kind === kind));
}

function statsForGames(data: LoadedScorebook, games: readonly ConnectedGame[]) {
  const players = playersFromGames(data, games);
  const totals = emptyTotals();
  for (const player of players)
    for (const key of Object.keys(totals) as (keyof Totals)[])
      totals[key] += player.totals[key];
  // Weight team rates by summed opportunities, never average player percentages.
  return { players, totals, rates: rates(totals), beverageActivity: beverageActivity(games) };
}

// Gross activity comes from effective recorded plays, not the signed net balance.
// Missing/inconsistent historical detail stays unknown instead of inventing zero earned.
function beverageActivity(games: readonly ConnectedGame[]) {
  let earned = 0, owed = 0;
  for (const game of games) {
    let net = 0, appearances = 0;
    for (const row of game.evaluation.rows) {
      if (row.voided) continue;
      appearances++;
      if (row.beverageParticipating === false) continue;
      if (!Number.isFinite(row.delta)) return null;
      net += row.delta;
      if (row.delta < 0) earned -= row.delta;
      else owed += row.delta;
    }
    const effective = Object.values(game.evaluation.totals);
    if (net !== effective.reduce((sum, value) => sum + value.board, 0) ||
        appearances !== effective.reduce((sum, value) => sum + value.PA, 0)) return null;
  }
  return { earned, owed };
}

function playersFromGames(
  data: LoadedScorebook,
  games: readonly ConnectedGame[],
  metric: LeaderboardMetric = "H",
) {
  const totals = new Map<string, Totals>();
  for (const game of games) {
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
