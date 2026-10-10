/** Checked RPC transport. Database functions own membership, revisions and totals. */
type AuthResult = { data: { user: { id: string } | null }; error: unknown };
type RpcResult = { data: unknown; error: { code?: string } | null };
export type ScoringClient = {
  auth: { getUser(): PromiseLike<AuthResult> };
  rpc(name: string, args: Record<string, unknown>): PromiseLike<RpcResult>;
};
export type ConnectedResult =
  | { status: "ok"; data: unknown }
  | {
      status:
        | "auth-required"
        | "invalid"
        | "access-denied"
        | "paused"
        | "unavailable";
    }
  | { status: "uncertain"; commandId: string }
  | { status: "uncertain"; tournamentId: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (v: unknown): v is string => typeof v === "string" && uuid.test(v);
const revision = (v: unknown) =>
  Number.isSafeInteger(v) &&
  Number(v) >= 0 &&
  Number(v) < Number.MAX_SAFE_INTEGER;
const text = (v: unknown, max: number) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
function object(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function prepare(input: unknown): {
  name: string;
  args: Record<string, unknown>;
  commandId?: string;
  tournamentId?: string;
} | null {
  if (!object(input) || !isId(input.teamId) || !isId(input.seasonId))
    return null;
  const common = { p_team: input.teamId, p_season: input.seasonId };
  let keys: string[], name: string, args: Record<string, unknown>;
  switch (input.type) {
    case "competition":
      keys = ["competitionId", "kind", "name", "fenceLimit", "guaranteedGames"];
      if (
        !isId(input.competitionId) ||
        !text(input.name, 200) ||
        !["League", "Tournament"].includes(String(input.kind)) ||
        !Number.isInteger(input.fenceLimit) ||
        Number(input.fenceLimit) < 0 ||
        Number(input.fenceLimit) > 100 ||
        (input.kind === "League"
          ? input.guaranteedGames !== null
          : input.guaranteedGames !== null &&
            input.guaranteedGames !== 2 &&
            input.guaranteedGames !== 3)
      )
        return null;
      name = "da_create_scoring_competition";
      args = {
        ...common,
        p_id: input.competitionId,
        p_kind: input.kind,
        p_name: input.name,
        p_fence_limit: input.fenceLimit,
        p_guaranteed_games: input.guaranteedGames,
      };
      break;
    case "snapshot":
      keys = ["scope"];
      if (!["League", "Tournament", "Overall"].includes(String(input.scope)))
        return null;
      name = "da_read_scoring_season";
      args = { ...common, p_scope: input.scope };
      break;
    case "audit":
      keys = ["limit", "cursorAt", "cursorKey"];
      if (
        !Number.isInteger(input.limit) ||
        Number(input.limit) < 1 ||
        Number(input.limit) > 100
      )
        return null;
      if ((input.cursorAt == null) !== (input.cursorKey == null)) return null;
      if (
        input.cursorAt != null &&
        (!text(input.cursorAt, 40) ||
          !Number.isFinite(Date.parse(String(input.cursorAt))) ||
          !text(input.cursorKey, 300))
      )
        return null;
      name = "da_read_scoring_audit";
      args = {
        ...common,
        p_limit: input.limit,
        p_cursor_at: input.cursorAt ?? null,
        p_cursor_key: input.cursorKey ?? null,
      };
      break;
    case "tournament":
      keys = ["tournamentId", "name", "guaranteedGames"];
      if (!isId(input.tournamentId) || !text(input.name, 200)) return null;
      if (
        input.guaranteedGames != null &&
        ![2, 3].includes(Number(input.guaranteedGames))
      )
        return null;
      if (
        input.guaranteedGames != null &&
        typeof input.guaranteedGames !== "number"
      )
        return null;
      name = "da_create_scoring_tournament";
      args = {
        ...common,
        p_id: input.tournamentId,
        p_name: input.name,
        ...(input.guaranteedGames != null
          ? { p_guaranteed_games: input.guaranteedGames }
          : {}),
      };
      break;
    case "start":
      keys = [
        "dayId",
        "playedOn",
        "tournamentId",
        "commandId",
        "expectedRevision",
        "tournamentRevision",
        "setup",
      ];
      if (
        !isId(input.dayId) ||
        typeof input.playedOn !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(input.playedOn)
      )
        return null;
      if (input.tournamentId !== null && !isId(input.tournamentId)) return null;
      if (
        input.tournamentRevision !== null &&
        !revision(input.tournamentRevision)
      )
        return null;
      if (!object(input.setup)) return null;
      name = "da_start_scoring_game";
      args = {
        ...common,
        p_day: input.dayId,
        p_date: input.playedOn,
        p_tournament: input.tournamentId,
        p_command: input.commandId,
        p_expected: input.expectedRevision,
        p_tournament_expected: input.tournamentRevision,
        p_setup: input.setup,
      };
      break;
    case "change":
      keys = [
        "dayId",
        "gameId",
        "commandId",
        "expectedRevision",
        "tournamentRevision",
        "change",
      ];
      if (!isId(input.dayId) || !isId(input.gameId) || !object(input.change))
        return null;
      if (
        input.tournamentRevision !== null &&
        !revision(input.tournamentRevision)
      )
        return null;
      name = "da_apply_scoring_game_change";
      args = {
        ...common,
        p_day: input.dayId,
        p_game: input.gameId,
        p_command: input.commandId,
        p_expected: input.expectedRevision,
        p_tournament_expected: input.tournamentRevision,
        p_change: input.change,
      };
      break;
    case "band":
      keys = [
        "tournamentId",
        "commandId",
        "expectedRevision",
        "playerId",
        "hasBand",
        "reason",
      ];
      if (
        !isId(input.tournamentId) ||
        !isId(input.playerId) ||
        typeof input.hasBand !== "boolean" ||
        !text(input.reason, 200)
      )
        return null;
      name = "da_correct_tournament_band";
      args = {
        ...common,
        p_tournament: input.tournamentId,
        p_command: input.commandId,
        p_expected: input.expectedRevision,
        p_player: input.playerId,
        p_has_band: input.hasBand,
        p_reason: input.reason,
      };
      break;
    default:
      return null;
  }
  const allowed = ["type", "teamId", "seasonId", ...keys];
  if (Object.keys(input).some((key) => !allowed.includes(key))) return null;
  const journalWrite = ["start", "change", "band"].includes(String(input.type));
  if (
    journalWrite &&
    (!isId(input.commandId) || !revision(input.expectedRevision))
  )
    return null;
  try {
    if (new TextEncoder().encode(JSON.stringify(input)).length > 32768)
      return null;
  } catch {
    return null;
  }
  return {
    name,
    args,
    ...(journalWrite ? { commandId: input.commandId as string } : {}),
    ...(["tournament", "competition"].includes(String(input.type))
      ? { tournamentId: (input.tournamentId ?? input.competitionId) as string }
      : {}),
  };
}
function uncertain(
  request: NonNullable<ReturnType<typeof prepare>>,
): ConnectedResult {
  if (request.commandId)
    return { status: "uncertain", commandId: request.commandId };
  if (request.tournamentId)
    return { status: "uncertain", tournamentId: request.tournamentId };
  return { status: "unavailable" };
}
export async function connectedScoring(
  client: ScoringClient,
  input: unknown,
): Promise<ConnectedResult> {
  const request = prepare(input);
  if (!request) return { status: "invalid" };
  try {
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) return { status: "auth-required" };
  } catch {
    return { status: "unavailable" };
  }
  try {
    const result = await client.rpc(request.name, request.args);
    if (result.error) {
      if (result.error.code === "42501") return { status: "access-denied" };
      if (result.error.code === "55000") return { status: "paused" };
      if (
        ["22023", "22P02", "22007", "22008", "23514"].includes(
          result.error.code ?? "",
        )
      )
        return { status: "invalid" };
      // Transport failures may occur after a commit: retain the original ID.
      return uncertain(request);
    }
    if (result.data === null || result.data === undefined)
      return uncertain(request);
    return { status: "ok", data: result.data };
  } catch {
    return uncertain(request);
  }
}
