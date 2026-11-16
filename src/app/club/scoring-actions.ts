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
    const snapshot = result.data as ScorebookView;
    const games = new Set(snapshot.games.map((g) => g.game.id));
    // Ask only for this season's games; the row count must not grow with every season.
    // shortcut: IDs travel in the URL, so past 150 games (or with none yet) read the whole team as before; move the filter into the database if a season gets that big.
    const gameIds = games.size > 0 && games.size <= 150 ? [...games] : null;
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
        ...(["scoring_game_players", "scoring_bands"] as const).map((table) =>
          scoringMetadataPages((start, end) => {
            const rows = client
              .from(table)
              .select("game_id,player_id")
              .eq("team_id", teamId);
            return (gameIds ? rows.in("game_id", gameIds) : rows)
              .order("game_id")
              .order("player_id")
              .range(start, end);
          }),
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
