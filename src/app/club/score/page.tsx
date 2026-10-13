import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
import { competitionPath, contextQuery } from "@/lib/competitions";
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
    league?: string;
    setup?: string;
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
  const tournament = initial.status === "ok" ? initial.data.snapshot.tournaments.find((t) => t.id === query.tournament) : undefined;
  const league = initial.status === "ok" ? initial.data.snapshot.leagues?.find((l) => l.id === query.league) : undefined;
  const game = initial.status === "ok" ? initial.data.snapshot.games.find((g) => g.game.id === query.game) : undefined;
  if (initial.status === "ok" && ((query.tournament && !tournament) || (query.league && !league) || (query.game && !game) || (query.league && query.tournament))) {
    return <main className="connected-wrap"><BrandLink href="/" /><h1>Scorebook unavailable</h1><p>The requested game or competition is not in this team and season.</p><Link href={`/?${contextQuery(team.id, season.id)}`}>Home</Link></main>;
  }
  const competitionId = tournament?.id ?? league?.id ?? game?.game.tournament_id ?? game?.game.league_id;
  const competitionKind = tournament || game?.game.kind === "Tournament" ? "Tournament" : "League";
  const context = contextQuery(team.id, season.id);
  const setupMode = query.setup === "1" || (!query.game && initial.status === "ok" && !initial.data.snapshot.games.length);
  const setupNumber = tournament && initial.status === "ok"
    ? initial.data.snapshot.games.filter((g) => g.game.tournament_id === tournament.id).length + 1 : null;
  return (
    <main className={`connected-wrap${setupMode ? " game-setup-page" : ""}`}>
      <header className="connected-header" style={{ flexWrap: "wrap" }}>
        <BrandLink href={`/?${context}`} />
        <ProfileMenu context={context} />
      </header>
      <Link className="text-link" href={competitionId ? `${competitionPath(competitionKind, competitionId)}?${context}` : `/?${context}`}>{competitionId ? `Back to ${competitionKind.toLowerCase()}` : "Home"}</Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{setupMode ? setupNumber ? `Game ${setupNumber} · Tournament` : query.tournament ? "New tournament game" : "New league game" : "Team scorebook"}</span>
          <h1>{setupMode ? tournament?.name ?? league?.name ?? "Set up a game" : team.name}</h1>
          <p>{setupMode ? `${team.name} · ${season.name}` : `${season.name} · Everyone on this team can score for everyone.`}</p>
        </div>
      </div>
      <ConnectedScorebook
        key={`${user.id}-${team.id}-${season.id}-${query.game ?? ""}-${query.tournament ?? ""}-${query.league ?? ""}-${query.setup ?? ""}`}
        storageKey={`diamond-alibi.pending.${user.id}.${team.id}.${season.id}`}
        teamId={team.id}
        seasonId={season.id}
        initial={initial}
        initialGameId={query.game}
        initialLeagueId={league?.id}
        mode={setupMode ? "setup" : "score"}
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

