import { rates } from "./scoring.ts";
import type { LoadedScorebook } from "./scorebook-view.ts";

/** Read-only projection of a server-authorized snapshot; never grants access. */
export function personalDashboard(
  loaded: LoadedScorebook,
  context: { userId: string; teamId: string; seasonId: string },
) {
  const snapshot = loaded.snapshot;
  if (
    snapshot.teamId !== context.teamId ||
    snapshot.seasonId !== context.seasonId
  ) return null;

  // Never match accounts by display name, or silently claim guest history.
  const matches = loaded.roster.filter(
    (player) => player.user_id === context.userId && !player.is_guest,
  );
  const player = matches.length === 1 ? matches[0] : null;
  const totals = player ? snapshot.totals[player.id] ?? null : null;
  const calculated = totals ? rates(totals) : null;
  const liveGames = snapshot.games
    .filter(({ game }) => !game.completed)
    .map(({ game, lineup, playedOn }) => {
      const batterId = lineup[game.next_batter_position];
      const batter = loaded.roster.find((p) => p.id === batterId);
      return {
        id: game.id,
        opponent: game.opponent,
        kind: game.kind,
        playedOn,
        currentBatter: batter?.display_name ?? null,
        participating: player ? lineup.includes(player.id) : false,
      };
    })
    .sort((a, b) => a.playedOn.localeCompare(b.playedOn) || a.id.localeCompare(b.id));

  return {
    teamId: snapshot.teamId,
    seasonId: snapshot.seasonId,
    scope: snapshot.scope,
    archived: loaded.archived,
    player: player ? { id: player.id, name: player.display_name } : null,
    statistics: totals && calculated ? {
      PA: totals.PA, H: totals.H, HR: totals.HR, RBI: totals.RBI,
      OBP: calculated.OBP, Reach: calculated.Reach,
    } : null,
    // Board is season-wide even when statistics are League or Tournament.
    beverageBalance: player ? snapshot.board[player.id] ?? null : null,
    liveGames,
  };
}
