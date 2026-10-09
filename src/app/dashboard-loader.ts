import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { loadScorebook } from "@/app/club/scoring-actions";
import {
  createSampleSeasons,
  sampleSeasons,
  sampleScope,
  sampleRoster,
} from "@/lib/sample-seasons";
import type { DashboardProps } from "@/components/player-dashboard";
import type { Scope } from "@/lib/scoring";

export type DashboardQuery = {
  sample?: string;
  player?: string;
  team?: string;
  season?: string;
  scope?: string;
  game?: string;
  shell?: string;
};
export async function dashboardProps(
  route: string,
  query: DashboardQuery,
): Promise<DashboardProps> {
  const scope: Scope =
    query.scope === "League" || query.scope === "Tournament"
      ? query.scope
      : "Overall";
  const empty: DashboardProps = {
    route,
    sample: false,
    userId: "",
    teams: [],
    seasons: [],
    teamId: "",
    seasonId: "",
    scope,
    loaded: null,
    gameId: query.game,
  };
  const sample = (): DashboardProps => {
    const books = createSampleSeasons();
    const chosen =
      books.find((b) => b.snapshot.seasonId === query.season) ?? books[3];
    const player =
      sampleRoster.find((p) => p.user_id === query.player) ?? sampleRoster[0];
    return {
      ...empty,
      sample: true,
      userId: player.user_id,
      teams: [{ id: "sample-team", name: "Sample Northwest Alibis" }],
      seasons: [...sampleSeasons].reverse(),
      teamId: "sample-team",
      seasonId: chosen.snapshot.seasonId,
      loaded: sampleScope(chosen, scope),
    };
  };
  if (query.sample === "1") return sample();
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return sample();
  try {
    const client = await supabaseServer();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) {
      if (error && error.name !== "AuthSessionMissingError")
        return {
          ...empty,
          error:
            "Could not verify your session. Sign in through My clubhouse and retry.",
        };
      return sample();
    }
    const jar = await cookies();
    const [teams, memberships] = await Promise.all([
      client.from("teams").select("id,name").order("created_at"),
      client
        .from("team_memberships")
        .select("team_id")
        .eq("user_id", user.id)
        .eq("active", true),
    ]);
    if (teams.error || memberships.error)
      return {
        ...empty,
        userId: user.id,
        error:
          "Could not load team access. Your records have not been replaced by sample data.",
      };
    const ids = new Set((memberships.data ?? []).map((m) => m.team_id));
    const options = (teams.data ?? []).filter((t) => ids.has(t.id));
    const requestedTeam = query.team ?? jar.get("da-team")?.value;
    const team =
      options.find((t) => t.id === requestedTeam) ??
      (query.team ? undefined : options[0]);
    if (!team)
      return {
        ...empty,
        userId: user.id,
        teams: options,
        ...(query.team
          ? { error: "That team is not available to this account." }
          : {}),
      };
    const seasons = await client
      .from("team_seasons")
      .select("id,name,archived")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false });
    const base = {
      ...empty,
      userId: user.id,
      teams: options,
      teamId: team.id,
      seasons: seasons.data ?? [],
    };
    if (seasons.error)
      return {
        ...base,
        error: "Could not load seasons. Retry to see your records.",
      };
    const season =
      base.seasons.find(
        (s) => s.id === (query.season ?? jar.get("da-season")?.value),
      ) ??
      base.seasons.find((s) => !s.archived) ??
      base.seasons[0];
    if (!season) return base;
    const loaded = await loadScorebook(team.id, season.id, scope);
    return {
      ...base,
      seasonId: season.id,
      loaded: loaded.status === "ok" ? loaded.data : null,
      ...(loaded.status !== "ok"
        ? {
            error:
              "Could not load the confirmed scorebook. Refresh or sign in again; no sample totals are substituted.",
          }
        : {}),
    };
  } catch {
    return {
      ...empty,
      error:
        "Could not load your dashboard. Refresh to retry; no sample totals are substituted.",
    };
  }
}
