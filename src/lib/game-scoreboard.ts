export type GameScoreboard = {
  teamRuns: number;
  opponentRuns: number;
  inning: number;
  half: "Top" | "Bottom";
};
export function validScoreboard(value: unknown): value is GameScoreboard {
  if (!value || typeof value !== "object") return false;
  const v = value as GameScoreboard;
  return (
    Number.isInteger(v.teamRuns) &&
    v.teamRuns >= 0 &&
    v.teamRuns <= 999 &&
    Number.isInteger(v.opponentRuns) &&
    v.opponentRuns >= 0 &&
    v.opponentRuns <= 999 &&
    Number.isInteger(v.inning) &&
    v.inning >= 1 &&
    v.inning <= 99 &&
    (v.half === "Top" || v.half === "Bottom")
  );
}
export function connectedScoreboard(game: {
  team_runs?: number | null;
  opponent_runs?: number | null;
  inning?: number | null;
  inning_half?: string | null;
}): GameScoreboard | null {
  const value = {
    teamRuns: game.team_runs,
    opponentRuns: game.opponent_runs,
    inning: game.inning,
    half: game.inning_half,
  };
  return validScoreboard(value) ? value : null;
}
