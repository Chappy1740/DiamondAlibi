import Link from "next/link";
import { BrandLink } from "./brand-link";
import { ProfileMenu } from "./profile-menu";
import { tournamentLeaderboard } from "@/lib/tournament-leaderboard";
import { TournamentLeaderboard } from "./tournament-leaderboard";
import { CompetitionForm } from "./competition-form";
import { GameScoreboardPanel } from "./game-scoreboard";
import { connectedScoreboard } from "@/lib/game-scoreboard";
import { competitionPath, competitionView, contextQuery, type CompetitionKind } from "@/lib/competitions";
import type { DashboardProps } from "./player-dashboard";

export function CompetitionPage({ data: p, kind, id }: { data: DashboardProps; kind: CompetitionKind; id?: string }) {
  const context = contextQuery(p.teamId, p.seasonId);
  const selected = p.loaded && id ? competitionView(p.loaded, p.teamId, p.seasonId, kind, id) : null;
  const options = kind === "League" ? p.loaded?.snapshot.leagues ?? [] : p.loaded?.snapshot.tournaments ?? [];
  const home = `/?${context}`;
  const list = `${competitionPath(kind)}?${context}`;
  const dates = [...new Set(selected?.games.map(game => game.playedOn) ?? [])].sort();
  const setup = `/club/score?${context}&${kind === "League" ? "league" : "tournament"}=${encodeURIComponent(id ?? "")}&setup=1`;
  return <main className="connected-wrap competition-page">
    <header className="connected-header">
      <BrandLink href={home} variant={id ? "compact" : "primary"} className="header-logo" />
      <ProfileMenu signedIn={!p.sample && !!p.userId} context={context} />
    </header>
    <Link className="text-link" href={id ? list : home}>{id ? `All ${kind === "League" ? "leagues" : "tournaments"}` : "Home"}</Link>
    <div className="page-heading"><div>
      <span className="eyebrow">{p.teams.find((t) => t.id === p.teamId)?.name ?? "Your team"} · {p.seasons.find((s) => s.id === p.seasonId)?.name ?? "Choose a season"}</span>
      <h1>{id ? selected?.competition.name ?? "Competition unavailable" : kind === "League" ? "Leagues" : "Tournaments"}</h1>
      {selected && kind === "Tournament" && dates.length > 0 && <p className="tournament-date">{dates[0]}{dates.length > 1 ? ` – ${dates[dates.length - 1]}` : ""}</p>}
    </div></div>
    {p.sample && <p className="connection-notice">Sample history. <Link href="/login">Sign in to manage your competitions.</Link></p>}
    {p.error && <p role="alert" className="form-error">{p.error}</p>}
    {!p.loaded && !p.error && <section className="card detail-card"><h2>Select your team and season</h2><Link className="button primary" href="/club">Team management</Link></section>}
    {p.loaded && !id && <>
      <div className="competition-list">
        {options.map((c) => <Link className="card competition-link" key={c.id} href={`${competitionPath(kind, c.id)}?${context}${p.sample ? "&sample=1" : ""}`}>
          <strong>{c.name}</strong><span>{c.fenceLimit == null ? "HR default unspecified" : `${c.fenceLimit} fence HR per game`} · Open games →</span>
        </Link>)}
        {!options.length && <p>No {kind === "League" ? "leagues" : "tournaments"} in this season yet.</p>}
      </div>
      {!p.sample && <section className="card detail-card"><h2>Create a {kind.toLowerCase()}</h2>
        <CompetitionForm team={p.teamId} season={p.seasonId} kind={kind} archived={p.loaded.archived} />
      </section>}
    </>}
    {id && p.loaded && !selected && <p role="alert">That competition is not in the selected team and season.</p>}
    {selected && <>
      {!p.sample && !p.loaded?.archived && <Link className="button primary" href={setup}>Add {kind === "Tournament" ? `Game ${selected.games.length + 1}` : "a game"}</Link>}
      {p.loaded?.archived && <p className="connection-notice">Archived season · read only</p>}
      <h2>Games</h2>
      <div className="dashboard-cards">
        {selected.games.map((g) => { const score = connectedScoreboard(g.game); return <article className="card detail-card" key={g.game.id}>
          <span className="eyebrow">{g.game.completed ? "Final" : "Live"}{kind === "League" || dates.length > 1 ? ` · ${g.playedOn}` : ""}{g.game.tournament_game_number ? ` · Game ${g.game.tournament_game_number}` : ""}</span>
          <h3>vs. {g.game.opponent}</h3>
          {!p.sample && <Link className="button primary" href={`/club/score?${context}&game=${encodeURIComponent(g.game.id)}`}>{g.game.completed ? "Open scorebook" : "Score game"}</Link>}
          {kind === "League" ? <GameScoreboardPanel value={score} /> : score && <p className="micro">Our team {score.teamRuns} · Opponent {score.opponentRuns}</p>}
        </article>; })}
      </div>
      {!selected.games.length && <p>No games recorded. Add the first game to choose a lineup and start scoring.</p>}
      {kind === "Tournament" && p.loaded && <TournamentLeaderboard key={`${p.teamId}:${p.seasonId}:${id}`} players={tournamentLeaderboard(p.loaded, p.teamId, p.seasonId, id!)} />}
      {!p.sample && <details className="card detail-card"><summary>{kind === "Tournament" ? "Tournament settings" : "League settings"}</summary>
        <CompetitionForm team={p.teamId} season={p.seasonId} kind={kind} existing={selected.competition} archived={!!p.loaded?.archived} />
      </details>}
    </>}
  </main>;
}
