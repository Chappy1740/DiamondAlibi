import { formatBaseballRate } from "@/lib/baseball-rate";
import { overallTournamentStats, tournamentStats } from "@/lib/tournament-leaderboard";
import type { LoadedScorebook } from "@/lib/scorebook-view";
import { PlayerLeaderboard } from "./tournament-leaderboard";

export function TournamentSeasonStats({ data, team, season, seasonName, tournamentId, tournamentName }: {
  data: LoadedScorebook; team: string; season: string; seasonName: string; tournamentId?: string; tournamentName?: string;
}) {
  const individual = tournamentId !== undefined;
  const stats = individual ? tournamentStats(data, team, season, tournamentId) : overallTournamentStats(data, team, season);
  if (!stats) return null;
  const scope = individual ? `${tournamentName ?? "Selected tournament"} · ${seasonName} · This tournament only` : `All tournaments · ${seasonName} · Tournament games only`;
  return <section className="tournament-season-stats" aria-label={individual ? "Tournament statistics" : "Overall tournament statistics"}>
    <section className="card detail-card home-season-card tournament-team-summary" aria-label="Tournament team totals">
      <h2>{individual ? "Tournament stats" : "Overall tournament stats"}</h2>
      <p className="micro">{scope}</p>
      {stats.totals.PA > 0 ? <div className="dashboard-metrics home-season-stats">
        <dl className="home-stat-row home-stat-row--rates" aria-label="Team tournament on-base rates">
          <div className="home-stat"><dt>OBP</dt><dd><strong>{formatBaseballRate(stats.rates.OBP)}</strong></dd></div>
          <div className="home-stat"><dt>Reach Base %</dt><dd><strong>{formatBaseballRate(stats.rates.Reach)}</strong></dd></div>
        </dl>
        <dl className="home-stat-row home-stat-row--counts" aria-label="Team tournament totals">
          {[
            { label: "Hits", value: stats.totals.H },
            { label: "RBIs", value: stats.totals.RBI },
            { label: "HRs", value: stats.totals.HR },
            { label: "BEVs", value: stats.totals.board },
          ].map(stat => <div className="home-stat" key={stat.label}>
            <dt title={stat.label === "BEVs" ? "Beverages" : undefined}>{stat.label}</dt>
            <dd><strong data-credit={stat.label === "BEVs" && stat.value < 0}>{stat.value}</strong></dd>
          </div>)}
        </dl>
        <dl className="tournament-bev-activity" aria-label="Tournament beverage activity">
          <div><dt>BEVs owed</dt><dd>{stats.beverageActivity?.owed ?? "—"}</dd></div>
          <div><dt>BEV credits</dt><dd data-credit={!!stats.beverageActivity?.earned}>{stats.beverageActivity ? -stats.beverageActivity.earned || 0 : "—"}</dd></div>
        </dl>
        <p className="micro">Positive = owed · negative = in credit.</p>
        {!stats.beverageActivity && <p className="micro">Credit and owed activity is unavailable from the recorded plays.</p>}
      </div> : <p>{individual ? "No recorded plate appearances in this tournament." : "No recorded tournament plate appearances this season."}</p>}
    </section>
    {stats.players.length > 0 && <PlayerLeaderboard key={`${team}:${season}:${tournamentId ?? "overall"}`} players={stats.players}
      title="Player leaders" scopeLabel={scope} regionLabel={individual ? "Tournament player leaderboard" : "Overall tournament player leaderboard"} />}
  </section>;
}
