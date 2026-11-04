/**
 * Glue between a confirmed save and a Roast Club popup. Pure and injectable: no React, no
 * network of its own. The outcome, the batter and the over-limit verdict all come from the
 * SERVER's reloaded snapshot, never from what the client submitted. Any doubt says nothing.
 */
import { OUTCOMES, type Outcome } from "./scoring.ts";
import { consentMap, type RoastClubState } from "./roast-club-consent.ts";
import { roastCategory, type createRoastPlanner, type RoastDecision } from "./roast-club.ts";

export type SnapshotRow = { id: string; playerId: string; outcome: string; official: string; voided?: boolean };
export type SnapshotGame = { game: { id: string }; evaluation: { rows: readonly SnapshotRow[] } };
export type ConfirmedScore = { playerId: string; outcome: Outcome; overLimitFenceHr: boolean };

/** Finds the one server-evaluated row for a play id. Ambiguous or voided results are null. */
export function confirmedScore(games: readonly SnapshotGame[], gameId: string, playId: string): ConfirmedScore | null {
  const matches = games.filter((g) => g.game.id === gameId);
  if (matches.length !== 1) return null;
  const rows = matches[0].evaluation.rows.filter((row) => row.id === playId);
  if (rows.length !== 1) return null;
  const row = rows[0];
  if (row.voided === true || row.official === "Voided") return null;
  if (!(OUTCOMES as readonly string[]).includes(row.outcome)) return null;
  return { playerId: row.playerId, outcome: row.outcome as Outcome, overLimitFenceHr: row.official === "OLHR" };
}

export type PlanInput = {
  planner: ReturnType<typeof createRoastPlanner>;
  commandId: string;
  playId: string;
  gameId: string;
  receipt: { status?: string; duplicate?: boolean };
  games: readonly SnapshotGame[];
  displayName: (playerId: string) => string | undefined;
  /** Last known consent; used only to avoid network calls for nonparticipants. */
  cachedConsent: RoastClubState | null;
  /** Authoritative read, performed immediately before any display. Null on any failure. */
  readConsent: () => Promise<RoastClubState | null>;
};

const skip = (reason: Extract<RoastDecision, { kind: "skip" }>["reason"]): RoastDecision => ({ kind: "skip", reason });

export async function planConfirmedRoast(input: PlanInput): Promise<RoastDecision> {
  const { receipt } = input;
  if (receipt.duplicate === true || receipt.status === "conflict") return skip("not-confirmed");
  const score = confirmedScore(input.games, input.gameId, input.playId);
  if (!score) return skip("not-confirmed");
  if (!roastCategory(score.outcome, score.overLimitFenceHr)) return skip("no-roast-for-outcome");
  // Cheap screen: a player not known to be opted in costs no network call and is never targeted.
  if (!input.cachedConsent?.optedInPlayerIds.includes(score.playerId)) return skip("no-consent");
  // Authoritative recheck right before display, so an opt-out is honored immediately.
  let fresh: RoastClubState | null = null;
  try {
    fresh = await input.readConsent();
  } catch {
    fresh = null;
  }
  if (!fresh) return skip("no-consent");
  return input.planner.plan({
    commandId: input.commandId,
    playerId: score.playerId,
    displayName: input.displayName(score.playerId) ?? "",
    outcome: score.outcome,
    overLimitFenceHr: score.overLimitFenceHr,
    receipt,
    settings: { enabled: true },
    consent: consentMap(fresh),
  });
}
