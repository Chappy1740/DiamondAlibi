import { competitionView, type CompetitionKind } from "./competitions.ts";
import { emptyTotals, rates, type Scope, type Totals } from "./scoring.ts";
import type { ConnectedGame, LoadedScorebook } from "./scorebook-view.ts";
export type OutcomeMetric = "DP";
export type OutcomeCounts = Record<OutcomeMetric, number | null>;
export type LeaderboardMetric = "OBP" | "H" | "HR" | "RBI" | "board" | "SO" | "2B" | "3B" | OutcomeMetric;
export type TournamentPlayer = {
  id: string;
  name: string;
  totals: Totals;
  outcomes?: OutcomeCounts;
  hitTypes?: { "2B": number | null; "3B": number | null };
  rates: ReturnType<typeof rates>;
};
export function leaderboardValue(
  row: TournamentPlayer,
  metric: LeaderboardMetric,
) {
  if (metric === "SO") return row.totals.K;
  if (metric === "DP") return row.outcomes?.DP ?? null;
  if (metric === "2B" || metric === "3B") return row.hitTypes?.[metric] ?? null;
  return metric === "OBP" ? row.rates.OBP : row.totals[metric as keyof Totals];
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
  const outcomeIndex = indexPlayerOutcomes(snapshot.games.filter(({game}) => scope === "Overall" || game.kind === scope));
  // Use scoped totals.board, never the separate season-wide snapshot.board.
  return Object.entries(snapshot.totals)
    .filter(([, totals]) => totals.PA > 0)
    .map(([id, totals]) => ({
      id,
      name:
        data.roster.find((player) => player.id === id)?.display_name ??
        "Former roster player",
      totals: { ...totals },
      outcomes: playerOutcomeCounts(outcomeIndex, id, totals.PA),
      hitTypes: playerHitTypes(outcomeIndex, id, totals.PA),
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
  const outcomeIndex = indexPlayerOutcomes(games);
  const rows = [...totals]
    .filter(([, value]) => value.PA > 0)
    .map(([id, value]) => ({
      id,
      name:
        data.roster.find((player) => player.id === id)?.display_name ??
        "Former roster player",
      totals: value,
      outcomes: playerOutcomeCounts(outcomeIndex, id, value.PA),
      hitTypes: playerHitTypes(outcomeIndex, id, value.PA),
      rates: rates(value),
    }));
  return rankTournamentPlayers(rows, metric);
}

/** Index effective rows once per projection, rather than rescan every play per player. */
function indexPlayerOutcomes(games: readonly ConnectedGame[]) {
  const index = new Map<string, {counts: OutcomeCounts; hits: NonNullable<TournamentPlayer["hitTypes"]>; appearances: number}>();
  for (const game of games) {
    if (!game.evaluation || !Array.isArray(game.evaluation.rows) || !game.evaluation.totals) continue;
    const rowsByPlayer = new Map<string, ConnectedGame["evaluation"]["rows"]>();
    for (const row of game.evaluation.rows) {
      if (row.voided) continue;
      const rows = rowsByPlayer.get(row.playerId) ?? [];
      rows.push(row); rowsByPlayer.set(row.playerId, rows);
    }
    const explicit = typeof game.rules.double_play === "number" && Number.isFinite(game.rules.double_play);
    for (const [playerId, total] of Object.entries(game.evaluation.totals)) {
      if (total.PA === 0) continue;
      const entry = index.get(playerId) ?? {counts: {DP: 0}, hits: {"2B": 0, "3B": 0}, appearances: 0};
      index.set(playerId, entry);
      const {counts} = entry;
      entry.appearances += total.PA;
      const rows = rowsByPlayer.get(playerId) ?? [];
      for (const key of ["2B", "3B"] as const) {
        if (rows.length !== total.PA || rows.some(row => row.outcome === "Hit")) entry.hits[key] = null;
        else if (entry.hits[key] !== null) entry.hits[key] += rows.filter(row => row.outcome === key).length;
      }
      if (rows.length !== total.PA || !explicit) {
        counts.DP = null;
        continue;
      }
      if (counts.DP !== null) counts.DP += rows.filter(row => row.outcome === "DP").length;
    }
  }
  return index;
}
/** Unrecorded double plays and incomplete historical projections remain unranked. */
function playerOutcomeCounts(index: ReturnType<typeof indexPlayerOutcomes>, playerId: string, expectedPA: number): OutcomeCounts {
  const entry = index.get(playerId);
  return entry?.appearances === expectedPA ? {...entry.counts} : { DP: null };
}
function playerHitTypes(index: ReturnType<typeof indexPlayerOutcomes>, playerId: string, expectedPA: number): NonNullable<TournamentPlayer["hitTypes"]> {
  const entry = index.get(playerId);
  return entry?.appearances === expectedPA ? {...entry.hits} : {"2B": null, "3B": null};
}
