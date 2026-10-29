import { formatBaseballRate as rate } from "@/lib/baseball-rate";
import { scoreRowSummary } from "@/lib/score-row-presentation";
import Link from "next/link";
import { ProfileMenu } from "./profile-menu";
import { BrandLink } from "./brand-link";
import {
  House,
  Trophy,
  ChartNoAxesColumnIncreasing,
  CupSoda,
  Ellipsis,
} from "lucide-react";
import { personalDashboard } from "@/lib/personal-dashboard";
import { type Scope } from "@/lib/scoring";
import { teamLeaderboard } from "@/lib/tournament-leaderboard";
import { PlayerLeaderboard } from "./tournament-leaderboard";
import type { LoadedScorebook } from "@/lib/scorebook-view";
import { DashboardRefresh } from "./dashboard-refresh";
import { DashboardSelect } from "./dashboard-select";
import { GameContextPicker, type GameContextTeam } from "./game-context-picker";
import { PersonalAlibis } from "./personal-alibis";
import { GameScoreboardPanel } from "./game-scoreboard";
import { connectedScoreboard } from "@/lib/game-scoreboard";
import { CompactGameList } from "./compact-game-list";
import { gameSetupHref, safeGameSetupReturn } from "@/lib/game-navigation";
import { BeverageControls } from "./beverage-controls";

type Option = { id: string; name: string };
export type DashboardProps = {
  review?: boolean;
  route: string;
  sample: boolean;
  userId: string;
  teams: Option[];
  seasons: (Option & { archived: boolean })[];
  teamId: string;
  seasonId: string;
  scope: Scope;
  loaded: LoadedScorebook | null;
  error?: string;
  gameId?: string;
  leagueId?: string;
  gameContexts?: GameContextTeam[];
  gameContextError?: string;
  setupReturnHref?: string;
};
const tabs = [
  { path: "", label: "Home", icon: House },
  { path: "games", label: "Games", icon: Trophy },
  { path: "stats", label: "Stats", icon: ChartNoAxesColumnIncreasing },
  { path: "beverages", label: "Beverage", icon: CupSoda },
  { path: "more", label: "More", icon: Ellipsis },
];
const balance = (value: number | null) =>
  value === null
    ? "No recorded balance"
    : value < 0
      ? `${Math.abs(value)} in credit`
      : value > 0
        ? `${value} owed`
        : "Settled · 0";
