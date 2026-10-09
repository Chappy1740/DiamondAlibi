import {
  applySeasonCommand,
  parseSeasonCommand,
  type SeasonCommand,
  type SeasonScorebook,
} from "./season-scorebook.ts";

export type SeasonSubmission = {
  teamId: string;
  commandId: string;
  expectedRevision: number;
  command: SeasonCommand;
};
export type SeasonResult =
  | { status: "accepted"; book: SeasonScorebook; duplicate: boolean }
  | { status: "conflict"; revision: number }
  | { status: "forbidden" }
  | { status: "invalid"; message: string };
export interface SeasonTransaction {
  /** Verify current membership, requested season/context and archive policy under the same lock. */
  canScore(userId: string, command: SeasonCommand): Promise<boolean>;
  read(): Promise<SeasonScorebook>;
  write(book: SeasonScorebook): Promise<void>;
}
export interface SeasonStore {
  /** Lock team scoring revision plus membership/season state; commit before resolving. */
  transaction<T>(
    teamId: string,
    work: (transaction: SeasonTransaction) => Promise<T>,
  ): Promise<T>;
}
function parse(input: unknown): SeasonSubmission {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Provide a season scoring request.");
  const r = input as Record<string, unknown>;
  const allowed = ["teamId", "commandId", "expectedRevision", "command"];
  if (
    Object.keys(r).some((k) => !allowed.includes(k)) ||
    allowed.some((k) => !Object.hasOwn(r, k))
  )
    throw new Error(
      "Client actor, time, totals and additional fields are not accepted.",
    );
  for (const key of ["teamId", "commandId"])
    if (
      typeof r[key] !== "string" ||
      !(r[key] as string).trim() ||
      (r[key] as string).length > 200
    )
      throw new Error("Provide valid team and command identifiers.");
  if (
    !Number.isSafeInteger(r.expectedRevision) ||
    (r.expectedRevision as number) < 0
  )
    throw new Error("Expected revision must be a nonnegative safe integer.");
  return {
    teamId: r.teamId as string,
    commandId: r.commandId as string,
    expectedRevision: r.expectedRevision as number,
    command: parseSeasonCommand(r.command),
  };
}
/** Local server-boundary preparation; no route, live adapter or privileged key. */
export async function submitSeasonScoring(
  input: unknown,
  deps: {
    authenticatedUser: () => Promise<string | null>;
    now: () => string;
    store: SeasonStore;
  },
): Promise<SeasonResult> {
  const actor = await deps.authenticatedUser();
  if (!actor) return { status: "forbidden" };
  let request: SeasonSubmission;
  try {
    request = parse(input);
  } catch (e) {
    return {
      status: "invalid",
      message: e instanceof Error ? e.message : "Invalid request.",
    };
  }
  return deps.store.transaction(request.teamId, async (tx) => {
    if (!(await tx.canScore(actor, request.command)))
      return { status: "forbidden" };
    const book = await tx.read();
    if (book.teamId !== request.teamId) return { status: "forbidden" };
    const duplicate = book.audit.some((a) => a.commandId === request.commandId);
    if (!duplicate && book.revision !== request.expectedRevision)
      return { status: "conflict", revision: book.revision };
    let next: SeasonScorebook;
    try {
      next = applySeasonCommand(book, { ...request, actor, at: deps.now() });
    } catch {
      return {
        status: "invalid",
        message: "Invalid scoring change or reused command identifier.",
      };
    }
    if (!duplicate) await tx.write(next);
    return { status: "accepted", book: next, duplicate };
  });
}
