import {
  applyCommand,
  createScorebook,
  validateRules,
  type Audit,
  type Command,
  type Player,
  type Request,
  type Rules,
  type Scorebook,
} from "./scoring.ts";
import {
  addSeasonGame,
  correctTournamentBand,
  createSeasonScoring,
  type SeasonScoring,
} from "./season-scoring.ts";

export type TournamentSetup = {
  id: string;
  name: string;
  rules: Rules;
  guaranteedGames?: 2 | 3;
};
export type SeasonBook = {
  id: string;
  name: string;
  leagueRules: Rules;
  tournaments: TournamentSetup[];
  scoring: SeasonScoring;
};
export type SeasonScorebook = {
  format: 2;
  teamId: string;
  players: Player[];
  revision: number;
  seasons: SeasonBook[];
  audit: Audit[];
};
export type GameChange = Exclude<
  Command,
  { type: "start" | "rules" | "bands" }
>;
export type SeasonCommand =
  | { type: "season"; seasonId: string; name: string; rules: Rules }
  | {
      type: "tournament";
      seasonId: string;
      tournamentId: string;
      name: string;
      rules: Rules;
      guaranteedGames?: 2 | 3;
    }
  | { type: "rules"; seasonId: string; tournamentId?: string; rules: Rules }
  | {
      type: "start";
      seasonId: string;
      dayId: string;
      gameId: string;
      opponent: string;
      kind: "League" | "Tournament";
      tournamentId?: string;
      lineup: string[];
      rules: Rules;
      bands: Record<string, boolean>;
    }
  | {
      type: "game";
      seasonId: string;
      change: GameChange;
      firstGameBands?: Record<string, boolean>;
    }
  | {
      type: "band";
      seasonId: string;
      tournamentId: string;
      playerId: string;
      hasBand: boolean;
      reason: string;
    };
export type SeasonRequest = Omit<Request, "command"> & {
  command: SeasonCommand;
};

