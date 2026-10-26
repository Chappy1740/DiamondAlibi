import Link from "next/link";
import { BrandLink } from "./brand-link";
import { ProfileMenu } from "./profile-menu";
import { TournamentArchiveControls } from "./tournament-archive-controls";
import { CompetitionForm } from "./competition-form";
import { GameScoreboardPanel } from "./game-scoreboard";
import { connectedScoreboard } from "@/lib/game-scoreboard";
import { competitionPath, competitionView, contextQuery, type CompetitionKind } from "@/lib/competitions";
import { LeagueSeasonStats, TournamentSeasonStats } from "./tournament-season-stats";
import { CompactGameList } from "./compact-game-list";
import type { DashboardProps } from "./player-dashboard";

export function CompetitionPage({ data: p, kind, id, gamesOnly = false, fromGames = false, creating = false, settings = false }: {
  data: DashboardProps; kind: CompetitionKind; id?: string; gamesOnly?: boolean; fromGames?: boolean; creating?: boolean; settings?: boolean;
}) {
  const query = new URLSearchParams(contextQuery(p.teamId, p.seasonId));
  query.set("scope", p.scope);
  if (p.sample) { query.set("sample", "1"); query.set("player", p.userId); }
  const context = query.toString();
  // Presentation query flags never grant access or change the loaded data scope.
  const matching = p.loaded?.snapshot.teamId === p.teamId && p.loaded?.snapshot.seasonId === p.seasonId;
  const leagueGames = matching ? p.loaded!.snapshot.games.filter(g => g.game.kind === "League" && (!id || g.game.league_id === id)) : [];
  const leagueGameList = kind === "League" && gamesOnly;
  const settingsView = kind === "Tournament" && !!id && settings;
  const createView = kind === "Tournament" && creating && !id;
  const gameHref = (game: string) => `${p.sample ? "/games/live" : "/club/score"}?${context}&game=${encodeURIComponent(game)}`;
  const selected = p.loaded && id ? competitionView(p.loaded, p.teamId, p.seasonId, kind, id) : null;
  const options = !matching ? [] : kind === "League" ? p.loaded?.snapshot.leagues ?? [] : p.loaded?.snapshot.tournaments ?? [];
  const activeOptions = options.filter(c => !("archived" in c && c.archived));
  const archivedOptions = options.filter(c => "archived" in c && c.archived);
  const tournamentArchived = kind === "Tournament" && !!selected && "archived" in selected.competition && selected.competition.archived === true;
  const home = `/?${context}`;
  const list = `${competitionPath(kind)}?${context}${fromGames ? "&from=games" : ""}`;
  const detail = `${competitionPath(kind, id)}?${context}${fromGames ? "&from=games" : ""}`;
  const gamesHome = `/games?${context}${leagueGameList && id ? `&league=${encodeURIComponent(id)}` : ""}`;
  const dates = [...new Set(selected?.games.map(game => game.playedOn) ?? [])].sort();
  const setup = `/club/score?${context}&${kind === "League" ? "league" : "tournament"}=${encodeURIComponent(id ?? "")}&setup=1`;
  return <main className="connected-wrap competition-page">
    <header className="connected-header">
      <BrandLink href={home} variant={id ? "compact" : "primary"} className="header-logo" />
      <ProfileMenu signedIn={!p.sample && !!p.userId} context={context} />
    </header>
    <Link className="text-link" href={settingsView ? detail : leagueGameList ? gamesHome : id || createView ? list : fromGames ? gamesHome : home}>{settingsView ? "Back to tournament" : createView ? "All tournaments" : leagueGameList ? "Games" : id ? `All ${kind === "League" ? "leagues" : "tournaments"}` : leagueGameList || fromGames ? "Games" : "Home"}</Link>
    <div className="page-heading"><div>
      <span className="eyebrow">{p.teams.find((t) => t.id === p.teamId)?.name ?? "Your team"} · {p.seasons.find((s) => s.id === p.seasonId)?.name ?? "Choose a season"}</span>
      <h1>{id ? selected ? settingsView ? "Tournament settings" : selected.competition.name : "Competition unavailable" : createView ? "Create tournament" : leagueGameList ? "League" : kind === "League" ? "Leagues" : "Tournaments"}</h1>
      {selected && !settingsView && kind === "Tournament" && dates.length > 0 && <p className="tournament-date">{dates[0]}{dates.length > 1 ? ` – ${dates[dates.length - 1]}` : ""}</p>}
    </div></div>
    {p.sample && <p className="connection-notice">Fictional sample history · read only. <Link href="/login">Sign in to manage your competitions.</Link></p>}
    {p.error && <p role="alert" className="form-error">{p.error}</p>}
    {!p.loaded && !p.error && <section className="card detail-card"><h2>Select your team and season</h2><Link className="button primary" href="/club">Team management</Link></section>}
    {p.loaded && !matching && <p role="alert">That season is not in the selected team.</p>}
    {p.loaded && matching && leagueGameList && <>
      {id && !selected ? <p role="alert">That league is not in the selected team and season.</p> : <CompactGameList games={leagueGames} gameHref={gameHref} />}
      {!leagueGames.length && <p>No league games recorded this season.</p>}
      {p.loaded.archived && <p className="connection-notice">Archived season · read only</p>}
      {(!id || selected) && <LeagueSeasonStats data={p.loaded} team={p.teamId} season={p.seasonId}
        seasonName={p.seasons.find(s => s.id === p.seasonId)?.name ?? "Selected season"} leagueId={id} leagueName={selected?.competition.name} />}
      {!p.sample && <details className="games-context"><summary>League setup</summary><Link className="button secondary" href={id ? detail : list}>Manage leagues and add games</Link></details>}
    </>}
    {p.loaded && matching && !id && !leagueGameList && <>
      {!createView && <div className="competition-list">
        {activeOptions.map((c) => <Link className={`card competition-link${kind === "Tournament" ? " tournament-entry" : ""}`} key={c.id} href={`${competitionPath(kind, c.id)}?${context}${fromGames ? "&from=games" : ""}`}>
          <strong>{c.name}</strong>{kind === "Tournament"
            ? <span className="button primary">Enter</span>
            : <span>{c.fenceLimit == null ? "HR default unspecified" : `${c.fenceLimit} fence HR per game`} · Open games →</span>}
        </Link>)}
        {!activeOptions.length && <p>No {archivedOptions.length > 0 ? "active " : ""}{kind === "League" ? "leagues" : "tournaments"} in this season yet.</p>}
      </div>}
      {kind === "Tournament" && !createView && archivedOptions.length > 0 && <details className="archive-history"><summary>Archived tournaments ({archivedOptions.length})</summary><div className="competition-list">{archivedOptions.map(c => <Link className="card competition-link tournament-entry" key={c.id} href={`${competitionPath(kind,c.id)}?${context}${fromGames ? "&from=games" : ""}`}><strong>{c.name} · Archived</strong><span className="button secondary">View history</span></Link>)}</div></details>}
      {kind === "Tournament" && !createView && (p.sample || p.loaded.archived
        ? <><button className="button primary" disabled>Create tournament</button>{p.loaded.archived && <p className="connection-notice">Archived season · read only</p>}</>
        : <Link className="button primary" href={`${list}&create=1`}>Create tournament</Link>)}
      {!p.sample && (kind === "League" || createView) && <section className="card detail-card">
        {!createView && <h2>Create a league</h2>}
        <CompetitionForm team={p.teamId} season={p.seasonId} kind={kind} archived={p.loaded.archived} />
      </section>}
      {createView && p.sample && <p>Sign in to create a tournament. Sample records stay read only.</p>}
      {kind === "Tournament" && !createView && <TournamentSeasonStats data={p.loaded} team={p.teamId}
        season={p.seasonId} seasonName={p.seasons.find(s => s.id === p.seasonId)?.name ?? "Selected season"} />}
    </>}
    {id && p.loaded && !selected && !leagueGameList && <p role="alert">That competition is not in the selected team and season.</p>}
    {selected && settingsView && <section className="card detail-card">
      <h2>{selected.competition.name}</h2>
      {p.loaded?.archived && <p className="connection-notice">Archived season · read only</p>}
      {p.sample ? <>
        <p>Sample tournament settings · read only.</p>
        <dl className="data-list">
          <dt>Tournament name</dt><dd>{selected.competition.name}</dd>
          <dt>Fence HR limit</dt><dd>{selected.competition.fenceLimit ?? "Unspecified"}</dd>
          <dt>Games guaranteed</dt><dd>{"guaranteedGames" in selected.competition ? selected.competition.guaranteedGames ?? "Unspecified" : "Unspecified"}</dd>
        </dl>
      </> : <CompetitionForm team={p.teamId} season={p.seasonId} kind="Tournament" existing={selected.competition} archived={!!p.loaded?.archived || tournamentArchived} />}
      {!p.sample && p.loaded?.snapshot.capabilities?.tournamentArchive && "revision" in selected.competition && <TournamentArchiveControls team={p.teamId} season={p.seasonId} id={selected.competition.id} name={selected.competition.name} archived={tournamentArchived} revision={selected.competition.revision} seasonArchived={!!p.loaded.archived} />}
    </section>}
    {selected && !settingsView && !leagueGameList && <>
      <div className="competition-actions">
        {!p.sample && !p.loaded?.archived && !tournamentArchived && <Link className="button primary" href={setup}>Add {kind === "Tournament" ? `Game ${selected.games.length + 1}` : "a game"}</Link>}
        {kind === "Tournament" && <Link className="button secondary" href={`${detail}&settings=1`}>Tournament settings</Link>}
      </div>
      {p.loaded?.archived && <p className="connection-notice">Archived season · read only</p>}
      {tournamentArchived && <p className="connection-notice">Archived tournament · read only. Restore it in Tournament settings to resume scoring.</p>}
      <h2>Games</h2>
      {kind === "Tournament" ? <CompactGameList games={selected.games} gameHref={gameHref} /> : <div className="dashboard-cards">
        {selected.games.map((g) => { const score = connectedScoreboard(g.game); return <article className="card detail-card" key={g.game.id}>
          <span className="eyebrow">{g.game.completed ? "Final" : "Live"}{kind === "League" || dates.length > 1 ? ` · ${g.playedOn}` : ""}{g.game.tournament_game_number ? ` · Game ${g.game.tournament_game_number}` : ""}</span>
          <h3>vs. {g.game.opponent}</h3>
          {!p.sample && <Link className="button primary" href={`/club/score?${context}&game=${encodeURIComponent(g.game.id)}`}>{g.game.completed ? "Open scorebook" : "Score game"}</Link>}
          {kind === "League" ? <GameScoreboardPanel value={score} /> : score && <p className="micro">Our team {score.teamRuns} · Opponent {score.opponentRuns}</p>}
        </article>; })}
      </div>}
      {!selected.games.length && <p>No games recorded.{!p.sample && !p.loaded?.archived && !tournamentArchived && " Add the first game to choose a lineup and start scoring."}</p>}
      {kind === "Tournament" && p.loaded && <TournamentSeasonStats data={p.loaded} team={p.teamId} season={p.seasonId}
        seasonName={p.seasons.find(s => s.id === p.seasonId)?.name ?? "Selected season"} tournamentId={id} tournamentName={selected.competition.name} />}
      {kind === "League" && p.loaded && <LeagueSeasonStats data={p.loaded} team={p.teamId} season={p.seasonId}
        seasonName={p.seasons.find(s => s.id === p.seasonId)?.name ?? "Selected season"} leagueId={id} leagueName={selected.competition.name} />}
      {!p.sample && kind === "League" && <details className="card detail-card"><summary>League settings</summary>
        <CompetitionForm team={p.teamId} season={p.seasonId} kind={kind} existing={selected.competition} archived={!!p.loaded?.archived} />
      </details>}
    </>}
  </main>;
}
