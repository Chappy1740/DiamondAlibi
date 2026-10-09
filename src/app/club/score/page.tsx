import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { loadScorebook, scoringAction } from "@/app/club/scoring-actions";
import { ConnectedScorebook } from "@/components/connected-scorebook";
export const dynamic = "force-dynamic";
export default async function ScorePage({
  searchParams,
}: {
  searchParams: Promise<{
    team?: string;
    season?: string;
    game?: string;
    tournament?: string;
  }>;
}) {
  const query = await searchParams;
  const client = await supabaseServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const jar = await cookies();
  const teams = await client
    .from("teams")
    .select("id,name")
    .order("created_at");
  const team =
    teams.data?.find(
      (t) => t.id === (query.team ?? jar.get("da-team")?.value),
    ) ?? (query.team ? undefined : teams.data?.[0]);
  if (!team)
    return (
      <main className="connected-wrap">
        <Link href="/club">My clubhouse</Link>
        <h1>Choose a team first</h1>
        <p>Create or join a team in your clubhouse before scoring.</p>
      </main>
    );
  const seasons = await client
    .from("team_seasons")
    .select("id,name,archived")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });
  const season =
    seasons.data?.find(
      (s) => s.id === (query.season ?? jar.get("da-season")?.value),
    ) ??
    (query.season
      ? undefined
      : (seasons.data?.find((s) => !s.archived) ?? seasons.data?.[0]));
  if (!season)
    return (
      <main className="connected-wrap">
        <Link href="/club">My clubhouse</Link>
        <h1>Create a season first</h1>
        <p>Each season keeps its own games and Beverage Board history.</p>
      </main>
    );
  const initial = await loadScorebook(team.id, season.id, "Overall");
  return (
    <main className="connected-wrap">
      <header className="connected-header">
        <Link className="compact-brand" href="/">
          DIAMOND ALIBI<span className="accent">.</span>
        </Link>
        <Link className="button secondary" href="/club">
          My clubhouse
        </Link>
      </header>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Team scorebook</span>
          <h1>{team.name}</h1>
          <p>{season.name} · Everyone on this team can score for everyone.</p>
        </div>
      </div>
      <ConnectedScorebook
        key={`${user.id}-${team.id}-${season.id}-${query.game ?? ""}-${query.tournament ?? ""}`}
        storageKey={`diamond-alibi.pending.${user.id}.${team.id}.${season.id}`}
        teamId={team.id}
        seasonId={season.id}
        initial={initial}
        initialGameId={query.game}
        initialTournamentId={
          initial.status === "ok" &&
          initial.data.snapshot.tournaments.some(
            (t) => t.id === query.tournament,
          )
            ? query.tournament
            : undefined
        }
        submitAction={scoringAction}
        reloadAction={loadScorebook}
      />
    </main>
  );
}
