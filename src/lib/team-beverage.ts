import { DEFAULT_BOARD, type Rules } from "./scoring.ts";
import type { ScoringClient } from "./connected-scoring.ts";
export type BeverageState = {
  teamId: string;
  revision: number;
  finalized: boolean;
  rules: Rules["board"] | null;
  canToggle: boolean;
  participating: boolean;
  management?: {
    canEdit: boolean;
    lockedBy: string | null;
    lockedAt: string | null;
  };
};
export type BeverageRequest =
  | { type: "read"; teamId: string }
  | {
      type: "change";
      teamId: string;
      commandId: string;
      expectedRevision: number;
      change:
        | { type: "participation"; participating: boolean }
        | { type: "finalize" | "replace"; rules: Rules["board"] };
    };
export type BeverageResult =
  | { status: "ok"; data: BeverageState }
  | { status: "accepted"; duplicate: boolean }
  | {
      status:
        | "conflict"
        | "unavailable"
        | "auth-required"
        | "access-denied"
        | "invalid"
        | "paused"
        | "unsupported";
    }
  | { status: "uncertain"; commandId: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function fields(v: Record<string, unknown>, keys: string[]) {
  return (
    Object.keys(v).length === keys.length &&
    keys.every((k) => Object.hasOwn(v, k))
  );
}
function validRules(v: unknown): v is Rules["board"] {
  return (
    object(v) &&
    fields(v, Object.keys(DEFAULT_BOARD)) &&
    Object.values(v).every(
      (n) => typeof n === "number" && Number.isInteger(n) && Math.abs(n) <= 100,
    )
  );
}
function state(v: unknown, team: string): v is BeverageState {
  return (
    object(v) &&
    v.teamId === team &&
    Number.isSafeInteger(v.revision) &&
    Number(v.revision) >= 0 &&
    Number(v.revision) < Number.MAX_SAFE_INTEGER &&
    typeof v.finalized === "boolean" &&
    typeof v.canToggle === "boolean" &&
    typeof v.participating === "boolean" &&
    (v.management === undefined ||
      (object(v.management) &&
        fields(v.management, ["canEdit", "lockedBy", "lockedAt"]) &&
        typeof v.management.canEdit === "boolean" &&
        (v.finalized
          ? typeof v.management.lockedBy === "string" &&
            v.management.lockedBy.length > 0 &&
            v.management.lockedBy.length <= 40 &&
            typeof v.management.lockedAt === "string" &&
            /^\d{4}-\d{2}-\d{2}T/.test(v.management.lockedAt) &&
            Number.isFinite(Date.parse(v.management.lockedAt))
          : v.management.lockedBy === null &&
            v.management.lockedAt === null))) &&
    (v.finalized ? validRules(v.rules) : v.rules === null)
  );
}
/** Own session and checked RPC responses. No submitted actor, player, date or balance. */
export async function teamBeverage(
  client: ScoringClient,
  input: unknown,
): Promise<BeverageResult> {
  if (
    !object(input) ||
    typeof input.teamId !== "string" ||
    !uuid.test(input.teamId)
  )
    return { status: "invalid" };
  let change: Record<string, unknown> | undefined;
  if (input.type === "read") {
    if (!fields(input, ["type", "teamId"])) return { status: "invalid" };
  } else if (input.type === "change") {
    if (
      !fields(input, [
        "type",
        "teamId",
        "commandId",
        "expectedRevision",
        "change",
      ]) ||
      typeof input.commandId !== "string" ||
      !uuid.test(input.commandId) ||
      !Number.isSafeInteger(input.expectedRevision) ||
      Number(input.expectedRevision) < 0 ||
      Number(input.expectedRevision) >= Number.MAX_SAFE_INTEGER - 1 ||
      !object(input.change)
    )
      return { status: "invalid" };
    change = input.change;
    if (
      change.type === "participation"
        ? !fields(change, ["type", "participating"]) ||
          typeof change.participating !== "boolean"
        : change.type === "finalize" || change.type === "replace"
          ? !fields(change, ["type", "rules"]) || !validRules(change.rules)
          : true
    )
      return { status: "invalid" };
  } else return { status: "invalid" };
  try {
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) return { status: "auth-required" };
    const result = await client.rpc(
      change ? "da_change_team_beverage" : "da_read_team_beverage",
      change
        ? {
            p_team: input.teamId,
            p_command: input.commandId,
            p_expected: input.expectedRevision,
            p_change: change,
          }
        : { p_team: input.teamId },
    );
    if (result.error) {
      const code = result.error.code;
      if (code === "PGRST202" || code === "42883")
        return { status: "unsupported" };
      if (code === "42501") return { status: "access-denied" };
      if (code === "22023") return { status: "invalid" };
      if (code === "55000") return { status: "paused" };
      return change
        ? { status: "uncertain", commandId: input.commandId as string }
        : { status: "unavailable" };
    }
    if (!change)
      return state(result.data, input.teamId)
        ? { status: "ok", data: result.data }
        : { status: "unavailable" };
    if (object(result.data) && result.data.status === "conflict")
      return { status: "conflict" };
    if (
      object(result.data) &&
      result.data.status === "accepted" &&
      typeof result.data.duplicate === "boolean"
    )
      return { status: "accepted", duplicate: result.data.duplicate };
    return { status: "uncertain", commandId: input.commandId as string };
  } catch {
    return change
      ? { status: "uncertain", commandId: input.commandId as string }
      : { status: "unavailable" };
  }
}
