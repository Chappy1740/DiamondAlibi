import { applyCommand, type Command, type Scorebook } from "./scoring.ts";

/** Local preparation only: no HTTP route, database write or browser integration. */
export type ScoringContext = {
  teamId: string;
  seasonId: string;
  dayId: string;
};
export type ScoringSubmission = ScoringContext & {
  commandId: string;
  expectedRevision: number;
  command: Command;
};
export type ScoringResult =
  | { status: "accepted"; book: Scorebook; duplicate: boolean }
  | { status: "conflict"; revision: number }
  | { status: "forbidden" }
  | { status: "invalid"; message: string };

export interface ScoringTransaction {
  /** Must check current membership and all context relationships while locked. */
  canScore(userId: string): Promise<boolean>;
  read(): Promise<Scorebook>;
  write(book: Scorebook): Promise<void>;
}
export interface ScoringStore {
  /** Adapter must lock the game day and commit/rollback the entire callback. */
  transaction<T>(
    context: ScoringContext,
    work: (transaction: ScoringTransaction) => Promise<T>,
  ): Promise<T>;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Provide a scoring request object.");
  return value as Record<string, unknown>;
}
function identifier(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 200)
    throw new Error("Provide valid context and command identifiers.");
  return value;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

const commandFields: Record<Command["type"], readonly string[]> = {
  start: ["type", "gameId", "opponent", "kind", "lineup"],
  score: ["type", "gameId", "playId", "playerId", "outcome", "runs", "rbi"],
  correct: [
    "type",
    "gameId",
    "playId",
    "playerId",
    "outcome",
    "runs",
    "rbi",
    "voided",
    "reason",
  ],
  lineup: ["type", "gameId", "lineup"],
  batter: ["type", "gameId", "playerId"],
  complete: ["type", "gameId"],
  rules: ["type", "rules"],
  bands: ["type", "players", "reason"],
};

function parseSubmission(value: unknown): ScoringSubmission {
  const raw = object(value);
  const allowed = [
    "teamId",
    "seasonId",
    "dayId",
    "commandId",
    "expectedRevision",
    "command",
  ];
  if (Object.keys(raw).some((key) => !allowed.includes(key)))
    throw new Error(
      "Client actor, timestamp and additional request fields are not accepted.",
    );
  if (
    !Number.isSafeInteger(raw.expectedRevision) ||
    (raw.expectedRevision as number) < 0
  )
    throw new Error("Expected revision must be a nonnegative safe integer.");
  const encoded = JSON.stringify(raw.command);
  if (!encoded || encoded.length > 32768)
    throw new Error("Scoring command exceeds the request limit.");
  const command = object(JSON.parse(encoded));
  const fields = Object.hasOwn(commandFields, String(command.type))
    ? commandFields[command.type as Command["type"]]
    : undefined;
  if (!fields || Object.keys(command).some((key) => !fields.includes(key)))
    throw new Error("Unrecognized scoring command or command fields.");
  const optional =
    command.type === "correct"
      ? ["playerId"]
      : command.type === "bands"
        ? ["reason"]
        : [];
  if (
    fields.some(
      (key) => !optional.includes(key) && !Object.hasOwn(command, key),
    )
  )
    throw new Error("Scoring command is missing required fields.");
  if (command.type === "correct" && typeof command.voided !== "boolean")
    throw new Error(
      "Correction must explicitly identify whether the play is voided.",
    );
  return {
    teamId: identifier(raw.teamId),
    seasonId: identifier(raw.seasonId),
    dayId: identifier(raw.dayId),
    commandId: identifier(raw.commandId),
    expectedRevision: raw.expectedRevision as number,
    command: canonical(command) as Command,
  };
}

export async function submitScoringCommand(
  input: unknown,
  dependencies: {
    /** Server session verification only; never a submitted actor/user ID. */
    authenticatedUser: () => Promise<string | null>;
    store: ScoringStore;
    now: () => string;
  },
): Promise<ScoringResult> {
  const userId = await dependencies.authenticatedUser();
  if (!userId) return { status: "forbidden" };
  let request: ScoringSubmission;
  try {
    request = parseSubmission(input);
  } catch (error) {
    return {
      status: "invalid",
      message: error instanceof Error ? error.message : "Invalid request.",
    };
  }
  const context = {
    teamId: request.teamId,
    seasonId: request.seasonId,
    dayId: request.dayId,
  };
  return dependencies.store.transaction(context, async (transaction) => {
    if (!(await transaction.canScore(userId))) return { status: "forbidden" };
    const book = await transaction.read();
    if (
      book.teamId !== request.teamId ||
      book.seasonId !== request.seasonId ||
      book.dayId !== request.dayId
    )
      return { status: "forbidden" };
    const prior = book.audit.find(
      (item) => item.commandId === request.commandId,
    );
    if (!prior && book.revision !== request.expectedRevision)
      return { status: "conflict", revision: book.revision };
    let next: Scorebook;
    try {
      next = applyCommand(book, {
        commandId: request.commandId,
        expectedRevision: request.expectedRevision,
        actor: userId,
        at: dependencies.now(),
        command: request.command,
      });
    } catch {
      return {
        status: "invalid",
        message: "Invalid scoring change or reused command identifier.",
      };
    }
    // Persistence failures propagate: never report success before the commit.
    if (!prior) await transaction.write(next);
    return { status: "accepted", book: next, duplicate: !!prior };
  });
}
