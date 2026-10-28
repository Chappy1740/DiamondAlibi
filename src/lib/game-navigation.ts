/** Existing setup route; navigation never creates a game. */
export function gameSetupHref(team: string, season: string, competition: { league?: string; tournament?: string } = {}) {
  const query = new URLSearchParams({ team, season, setup: "1" });
  if (competition.tournament) query.set("tournament", competition.tournament);
  else if (competition.league) query.set("league", competition.league);
  return `/club/score?${query}`;
}

/** Accept only the local setup route in the selected context, never arbitrary redirects. */
export function safeGameSetupReturn(value: unknown, team: string, season?: string): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/club/score?")) return undefined;
  try {
    const url = new URL(value, "https://local.invalid");
    const q = url.searchParams;
    const allowed = new Set(["team", "season", "setup", "league", "tournament"]);
    if (url.origin !== "https://local.invalid" || url.pathname !== "/club/score" || url.hash ||
      q.get("team") !== team || !team || !q.get("season") || (season !== undefined && q.get("season") !== season) ||
      q.get("setup") !== "1" || (q.has("league") && q.has("tournament")) ||
      [...q.keys()].some(key => !allowed.has(key) || q.getAll(key).length !== 1)) return undefined;
    return gameSetupHref(team, q.get("season")!, { league: q.get("league") ?? undefined, tournament: q.get("tournament") ?? undefined });
  } catch { return undefined; }
}
