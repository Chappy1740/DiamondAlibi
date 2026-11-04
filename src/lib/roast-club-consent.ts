import type { ScoringClient } from "./connected-scoring.ts";

/**
 * Roast Club consent client. Uses the caller's own session; the database decides who the
 * caller is, which player is theirs and whether they are still on the team. No player id,
 * actor id or other identity is ever submitted. Every uncertainty fails closed.
 */
export type RoastClubState = {
  teamId: string;
  /** True only for an account-linked, non-guest player on the team. */
  canToggle: boolean;
  /** The caller's own current choice. */
  optedIn: boolean;
  /** Players whose opt-in is currently effective (active members only). */
  optedInPlayerIds: string[];
};
export type RoastClubRequest =
  | { type: "read"; teamId: string }
  | { type: "change"; teamId: string; commandId: string; optedIn: boolean };
export type RoastClubResult =
  | { status: "ok"; data: RoastClubState }
  | { status: "accepted"; duplicate: boolean; optedIn: boolean }
  | {
      status:
        | "unavailable"
        | "auth-required"
        | "access-denied"
        | "invalid"
        | "unsupported";
    }
  | { status: "uncertain"; commandId: string };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const exactly = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));

function validState(v: unknown, team: string): v is RoastClubState {
  return (
    object(v) &&
    v.teamId === team &&
    typeof v.canToggle === "boolean" &&
    typeof v.optedIn === "boolean" &&
    Array.isArray(v.optedInPlayerIds) &&
    v.optedInPlayerIds.length <= 2000 &&
    v.optedInPlayerIds.every((p) => typeof p === "string" && uuid.test(p)) &&
    // The caller can only be opted in if they have a player to be opted in.
    (v.canToggle || !v.optedIn)
  );
}

/** Effective consent as the engine expects it: only listed players are `true`. */
export function consentMap(state: RoastClubState | null | undefined): ReadonlyMap<string, boolean> {
  return new Map((state?.optedInPlayerIds ?? []).map((id) => [id, true] as const));
}

export async function roastClubConsent(client: ScoringClient, input: unknown): Promise<RoastClubResult> {
  if (!object(input) || typeof input.teamId !== "string" || !uuid.test(input.teamId))
    return { status: "invalid" };
  const change = input.type === "change";
  if (input.type === "read") {
    if (!exactly(input, ["type", "teamId"])) return { status: "invalid" };
  } else if (change) {
    if (
      !exactly(input, ["type", "teamId", "commandId", "optedIn"]) ||
      typeof input.commandId !== "string" ||
      !uuid.test(input.commandId) ||
      typeof input.optedIn !== "boolean"
    )
      return { status: "invalid" };
  } else return { status: "invalid" };
  const commandId = input.commandId as string;
  const uncertain = (): RoastClubResult =>
    change ? { status: "uncertain", commandId } : { status: "unavailable" };
  try {
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) return { status: "auth-required" };
    const result = await client.rpc(
      change ? "da_change_roast_club" : "da_read_roast_club",
      change
        ? { p_team: input.teamId, p_command: commandId, p_opted_in: input.optedIn }
        : { p_team: input.teamId },
    );
    if (result.error) {
      const code = result.error.code;
      if (code === "PGRST202" || code === "42883") return { status: "unsupported" };
      if (code === "42501") return { status: "access-denied" };
      if (code === "22023") return { status: "invalid" };
      return uncertain();
    }
    if (!change)
      return validState(result.data, input.teamId)
        ? { status: "ok", data: result.data }
        : { status: "unavailable" };
    const data = result.data;
    if (
      object(data) &&
      data.status === "accepted" &&
      typeof data.duplicate === "boolean" &&
      data.optedIn === input.optedIn
    )
      return { status: "accepted", duplicate: data.duplicate, optedIn: input.optedIn as boolean };
    return uncertain();
  } catch {
    return uncertain();
  }
}
