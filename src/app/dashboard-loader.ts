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
import { scoringMetadataPages } from "@/lib/scoring-metadata-pages";
import { loadPlayerProfile } from "@/lib/player-profile";
import { loadActiveTeams, selectActiveTeam } from "@/lib/team-selection";
import type { GameContextTeam } from "@/components/game-context-picker";

export type DashboardQuery = {
  sample?: string;
  player?: string;
  team?: string;
  season?: string;
  scope?: string;
  game?: string;
  shell?: string;
  returnTo?: string;
  league?: string;
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
      ...(route === "games"
        ? {
            leagueId: chosen.snapshot.leagues?.find(
              (league) => league.id === query.league,
            )?.id,
            gameContexts: [
              {
                id: "sample-team",
                name: "Sample Northwest Alibis",
                seasons: [...sampleSeasons].reverse().map((season) => ({
                  ...season,
                  leagues:
                    books.find((book) => book.snapshot.seasonId === season.id)
                      ?.snapshot.leagues ?? [],
                })),
              },
            ],
            ...(query.league &&
            !chosen.snapshot.leagues?.some(
              (league) => league.id === query.league,
            )
              ? {
                  loaded: null,
                  error:
                    "That league is not available in this team and season.",
                }
              : {}),
          }
        : {}),
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
    const [jar, { options, unavailable }, profile] = await Promise.all([
      cookies(),
      loadActiveTeams(client, user.id),
      route === "" ? loadPlayerProfile(client, user).catch(() => null) : null,
    ]);
    const account = {
      userId: user.id,
      profileName: profile?.details?.nickname,
    };
    if (unavailable)
      return {
        ...empty,
        ...account,
        error:
          "Could not load team access. Your records have not been replaced by sample data.",
      };
    // Only Games needs the lightweight chooser directory. RLS and the active
    // membership intersection both apply; no other teams' scorebooks are loaded.
    let picker: {
      gameContexts?: GameContextTeam[];
      gameContextError?: string;
    } = {};
    if (route === "games") {
      if (!options.length) picker = { gameContexts: [] };
      else {
        const teamIds = options.map((option) => option.id);
        const [allSeasons, allLeagues] = await Promise.all([
          scoringMetadataPages((start, end) =>
            client
              .from("team_seasons")
              .select("id,team_id,name,archived")
              .in("team_id", teamIds)
              .order("created_at", { ascending: false })
              .order("id")
              .range(start, end),
          ),
          scoringMetadataPages((start, end) =>
            client
              .from("scoring_leagues")
              .select("id,team_id,season_id,name")
              .in("team_id", teamIds)
              .order("name")
              .order("id")
              .range(start, end),
          ),
        ]);
        picker =
          allSeasons.error || allLeagues.error
            ? {
                gameContexts: [],
                gameContextError: "Could not load your teams and leagues.",
              }
            : {
                gameContexts: options.map((option) => ({
                  ...option,
                  seasons: allSeasons.data
                    .filter((season) => season.team_id === option.id)
                    .map((season) => ({
                      id: season.id,
                      name: season.name,
                      archived: season.archived,
                      leagues: allLeagues.data
                        .filter(
                          (league) =>
                            league.team_id === option.id &&
                            league.season_id === season.id,
                        )
                        .map((league) => ({
                          id: league.id,
                          name: league.name,
                        })),
                    })),
                })),
              };
      }
    }
    const team = selectActiveTeam(options, query.team, jar.get("da-team")?.value);
    if (!team)
      return {
        ...empty,
        ...account,
        teams: options,
        ...picker,
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
      ...account,
      teams: options,
      ...picker,
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
    if (
      route === "games" &&
      query.league &&
      loaded.status === "ok" &&
      !loaded.data.snapshot.leagues?.some(
        (league) => league.id === query.league,
      )
    )
      return {
        ...base,
        seasonId: season.id,
        error: "That league is not available in this team and season.",
      };
    return {
      ...base,
      seasonId: season.id,
      ...(route === "games" && loaded.status === "ok"
        ? {
            leagueId: loaded.data.snapshot.leagues?.find(
              (league) => league.id === query.league,
            )?.id,
          }
        : {}),
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
