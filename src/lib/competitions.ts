import type { ConnectedGame, LoadedScorebook } from "./scorebook-view.ts";

export type CompetitionKind = "League" | "Tournament";
export function competitionPath(kind: CompetitionKind, id?: string) {
  const path = kind === "League" ? "/leagues" : "/tournaments";
  return id ? `${path}/${encodeURIComponent(id)}` : path;
}
export function contextQuery(team: string, season: string) {
  return new URLSearchParams({ team, season }).toString();
}
export function competitionGames(
  games: ConnectedGame[], kind: CompetitionKind, id: string,
) {
  return games.filter(({ game }) => game.kind === kind &&
    (kind === "League" ? game.league_id === id : game.tournament_id === id));
}
// This projects an already-authorized snapshot; it never grants membership.
export function competitionView(
  data: LoadedScorebook, team: string, season: string,
  kind: CompetitionKind, id: string,
) {
  if (data.snapshot.teamId !== team || data.snapshot.seasonId !== season) return null;
  const competition = kind === "League"
    ? data.snapshot.leagues?.find((c) => c.id === id)
    : data.snapshot.tournaments.find((c) => c.id === id);
  if (!competition) return null;
  return { competition, games: competitionGames(data.snapshot.games, kind, id) };
}