export function PlayerDashboard(p: DashboardProps) {
  const { loaded } = p;
  const fitHome = p.route === "" && !p.sample && !p.review;
  const view = loaded ? personalDashboard(loaded, p) : null;
  const team = p.teams.find((t) => t.id === p.teamId);
  const season = p.seasons.find((s) => s.id === p.seasonId);
  const selectedLeague = loaded?.snapshot.leagues?.find(option => option.id === p.leagueId);
  const query = new URLSearchParams({
    team: p.teamId,
    season: p.seasonId,
    scope: p.scope,
  });
  if (p.sample) {
    query.set("sample", "1");
    query.set("player", p.userId);
  }
  const href = (path: string) =>
    p.review
      ? `/review/history?${query}&route=${encodeURIComponent(path)}`
      : `/${path}?${query}`;
  const scoring = (game?: string) =>
    p.sample
      ? game
        ? `${href("games/live")}&game=${encodeURIComponent(game)}`
        : p.review
          ? "/review/scoring"
          : "/practice"
      : game ? `/club/score?${new URLSearchParams({ team: p.teamId, season: p.seasonId, game })}` : `/leagues?${query}`;
  const addGameHref = gameSetupHref(p.teamId, p.seasonId, { league: selectedLeague?.id });
  // Personal statistics scope must not hide the team’s games.
  const visibleGames = loaded?.snapshot.games.filter(g =>
    !selectedLeague || g.game.league_id === selectedLeague.id) ?? [];
  const setupReturnHref = safeGameSetupReturn(p.setupReturnHref, p.teamId, p.seasonId);
  const navigation = (
    <>
      {tabs.map((t) => (
        <Link
          key={t.path}
          href={href(t.path)}
          aria-current={
            (p.route.split("/")[0] || "") === t.path ? "page" : undefined
          }
        >
          <t.icon size={21} aria-hidden />
          <span>{t.label}</span>
        </Link>
      ))}
    </>
  );
  const gameCards = (liveOnly: boolean) =>
    (loaded?.snapshot.games ?? [])
      .filter((g) =>
        liveOnly
          ? !g.game.completed
          : p.scope === "Overall" || g.game.kind === p.scope,
      )
      .map((g) => (
        <article className="card detail-card" key={g.game.id}>
          <span className="eyebrow">
            {g.game.completed ? "Completed" : "Active"} · {g.game.kind}
          </span>
          <h3>
            {team?.name} vs. {g.game.opponent}
          </h3>
          <p>
            {g.playedOn} · {g.lineup.length} players
          </p>
          {g.game.tournament_game_number && (
            <p>Tournament Game {g.game.tournament_game_number}</p>
          )}
          <GameScoreboardPanel value={connectedScoreboard(g.game)} />
          {!g.game.completed && (
            <p>
              Current batter:{" "}
              {loaded?.roster.find(
                (r) => r.id === g.lineup[g.game.next_batter_position],
              )?.display_name ?? "Not available"}
            </p>
          )}
          <Link className="button primary" href={scoring(g.game.id)}>
            {p.sample ? "View sample scorebook" : "Open scoring"}
          </Link>
        </article>
      ));
  const contextControls = (
    <section className={`dashboard-context-panel${p.route === "" ? " dashboard-context-panel--home" : p.route === "games" ? " dashboard-context-panel--compact" : ""}`} aria-label="Team, season and statistics controls">
          <form
            className="dashboard-context"
            method="get"
            action={p.review ? "/review/history" : `/${p.route}`}
          >
            {p.sample && <input type="hidden" name="sample" value="1" />}
            {p.review && <input type="hidden" name="route" value={p.route} />}
            <DashboardSelect label="Team" name="team" value={p.teamId} options={p.teams} />
            <DashboardSelect label="Season" name="season" value={p.seasonId} options={p.seasons.map((s) => ({ id: s.id, name: `${s.name}${s.archived ? " · history" : ""}` }))} />
            <DashboardSelect label="Personal stats" accessibleLabel="Statistics view" name="scope" value={p.scope} options={["Overall", "League", "Tournament"].map((name) => ({ id: name, name }))} />
            {p.sample && <DashboardSelect label="Sample player" name="player" value={p.userId} options={loaded?.roster.map((r) => ({ id: r.user_id ?? "", name: r.display_name })) ?? []} />}
            {p.route === "" || p.route === "games" ? <div className="dashboard-context-action"><span aria-hidden="true">Update view</span><button className="button secondary">Apply context</button></div> : <button className="button secondary">Apply context</button>}
          </form>
      {!p.sample && !fitHome && <DashboardRefresh />}
      {p.sample && <p className="connection-notice dashboard-notice">
        Sample history · 12 players · four 16-game league seasons · seven tournaments. These records are separate from your clubhouse.{" "}
        {!p.review && <Link className="text-link" href="/">Use my account</Link>}
      </p>}
    </section>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="desktop-rail">
        <BrandLink href={href("")} className="rail-logo" variant="primary" />
        <span className="rail-caption">THE STATS DON’T LIE.</span>
        <nav aria-label="Desktop primary">{navigation}</nav>
      </aside>
      <div className={`workspace${fitHome ? " workspace--home" : ""}`}>
        <header className="topbar">
          <BrandLink className={p.route.includes("/") ? "" : "header-logo"} href={href("")} variant={p.route.includes("/") ? "compact" : "primary"} />
          {p.review ? <Link className="button secondary" href="/review" target="_top">Review hub</Link>
            : fitHome ? <div className="home-header-actions"><DashboardRefresh compact /><ProfileMenu signedIn={!!p.userId} context={query.toString()} /></div>
            : <ProfileMenu signedIn={!p.sample && !!p.userId} context={query.toString()} />}

        </header>
        <div className="content-wrap">
          {p.route !== "" && p.route !== "games" && contextControls}
          <main id="main" tabIndex={-1}>
            {p.route !== "more/alibi" && <div className="page-heading">
              <div>
                {p.route !== "" && <span className="eyebrow">
                  {team?.name ?? "Your team"} ·{" "}
                  {season?.name ?? "Choose a season"}{p.route !== "games" && ` · ${p.scope}`}
                </span>}
                <h1>
                  {p.route === ""
                    ? `Your game, ${view?.player?.name ?? "Player"}.`
                    : p.route === "more/beverage-rules" ? "Beverage Rules" : (tabs.find((t) => t.path === p.route)?.label ??
                      "Clubhouse")}
                </h1>
                {p.route !== "games" && <p>The stats don’t lie. Your teammates might.</p>}
              </div>
            </div>}
            {p.route === "games/live" &&
              p.sample &&
              loaded &&
              (() => {
                const selected = loaded.snapshot.games.find(
                  (g) => g.game.id === p.gameId,
                );
                return selected ? (
                  <section className="card detail-card">
                    <h2>Sample scorebook · {selected.game.opponent}</h2>
                    <p>
                      Recorded synthetic plays · read-only history. Use local
                      practice to try entering or correcting plays.
                    </p>
                    <Link
                      className="button secondary"
                      href={p.review ? "/review/scoring" : "/practice"}
                    >
                      Try local scoring
                    </Link>
                    <h3>Plate appearances</h3>
                    {selected.evaluation.rows.map((row) => (
                      <details key={row.id}>
                        <summary>
                          {loaded.roster.find((r) => r.id === row.playerId)
                            ?.display_name ?? "Player"}{" "}
                          · {scoreRowSummary(row)}
                        </summary>
                        <p>
                          Beverage adjustment: {row.delta} ·{" "}
                          {row.voided ? "Voided" : "Recorded"}
                        </p>
                      </details>
                    ))}
                  </section>
                ) : (
                  <p role="alert">
                    That game is not in the selected sample season.
                  </p>
                );
              })()}
            {p.error && (
              <p role="alert" className="form-error">
                {p.error} <Link href={href(p.route)}>Retry</Link>
              </p>
            )}
            {p.route === "" && !loaded && contextControls}
            {!loaded && !p.error && (
              <section className="card detail-card">
                <h2>Your season starts here</h2>
                <p>
                  Create or join a team and select a season to see your games
                  and statistics.
                </p>
                <Link className="button primary" href="/club">
                  Open my clubhouse
                </Link>
              </section>
            )}
            {loaded && (
              <>
                {p.route === "" && (
                  <>
                    <div className="competition-entry" aria-label="Competitions">
                      <Link className="button primary" href={`/leagues?${query}`}>Leagues</Link>
                      <Link className="button primary" href={`/tournaments?${query}`}>Tournaments</Link>
                    </div>
                    {p.sample && view && view.liveGames.length > 0 && (
                      <section>
                        <h2>Live now</h2>
                        <div className="dashboard-cards">{gameCards(true)}</div>
                      </section>
                    )}
                    <section className="card detail-card home-season-card home-personal-summary">
                      <h2>My season</h2>
                      <p className="dashboard-selected-context">{team?.name} · {season?.name} · {p.scope}</p>
                      {view?.statistics ? (
                        <div className="dashboard-metrics home-season-stats">
                          <dl className="home-stat-row home-stat-row--rates" aria-label="On-base rates">
                            <div className="home-stat"><dt>OBP</dt><dd><strong>{rate(view.statistics.OBP)}</strong></dd></div>
                            <div className="home-stat"><dt>Reach Base %</dt><dd><strong>{rate(view.statistics.Reach)}</strong></dd></div>
                          </dl>
                          <dl className="home-stat-row home-stat-row--counts" aria-label="Personal season totals">
                            {[
                              { label: "Hits", value: view.statistics.H },
                              { label: "RBIs", value: view.statistics.RBI },
                              { label: "HRs", value: view.statistics.HR },
                              { label: "BEVs", value: view.beverageBalance ?? "—" },
                            ].map((stat) => <div className="home-stat" key={stat.label}>
                              <dt title={stat.label === "BEVs" ? "Beverages" : undefined}>{stat.label}</dt>
                              <dd><strong>{stat.value}</strong></dd>
                            </div>)}
                          </dl>
                        </div>
                      ) : (
                        <>
                          <p>{view?.player ? "No recorded plate appearances in this view." : "No player record is linked to this account. Use your player-specific membership invite to link existing roster history."}</p>
                          <p>Beverage Board: <strong>{balance(view?.beverageBalance ?? null)}</strong></p>
                        </>
                      )}
                    </section>
                    {contextControls}

                  </>
                )}
                {p.route === "games" && (
                  <>
                    {selectedLeague && <p className="micro">League: {selectedLeague.name}</p>}
                    <div className="competition-entry games-entry" aria-label="Choose game type">
                      <Link className="button primary" href={`/leagues${selectedLeague ? `/${encodeURIComponent(selectedLeague.id)}` : ""}?${query}&view=games`}>League</Link>
                      <Link className="button primary" href={`/tournaments?${query}&from=games`}>Tournament</Link>
                    </div>
                    {!p.sample && !p.review && !loaded.archived && <Link className="button primary" href={addGameHref}>Add game</Link>}
                    {loaded.archived && <p className="micro">Archived season · game creation is unavailable.</p>}
                    {p.sample && <p className="micro">Sample games · fictional, read only.</p>}
                    {visibleGames.length ? <CompactGameList games={visibleGames} gameHref={scoring} /> : <p>No games recorded in this view. {p.sample || p.review || loaded.archived ? "Choose another season or competition to view games." : "Select Add game to get started."}</p>}
                  </>
                )}
                {p.route === "stats" && (
                  <PlayerLeaderboard
                    key={`${p.teamId}:${p.seasonId}:${p.scope}`}
                    title="Team leaders"
                    regionLabel="Team player leaderboard"
                    scopeLabel={`${team?.name ?? "Your team"} · ${season?.name ?? "Selected season"} · ${p.scope}`}
                    players={teamLeaderboard(loaded, p.teamId, p.seasonId, p.scope)}
                  />
                )}
                {p.route === "beverages" && (
                  <>
                    <section className="card detail-card">
                      <h2>Season Beverage Board</h2>
                      <p>
                        Combines league and tournament play regardless of the
                        statistics filter. A new season starts fresh; previous
                        seasons remain in history.
                      </p>
                      <p>
                        Mine:{" "}
                        <strong>
                          {balance(view?.beverageBalance ?? null)}
                        </strong>
                      </p>
                      {!p.sample && !p.review && <BeverageControls teamId={p.teamId} />}
                    </section>
                    <div className="card leaderboard">
                      {loaded.roster.map((r) => (
                        <div key={r.id} className="leader-row">
                          <strong>{r.display_name}</strong>
                          <span className="balance">
                            {balance(loaded.snapshot.board[r.id] ?? null)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p>
                      Roster order · balances are owed or credit. Competitive
                      ranking rules remain to be decided.
                    </p>
                  </>
                )}
              </>
            )}
            {p.route === "more" && (
              <section className="card detail-card">
                <h2>Clubhouse tools</h2>
                <div className="dashboard-cards">
                  <Link className="button secondary" href={href("more/beverage-rules")}>Beverage Rules</Link>
                  {!p.sample && !p.review && <Link className="button secondary" href="/?sample=1">Explore sample history</Link>}
                  <Link className="button secondary" href="/review/feedback">
                    Challenge the Call · Send feedback
                  </Link>
                  <Link className="button secondary" href="/status">
                    Project status
                  </Link>
                  {!p.review && (
                    <Link className="button secondary" href="/club">
                      Teams, invitations and seasons
                    </Link>
                  )}
                  <Link className="button secondary" href={href("more/alibi")}>
                    My alibis · Write or generate
                  </Link>
                  <Link
                    className="button secondary"
                    href={p.review ? "/review/scoring" : "/practice"}
                  >
                    Local scoring practice
                  </Link>
                </div>
              </section>
            )}
            {p.route === "more/beverage-rules" && (p.sample || !p.userId ? <section className="card detail-card"><h2>Beverage Rules</h2><p>Sign in and select your team to view its current rules.</p></section> : p.teamId ? <BeverageControls key={p.teamId} teamId={p.teamId} teamSettings returnHref={setupReturnHref} /> : <p>Select a team to view Beverage Rules.</p>)}
            {p.route === "more/alibi" && <PersonalAlibis connected={!p.sample && !!p.userId} />}
            {p.route === "games" && <GameContextPicker
              teams={p.gameContexts ?? (team ? [{ ...team, seasons: p.seasons.map(option => ({ ...option, leagues: option.id === p.seasonId ? loaded?.snapshot.leagues ?? [] : [] })) }] : [])}
              teamId={p.teamId} seasonId={p.seasonId} leagueId={p.leagueId} scope={p.scope}
              sample={p.sample} player={p.userId} error={p.gameContextError} />}
          </main>
        </div>
      </div>
    </>
  );
}