function requireValue(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function text(value: unknown, label: string): asserts value is string {
  requireValue(
    typeof value === "string" && value.trim() && value.length <= 200,
    `${label} is required (200 characters maximum).`,
  );
}
function record(value: unknown): Record<string, unknown> {
  requireValue(
    value && typeof value === "object" && !Array.isArray(value),
    "Provide a command object.",
  );
  return value as Record<string, unknown>;
}
function fields(
  value: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
) {
  requireValue(
    required.every((key) => Object.hasOwn(value, key)) &&
      Object.keys(value).every(
        (key) => required.includes(key) || optional.includes(key),
      ),
    "Missing or unrecognized command fields.",
  );
}
export function canonicalJSON(value: unknown): string {
  function order(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(order);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, v]) => [key, order(v)]),
      );
    return item;
  }
  return JSON.stringify(order(value));
}
function rules(value: unknown) {
  const r = record(value);
  fields(r, ["version", "fenceLimit", "board"]);
  fields(record(r.board), [
    "strikeout",
    "solo",
    "bandSolo",
    "grandSlam",
    "overLimit",
    "insidePark",
    "multiRun",
  ]);
  validateRules(r as Rules);
}
function bandChoices(value: unknown) {
  const b = record(value);
  requireValue(
    Object.entries(b).every(
      ([id, choice]) =>
        id.trim() && id.length <= 200 && typeof choice === "boolean",
    ),
    "Choose Band or no Band explicitly.",
  );
}
/** Runtime allowlist shared by local replay and the future server boundary. */
export function parseSeasonCommand(input: unknown): SeasonCommand {
  const encoded = JSON.stringify(input);
  requireValue(
    encoded && new TextEncoder().encode(encoded).length <= 32768,
    "Command exceeds the request limit.",
  );
  const c = record(JSON.parse(encoded));
  const shape: Record<string, [string[], string[]]> = {
    season: [["type", "seasonId", "name", "rules"], []],
    tournament: [
      ["type", "seasonId", "tournamentId", "name", "rules"],
      ["guaranteedGames"],
    ],
    rules: [["type", "seasonId", "rules"], ["tournamentId"]],
    start: [
      [
        "type",
        "seasonId",
        "dayId",
        "gameId",
        "opponent",
        "kind",
        "lineup",
        "rules",
        "bands",
      ],
      ["tournamentId"],
    ],
    game: [["type", "seasonId", "change"], ["firstGameBands"]],
    band: [
      ["type", "seasonId", "tournamentId", "playerId", "hasBand", "reason"],
      [],
    ],
  };
  requireValue(
    typeof c.type === "string" && Object.hasOwn(shape, c.type),
    "Unrecognized season command.",
  );
  fields(c, ...shape[c.type]);
  for (const key of [
    "seasonId",
    "tournamentId",
    "name",
    "dayId",
    "gameId",
    "opponent",
    "playerId",
    "reason",
  ])
    if (Object.hasOwn(c, key)) text(c[key], key);
  if (Object.hasOwn(c, "rules")) rules(c.rules);
  if (Object.hasOwn(c, "bands")) bandChoices(c.bands);
  if (Object.hasOwn(c, "firstGameBands")) bandChoices(c.firstGameBands);
  if (c.type === "band")
    requireValue(
      typeof c.hasBand === "boolean",
      "Band value must be explicit.",
    );
  if (c.type === "start") {
    requireValue(
      c.kind === "League" || c.kind === "Tournament",
      "Choose League or Tournament.",
    );
    requireValue(
      Array.isArray(c.lineup) &&
        c.lineup.length > 0 &&
        c.lineup.every((id) => typeof id === "string"),
      "Choose a lineup.",
    );
  }
  if (c.type === "game") {
    const change = record(c.change);
    const gameFields: Record<string, string[]> = {
      score: ["type", "gameId", "playId", "playerId", "outcome", "runs", "rbi"],
      correct: [
        "type",
        "gameId",
        "playId",
        "outcome",
        "runs",
        "rbi",
        "voided",
        "reason",
      ],
      lineup: ["type", "gameId", "lineup"],
      batter: ["type", "gameId", "playerId"],
      complete: ["type", "gameId"],
      scoreboard: [
        "type",
        "gameId",
        "teamRuns",
        "opponentRuns",
        "inning",
        "half",
        "reason",
      ],
    };
    requireValue(
      typeof change.type === "string" && Object.hasOwn(gameFields, change.type),
      "Unrecognized game change.",
    );
    fields(
      change,
      gameFields[change.type],
      change.type === "correct" ? ["playerId"] : [],
    );
    if (Object.hasOwn(c, "firstGameBands"))
      requireValue(
        change.type === "lineup",
        "New assignments belong to lineup changes only.",
      );
  }
  return c as SeasonCommand;
}
export function createSeasonScorebook(
  teamId: string,
  players: Player[],
): SeasonScorebook {
  // Reuse the established roster validation without inventing a game limit.
  text(teamId, "Team");
  requireValue(
    Array.isArray(players) &&
      players.length > 0 &&
      new Set(players.map((p) => p.id)).size === players.length,
    "Provide a unique roster.",
  );
  players.forEach((p) => {
    text(p.id, "Player ID");
    text(p.name, "Player name");
  });
  return {
    format: 2,
    teamId,
    players: structuredClone(players),
    revision: 0,
    seasons: [],
    audit: [],
  };
}
export function bandsForGame(season: SeasonBook, gameId: string): string[] {
  const entry = season.scoring.games.find((e) => e.game.id === gameId);
  requireValue(entry, "Game was not found.");
  return entry.game.kind === "League"
    ? [...entry.leagueBands!]
    : season.scoring.bands
        .filter((b) => b.tournamentId === entry.tournamentId && b.hasBand)
        .map((b) => b.playerId);
}
function assignNewPlayers(
  season: SeasonBook,
  tournamentId: string,
  gameId: string,
  lineup: string[],
  choices: Record<string, boolean>,
) {
  const newcomers = lineup.filter(
    (id) =>
      !season.scoring.bands.some(
        (b) => b.tournamentId === tournamentId && b.playerId === id,
      ),
  );
  requireValue(
    Object.keys(choices).length === newcomers.length &&
      newcomers.every((id) => Object.hasOwn(choices, id)),
    "Choose Band or no Band for each player at their first tournament game; existing assignments stay fixed.",
  );
  for (const playerId of newcomers)
    season.scoring.bands.push({
      tournamentId,
      playerId,
      firstGameId: gameId,
      hasBand: choices[playerId],
    });
}
/** Team journal revision serializes local changes across seasons and tournament dates. */
export function applySeasonCommand(
  current: SeasonScorebook,
  request: SeasonRequest,
): SeasonScorebook {
  text(request.commandId, "Command ID");
  text(request.actor, "Actor");
  text(request.at, "Timestamp");
  requireValue(
    Number.isFinite(Date.parse(request.at)),
    "Use a valid timestamp.",
  );
  requireValue(
    Number.isSafeInteger(request.expectedRevision) &&
      request.expectedRevision >= 0,
    "Expected revision must be a nonnegative safe integer.",
  );
  const cmd = parseSeasonCommand(request.command);
  const fingerprint = canonicalJSON({ actor: request.actor, command: cmd });
  const prior = current.audit.find((a) => a.commandId === request.commandId);
  if (prior) {
    requireValue(
      prior.fingerprint === fingerprint,
      "This command ID was already used for a different change.",
    );
    return current;
  }
  requireValue(
    current.revision === request.expectedRevision,
    "This season scorebook changed. Reload before trying again.",
  );
  requireValue(
    current.revision < Number.MAX_SAFE_INTEGER,
    "Revision limit reached.",
  );
  const next = structuredClone(current);
  if (cmd.type === "season") {
    requireValue(
      !next.seasons.some((s) => s.id === cmd.seasonId),
      "Season already exists.",
    );
    next.seasons.push({
      id: cmd.seasonId,
      name: cmd.name.trim(),
      leagueRules: structuredClone(cmd.rules),
      tournaments: [],
      scoring: createSeasonScoring(next.teamId, cmd.seasonId),
    });
  } else {
    const season = next.seasons.find((s) => s.id === cmd.seasonId);
    requireValue(season, "Season was not found.");
    if (cmd.type === "tournament") {
      requireValue(
        cmd.guaranteedGames === undefined ||
          cmd.guaranteedGames === 2 ||
          cmd.guaranteedGames === 3,
        "Choose 2-game or 3-game guaranteed.",
      );
      requireValue(
        !season.tournaments.some((t) => t.id === cmd.tournamentId),
        "Tournament already exists.",
      );
      season.tournaments.push({
        id: cmd.tournamentId,
        name: cmd.name.trim(),
        rules: structuredClone(cmd.rules),
        ...(cmd.guaranteedGames !== undefined
          ? { guaranteedGames: cmd.guaranteedGames }
          : {}),
      });
    } else if (cmd.type === "rules") {
      if (cmd.tournamentId) {
        const t = season.tournaments.find((t) => t.id === cmd.tournamentId);
        requireValue(t, "Tournament was not found.");
        t.rules = structuredClone(cmd.rules);
      } else season.leagueRules = structuredClone(cmd.rules);
    } else if (cmd.type === "band") {
      season.scoring = correctTournamentBand(
        season.scoring,
        cmd.tournamentId,
        cmd.playerId,
        cmd.hasBand,
        cmd.reason,
      );
    } else if (cmd.type === "start") {
      requireValue(
        !next.seasons.some((s) =>
          s.scoring.games.some((e) => e.game.id === cmd.gameId),
        ),
        "Game already exists.",
      );
      requireValue(
        cmd.kind === "Tournament"
          ? season.tournaments.some((t) => t.id === cmd.tournamentId)
          : !cmd.tournamentId,
        "Choose the matching tournament or league context.",
      );
      const temp = createScorebook({
        teamId: next.teamId,
        seasonId: season.id,
        dayId: cmd.dayId,
        players: next.players,
        bands: [],
        rules: cmd.rules,
      });
      const started = applyCommand(temp, {
        ...request,
        expectedRevision: 0,
        command: {
          type: "start",
          gameId: cmd.gameId,
          opponent: cmd.opponent,
          kind: cmd.kind,
          lineup: cmd.lineup,
        },
      });
      if (cmd.kind === "League")
        requireValue(
          Object.keys(cmd.bands).length === cmd.lineup.length &&
            cmd.lineup.every((id) => Object.hasOwn(cmd.bands, id)),
          "Choose explicit league-game Bands, including none.",
        );
      if (cmd.kind === "Tournament")
        started.games[0].tournamentGameNumber =
          season.scoring.games.filter(
            (g) => g.tournamentId === cmd.tournamentId,
          ).length + 1;
      season.scoring = addSeasonGame(
        season.scoring,
        {
          dayId: cmd.dayId,
          game: started.games[0],
          ...(cmd.kind === "Tournament"
            ? { tournamentId: cmd.tournamentId }
            : {
                leagueBands: Object.entries(cmd.bands)
                  .filter(([, has]) => has)
                  .map(([id]) => id),
              }),
        },
        cmd.kind === "Tournament" ? cmd.bands : {},
      );
    } else {
      const entry = season.scoring.games.find(
        (e) => e.game.id === cmd.change.gameId,
      );
      requireValue(entry, "Game was not found in this season.");
      if (cmd.change.type === "lineup")
        requireValue(
          Array.isArray(cmd.change.lineup) &&
            cmd.change.lineup.every((id) =>
              next.players.some((p) => p.id === id),
            ),
          "Choose a lineup from this team roster.",
        );
      if (cmd.change.type === "score")
        requireValue(
          !next.seasons.some((s) =>
            s.scoring.games.some((e) =>
              e.game.plays.some(
                (p) =>
                  p.id === ("playId" in cmd.change ? cmd.change.playId : ""),
              ),
            ),
          ),
          "Play ID already exists.",
        );
      if (cmd.change.type === "lineup" && entry.tournamentId)
        assignNewPlayers(
          season,
          entry.tournamentId,
          entry.game.id,
          cmd.change.lineup,
          cmd.firstGameBands ?? {},
        );
      else
        requireValue(
          !cmd.firstGameBands || Object.keys(cmd.firstGameBands).length === 0,
          "New tournament assignments are not applicable.",
        );
      const correctedPlayer =
        cmd.change.type === "correct" ? cmd.change.playerId : undefined;
      if (correctedPlayer && entry.tournamentId)
        requireValue(
          season.scoring.bands.some(
            (b) =>
              b.tournamentId === entry.tournamentId &&
              b.playerId === correctedPlayer,
          ),
          "Historical batter needs an existing tournament assignment; reconcile first participation before this correction.",
        );
      const temp = createScorebook({
        teamId: next.teamId,
        seasonId: season.id,
        dayId: entry.dayId,
        players: next.players,
        bands: bandsForGame(season, entry.game.id),
        rules: entry.game.rules,
      });
      temp.games = [structuredClone(entry.game)];
      entry.game = applyCommand(temp, {
        ...request,
        expectedRevision: 0,
        command: cmd.change,
      }).games[0];
    }
  }
  next.revision++;
  const reason =
    cmd.type === "band"
      ? cmd.reason
      : cmd.type === "game" &&
          (cmd.change.type === "correct" || cmd.change.type === "scoreboard")
        ? cmd.change.reason
        : undefined;
  next.audit.push({
    commandId: request.commandId,
    fingerprint,
    revision: next.revision,
    actor: request.actor,
    at: request.at,
    action: cmd.type === "game" ? cmd.change.type : cmd.type,
    ...(reason ? { reason } : {}),
  });
  return next;
}

export type SeasonJournal = {
  format: 2;
  initial: { teamId: string; players: Player[] };
  requests: SeasonRequest[];
};
export function replaySeasonJournal(journal: SeasonJournal): SeasonScorebook {
  requireValue(
    journal.format === 2 &&
      Array.isArray(journal.requests) &&
      journal.requests.length <= 1000,
    "Unrecognized saved season journal.",
  );
  let book = createSeasonScorebook(
    journal.initial.teamId,
    journal.initial.players,
  );
  for (const request of journal.requests)
    book = applySeasonCommand(book, request);
  return book;
}
/** Compatibility view for controls, never an authoritative day-wide Band state. */
export function seasonView(
  book: SeasonScorebook,
  seasonId: string,
  gameId: string,
): Scorebook | null {
  const season = book.seasons.find((s) => s.id === seasonId);
  if (!season) return null;
  return {
    format: 1,
    teamId: book.teamId,
    seasonId,
    dayId: "season-view",
    revision: book.revision,
    players: book.players,
    bands:
      gameId && season.scoring.games.some((e) => e.game.id === gameId)
        ? bandsForGame(season, gameId)
        : [],
    rules: season.leagueRules,
    games: season.scoring.games.map((e) => e.game),
    audit: book.audit,
  };
}
