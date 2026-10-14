// The read RPC keeps its season-wide, authorized pagination. Game details show
// only that game's events and the shared Band corrections that affect it.
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
export function gameAudit(entries: unknown[], gameId: string, tournamentId: string | null): unknown[] {
  return entries.filter(raw => {
    const entry = object(raw);
    if (!entry) return false;
    if (tournamentId && entry.action === "band" && entry.tournamentId === tournamentId) return true;
    return [entry.before, entry.after].some(rawState => {
      const state = object(rawState);
      return state?.gameId === gameId || object(state?.game)?.id === gameId;
    });
  });
}
