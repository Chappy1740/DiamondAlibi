import {
  evaluateGame,
  emptyTotals,
  OUTCOMES,
  validateRules,
  type Game,
  type Totals,
  type Scope,
} from "./scoring.ts";

/** Local domain model. Storage/session authorization belongs to the server. */
export type SeasonGame = {
  dayId: string;
  game: Game;
  tournamentId?: string;
  /** Explicit league-game settings; tournament designations never leak here. */
  leagueBands?: string[];
};
export type TournamentBand = {
  tournamentId: string;
  playerId: string;
  firstGameId: string;
  hasBand: boolean;
};
export type SeasonScoring = {
  teamId: string;
  seasonId: string;
  games: SeasonGame[];
  bands: TournamentBand[];
  audit: (
    | {
        kind: "band";
        tournamentId: string;
        playerId: string;
        before: boolean;
        after: boolean;
        reason: string;
      }
    | {
        kind: "game";
        gameId: string;
        before: Game;
        after: Game;
        reason: string;
      }
  )[];
};
function requireValue(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function validateGame(game: Game) {
  validateRules(game.rules);
  requireValue(
    game.kind === "League" || game.kind === "Tournament",
    "Choose League or Tournament.",
  );
  requireValue(
    new Set(game.plays.map((play) => play.id)).size === game.plays.length,
    "Play IDs must be unique.",
  );
  for (const play of game.plays) {
    requireValue(
      game.lineup.includes(play.playerId) && OUTCOMES.includes(play.outcome),
      "Choose a lineup player and recognized outcome.",
    );
    requireValue(
      typeof play.voided === "boolean" &&
        Number.isInteger(play.runs) &&
        play.runs >= 0 &&
        play.runs <= 4 &&
        Number.isInteger(play.rbi) &&
        play.rbi >= 0 &&
        play.rbi <= play.runs,
      "Play counts or void status are invalid.",
    );
    requireValue(
      !["Fence HR", "ITP HR"].includes(play.outcome) || play.runs >= 1,
      "A home run must score a run.",
    );
  }
}
export function createSeasonScoring(
  teamId: string,
  seasonId: string,
): SeasonScoring {
  requireValue(
    teamId.trim() && seasonId.trim(),
    "Team and season are required.",
  );
  return { teamId, seasonId, games: [], bands: [], audit: [] };
}
export function addSeasonGame(
  current: SeasonScoring,
  entry: SeasonGame,
  firstGameBands: Record<string, boolean> = {},
): SeasonScoring {
  validateGame(entry.game);
  requireValue(
    !current.games.some(({ game }) => game.id === entry.game.id),
    "Game already exists.",
  );
  requireValue(entry.dayId.trim(), "Game day is required.");
  requireValue(
    entry.game.lineup.length &&
      new Set(entry.game.lineup).size === entry.game.lineup.length,
    "Unique lineup is required.",
  );
  requireValue(
    entry.game.plays.every((play) => entry.game.lineup.includes(play.playerId)),
    "Play player must belong to the game lineup.",
  );
  const next = structuredClone(current);
  if (entry.game.kind === "Tournament") {
    const tournamentId = entry.tournamentId;
    requireValue(
      typeof tournamentId === "string" &&
        tournamentId.trim() &&
        entry.leagueBands === undefined,
      "Tournament identity is required; league Bands do not apply.",
    );
    const newcomers = entry.game.lineup.filter(
      (playerId) =>
        !current.bands.some(
          (band) =>
            band.tournamentId === entry.tournamentId &&
            band.playerId === playerId,
        ),
    );
    requireValue(
      Object.keys(firstGameBands).length === newcomers.length &&
        newcomers.every(
          (playerId) =>
            Object.hasOwn(firstGameBands, playerId) &&
            typeof firstGameBands[playerId] === "boolean",
        ),
      "Choose Band or no Band for each player at their first tournament game; existing assignments stay fixed.",
    );
    for (const playerId of newcomers)
      next.bands.push({
        tournamentId,
        playerId,
        firstGameId: entry.game.id,
        hasBand: firstGameBands[playerId],
      });
  } else {
    requireValue(
      !entry.tournamentId && Object.keys(firstGameBands).length === 0,
      "League games cannot change tournament Bands.",
    );
    requireValue(
      Array.isArray(entry.leagueBands) &&
        new Set(entry.leagueBands).size === entry.leagueBands.length &&
        entry.leagueBands.every((id) => entry.game.lineup.includes(id)),
      "Choose explicit league-game Bands, including none.",
    );
  }
  next.games.push(structuredClone(entry));
  return next;
}
export function correctTournamentBand(
  current: SeasonScoring,
  tournamentId: string,
  playerId: string,
  hasBand: boolean,
  reason: string,
): SeasonScoring {
  requireValue(
    typeof hasBand === "boolean" &&
      reason.trim().length > 0 &&
      reason.length <= 200,
    "A Band correction needs an explicit value and reason.",
  );
  const next = structuredClone(current);
  const band = next.bands.find(
    (item) => item.tournamentId === tournamentId && item.playerId === playerId,
  );
  requireValue(band, "Tournament assignment does not exist.");
  next.audit.push({
    kind: "band",
    tournamentId,
    playerId,
    before: band.hasBand,
    after: hasBand,
    reason,
  });
  band.hasBand = hasBand;
  return next;
}
export function correctSeasonGame(
  current: SeasonScoring,
  game: Game,
  reason: string,
): SeasonScoring {
  validateGame(game);
  requireValue(
    reason.trim().length > 0 && reason.length <= 200,
    "A game correction needs a reason.",
  );
  const next = structuredClone(current);
  const entry = next.games.find((item) => item.game.id === game.id);
  requireValue(
    entry &&
      entry.game.kind === game.kind &&
      JSON.stringify(entry.game.rules) === JSON.stringify(game.rules),
    "Corrections preserve game classification and original rules.",
  );
  requireValue(
    JSON.stringify(entry.game.lineup) === JSON.stringify(game.lineup),
    "Roster changes require separate assignment handling.",
  );
  next.audit.push({
    kind: "game",
    gameId: game.id,
    before: structuredClone(entry.game),
    after: structuredClone(game),
    reason,
  });
  entry.game = structuredClone(game);
  return next;
}
export function seasonTotals(
  season: SeasonScoring,
  scope: Scope = "Overall",
): Record<string, Totals> {
  const totals: Record<string, Totals> = Object.create(null);
  for (const entry of season.games) {
    if (scope !== "Overall" && entry.game.kind !== scope) continue;
    const bands =
      entry.game.kind === "Tournament"
        ? season.bands
            .filter(
              (band) =>
                band.tournamentId === entry.tournamentId && band.hasBand,
            )
            .map((band) => band.playerId)
        : entry.leagueBands!;
    for (const [playerId, result] of Object.entries(
      evaluateGame(entry.game, bands).totals,
    )) {
      const total = (totals[playerId] ??= emptyTotals());
      for (const key of Object.keys(result) as (keyof Totals)[])
        total[key] += result[key];
    }
  }
  return totals;
}
/** Board always combines league and tournament for this team and season. */
export function seasonBeverageBoard(
  season: SeasonScoring,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(seasonTotals(season)).map(([id, totals]) => [
      id,
      totals.board,
    ]),
  );
}
