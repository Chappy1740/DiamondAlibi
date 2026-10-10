import Link from "next/link";
import {
  House,
  Trophy,
  ChartNoAxesColumnIncreasing,
  CupSoda,
  Ellipsis,
} from "lucide-react";
import { personalDashboard } from "@/lib/personal-dashboard";
import { emptyTotals, rates, type Scope, type Totals } from "@/lib/scoring";
import type { LoadedScorebook } from "@/lib/scorebook-view";
import { DashboardRefresh } from "./dashboard-refresh";
import { Alibi } from "./workspace";
import { GameScoreboardPanel } from "./game-scoreboard";
import { connectedScoreboard } from "@/lib/game-scoreboard";

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
};
const tabs = [
  { path: "", label: "Home", icon: House },
  { path: "games", label: "Games", icon: Trophy },
  { path: "stats", label: "Stats", icon: ChartNoAxesColumnIncreasing },
  { path: "beverages", label: "Beverage", icon: CupSoda },
  { path: "more", label: "More", icon: Ellipsis },
];
const rate = (value: number | null) =>
  value === null ? "—" : value.toFixed(3).replace(/^0/, "");
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
  const view = loaded ? personalDashboard(loaded, p) : null;
  const team = p.teams.find((t) => t.id === p.teamId);
  const season = p.seasons.find((s) => s.id === p.seasonId);
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
      : `/club/score?${new URLSearchParams({ team: p.teamId, season: p.seasonId, ...(game ? { game } : {}) })}`;
  const filteredGames =
    loaded?.snapshot.games.filter(
      (g) => p.scope === "Overall" || g.game.kind === p.scope,
    ) ?? [];
  const teamTotals = loaded
    ? Object.values(loaded.snapshot.totals).reduce((sum, t) => {
        for (const key of Object.keys(sum) as (keyof Totals)[])
          sum[key] += t[key];
        return sum;
      }, emptyTotals())
    : null;
  const teamRates = teamTotals ? rates(teamTotals) : null;
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
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="desktop-rail">
        <Link href={href("")} className="wordmark">
          DIAMOND
          <span>
            ALIBI<span className="accent">.</span>
          </span>
        </Link>
        <span className="rail-caption">THE STATS DON’T LIE.</span>
        <nav aria-label="Desktop primary">{navigation}</nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link className="compact-brand" href={href("")}>
            DIAMOND ALIBI<span className="accent">.</span>
          </Link>
          <Link
            className="button secondary"
            href={p.review ? "/review" : "/club"}
            target={p.review ? "_top" : undefined}
          >
            {p.review ? "Review hub" : "My clubhouse"}
          </Link>
        </header>
        <div className="content-wrap">
          <p className="connection-notice">
            {p.sample
              ? "Sample history · 12 players · four 16-game league seasons · seven tournaments. These records are separate from your clubhouse."
              : "Your clubhouse records · everyone on the team can score for everyone."}{" "}
            {!p.review && (
              <Link className="text-link" href={p.sample ? "/" : "/?sample=1"}>
                {p.sample ? "Use my account" : "Explore sample history"}
              </Link>
            )}
          </p>
          <form
            className="dashboard-context"
            method="get"
            action={p.review ? "/review/history" : `/${p.route}`}
          >
            {p.sample && <input type="hidden" name="sample" value="1" />}
            {p.review && <input type="hidden" name="route" value={p.route} />}
            <label>
              Team
              <select aria-label="Team" name="team" defaultValue={p.teamId}>
                {p.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Season
              <select
                aria-label="Season"
                name="season"
                defaultValue={p.seasonId}
              >
                {p.seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.archived ? " · history" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Statistics view
              <select
                aria-label="Statistics view"
                name="scope"
                defaultValue={p.scope}
              >
                {["League", "Tournament", "Overall"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            {p.sample && (
              <label>
                Sample player
                <select
                  aria-label="Sample player"
                  name="player"
                  defaultValue={p.userId}
                >
                  {loaded?.roster.map((r) => (
                    <option key={r.id} value={r.user_id ?? ""}>
                      {r.display_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="button secondary">Apply context</button>
          </form>
          {!p.sample && <DashboardRefresh />}
          <main id="main" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  {team?.name ?? "Your team"} ·{" "}
                  {season?.name ?? "Choose a season"} · {p.scope}
                </span>
                <h1>
                  {p.route === ""
                    ? `Your game, ${view?.player?.name ?? "Player"}.`
                    : (tabs.find((t) => t.path === p.route)?.label ??
                      "Clubhouse")}
                </h1>
                <p>The stats don’t lie. Your teammates might.</p>
              </div>
            </div>
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
                          · {row.official} · {row.runs} runs · {row.rbi} RBI
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
                    {view && view.liveGames.length > 0 && (
                      <section>
                        <h2>Live now</h2>
                        <div className="dashboard-cards">{gameCards(true)}</div>
                      </section>
                    )}
                    <section className="card detail-card">
                      <h2>My season</h2>
                      {view?.statistics ? (
                        <div className="dashboard-metrics">
                          <span>
                            OBP <strong>{rate(view.statistics.OBP)}</strong>
                          </span>
                          <span>
                            Reach Base %{" "}
                            <strong>{rate(view.statistics.Reach)}</strong>
                          </span>
                          <span>
                            HR <strong>{view.statistics.HR}</strong>
                          </span>
                          <span>
                            PA <strong>{view.statistics.PA}</strong>
                          </span>
                        </div>
                      ) : (
                        <p>
                          {view?.player
                            ? "No recorded plate appearances in this view."
                            : "No player record is linked to this account. Guest history is not claimed automatically."}
                        </p>
                      )}
                      <p>
                        Beverage Board:{" "}
                        <strong>
                          {balance(view?.beverageBalance ?? null)}
                        </strong>
                      </p>
                      <Link className="text-link" href={href("stats")}>
                        All player statistics
                      </Link>
                    </section>
                    <section className="card detail-card">
                      <h2>Season activity</h2>
                      <p>
                        {loaded.snapshot.games.length} games ·{" "}
                        {loaded.snapshot.tournaments.length} tournaments ·{" "}
                        {loaded.roster.length} players
                      </p>
                      <Link className="button secondary" href={href("games")}>
                        View games
                      </Link>
                    </section>
                  </>
                )}
                {p.route === "games" && (
                  <>
                    <Link className="button primary" href={scoring()}>
                      {p.sample
                        ? "Try local scoring"
                        : "Start or manage a game"}
                    </Link>
                    <h2>Season games</h2>
                    <div className="dashboard-cards">{gameCards(false)}</div>
                    {loaded.snapshot.games.length === 0 && (
                      <p>No games recorded this season.</p>
                    )}
                    <h2>Tournaments</h2>
                    {loaded.snapshot.tournaments.map((t) => (
                      <section key={t.id} className="card detail-card">
                        <h3>{t.name}</h3>
                        <p>
                          {t.guaranteedGames
                            ? `${t.guaranteedGames}-game guaranteed`
                            : "Guarantee unspecified"}{" "}
                          ·{" "}
                          {
                            loaded.snapshot.games.filter(
                              (g) => g.game.tournament_id === t.id,
                            ).length
                          }{" "}
                          games recorded
                        </p>
                        <Link
                          className="button secondary"
                          href={
                            p.sample
                              ? p.review
                                ? "/review/scoring"
                                : "/practice"
                              : `/club/score?${new URLSearchParams({ team: p.teamId, season: p.seasonId, tournament: t.id })}`
                          }
                        >
                          {p.sample
                            ? "Practice additional games"
                            : `Create Game ${loaded.snapshot.games.filter((g) => g.game.tournament_id === t.id).length + 1}`}
                        </Link>
                        <p className="micro">
                          Game setup remains separate from bracket advancement.
                        </p>
                      </section>
                    ))}
                  </>
                )}
                {p.route === "stats" && (
                  <>
                    <section className="card detail-card">
                      <h2>Team summary</h2>
                      <p>
                        {filteredGames.length} {p.scope.toLowerCase()} games in{" "}
                        {season?.name}
                      </p>
                      <div className="dashboard-metrics">
                        <span>
                          OBP <strong>{rate(teamRates?.OBP ?? null)}</strong>
                        </span>
                        <span>
                          HR <strong>{teamTotals?.HR ?? "—"}</strong>
                        </span>
                        <span>
                          PA <strong>{teamTotals?.PA ?? "—"}</strong>
                        </span>
                      </div>
                    </section>
                    <div
                      className="dashboard-table"
                      tabIndex={0}
                      role="region"
                      aria-label="Player statistics table"
                    >
                      <table>
                        <caption>
                          Player statistics · {season?.name} · {p.scope}
                        </caption>
                        <thead>
                          <tr>
                            {[
                              "Player",
                              "PA",
                              "H",
                              "HR",
                              "RBI",
                              "OBP",
                              "Reach Base %",
                            ].map((h) => (
                              <th key={h} scope="col">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {loaded.roster.map((r) => {
                            const t = loaded.snapshot.totals[r.id];
                            const calculated = t ? rates(t) : null;
                            return (
                              <tr key={r.id}>
                                <th scope="row">{r.display_name}</th>
                                <td>{t?.PA ?? "—"}</td>
                                <td>{t?.H ?? "—"}</td>
                                <td>{t?.HR ?? "—"}</td>
                                <td>{t?.RBI ?? "—"}</td>
                                <td>{rate(calculated?.OBP ?? null)}</td>
                                <td>{rate(calculated?.Reach ?? null)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p>
                      Overall combines league and tournament play in this
                      selected season. Prior seasons remain selectable; career
                      totals are not inferred.
                    </p>
                  </>
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
                  <Link className="button secondary" href="/status">
                    Project status
                  </Link>
                  {!p.review && (
                    <Link className="button secondary" href="/club">
                      Teams, invitations and seasons
                    </Link>
                  )}
                  <Link className="button secondary" href={href("more/alibi")}>
                    Generate an Alibi
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
            {p.route === "more/alibi" && <Alibi />}
          </main>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Mobile primary">
        {navigation}
      </nav>
    </>
  );
}
