"use server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  connectedScoring,
  type ConnectedResult,
} from "@/lib/connected-scoring";
import type { Scope } from "@/lib/scoring";
import { scoringMetadataPages } from "@/lib/scoring-metadata-pages";
import type { ScorebookLoadResult, ScorebookView } from "@/lib/scorebook-view";

/** The session client supplies identity; database RPCs enforce current membership. */
export async function scoringAction(input: unknown): Promise<ConnectedResult> {
  try {
    return await connectedScoring(await supabaseServer(), input);
  } catch {
    return { status: "unavailable" };
  }
}

export async function loadScorebook(
  teamId: string,
  seasonId: string,
  scope: Scope,
): Promise<ScorebookLoadResult> {
  try {
    const client = await supabaseServer();
    const result = await connectedScoring(client, {
      type: "snapshot",
      teamId,
      seasonId,
      scope,
    });
    if (result.status !== "ok")
      return {
        status:
          result.status === "auth-required" ||
          result.status === "invalid" ||
          result.status === "access-denied"
            ? result.status
            : "unavailable",
      };
    const [players, bands, season, participation, leagueBands] =
      await Promise.all([
        scoringMetadataPages((start, end) =>
          client
            .from("team_players")
            .select("id,display_name,is_guest,user_id")
            .eq("team_id", teamId)
            .order("id")
            .range(start, end),
        ),
        scoringMetadataPages((start, end) =>
          client
            .from("scoring_tournament_bands")
            .select("tournament_id,player_id,has_band")
            .eq("team_id", teamId)
            .eq("season_id", seasonId)
            .order("tournament_id")
            .order("player_id")
            .range(start, end),
        ),
        client
          .from("team_seasons")
          .select("archived")
          .eq("team_id", teamId)
          .eq("id", seasonId)
          .maybeSingle(),
        scoringMetadataPages((start, end) =>
          client
            .from("scoring_game_players")
            .select("game_id,player_id")
            .eq("team_id", teamId)
            .order("game_id")
            .order("player_id")
            .range(start, end),
        ),
        scoringMetadataPages((start, end) =>
          client
            .from("scoring_bands")
            .select("game_id,player_id")
            .eq("team_id", teamId)
            .order("game_id")
            .order("player_id")
            .range(start, end),
        ),
      ]);
    if (
      players.error ||
      bands.error ||
      season.error ||
      participation.error ||
      leagueBands.error
    )
      return { status: "unavailable" };
    if (!season.data) return { status: "access-denied" };
    // Metadata can change after the RPC snapshot. Write revisions always decide acceptance.
    const snapshot = result.data as ScorebookView;
    const games = new Set(snapshot.games.map((g) => g.game.id));
    return {
      status: "ok",
      data: {
        snapshot,
        roster: players.data,
        bands: bands.data,
        participation: participation.data.filter((p) => games.has(p.game_id)),
        leagueBands: leagueBands.data.filter((p) => games.has(p.game_id)),
        archived: season.data.archived,
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
