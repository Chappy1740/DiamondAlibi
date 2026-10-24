import { formatBaseballRate } from "@/lib/baseball-rate";
import { competitionStats } from "@/lib/tournament-leaderboard";
import type { CompetitionKind } from "@/lib/competitions";
import type { LoadedScorebook } from "@/lib/scorebook-view";
import { PlayerLeaderboard } from "./tournament-leaderboard";

type SeasonStatsProps = { data: LoadedScorebook; team: string; season: string; seasonName: string };

export function TournamentSeasonStats({ tournamentId, tournamentName, ...props }: SeasonStatsProps & { tournamentId?: string; tournamentName?: string }) {
  return <CompetitionSeasonStats {...props} kind="Tournament" competitionId={tournamentId} competitionName={tournamentName} />;
}

export function LeagueSeasonStats({ leagueId, leagueName, ...props }: SeasonStatsProps & { leagueId?: string; leagueName?: string }) {
  return <CompetitionSeasonStats {...props} kind="League" competitionId={leagueId} competitionName={leagueName} />;
}

function CompetitionSeasonStats({ data, team, season, seasonName, kind, competitionId, competitionName }: SeasonStatsProps & {
  kind: CompetitionKind; competitionId?: string; competitionName?: string;
}) {
  const individual = competitionId !== undefined;
  const noun = kind.toLowerCase();
  const plural = kind === "League" ? "leagues" : "tournaments";
  const stats = competitionStats(data, team, season, kind, competitionId);
  if (!stats) return null;
  const scope = individual ? `${competitionName ?? `Selected ${noun}`} · ${seasonName} · This ${noun} only` : `All ${plural} · ${seasonName} · ${kind} games only`;
  return <section className={`tournament-season-stats${kind === "League" ? " league-season-stats" : ""}`} aria-label={individual ? `${kind} statistics` : `Overall ${noun} statistics`}>
    <section className="card detail-card home-season-card tournament-team-summary" aria-label={`${kind} team totals`}>
      <h2>{individual ? `${kind} stats` : `Overall ${noun} stats`}</h2>
      <p className="micro">{scope}</p>
      {stats.totals.PA > 0 ? <div className="dashboard-metrics home-season-stats">
        <dl className="home-stat-row home-stat-row--rates" aria-label={`Team ${noun} on-base rates`}>
          <div className="home-stat"><dt>OBP</dt><dd><strong>{formatBaseballRate(stats.rates.OBP)}</strong></dd></div>
          <div className="home-stat"><dt>Reach Base %</dt><dd><strong>{formatBaseballRate(stats.rates.Reach)}</strong></dd></div>
        </dl>
        <dl className="home-stat-row home-stat-row--counts" aria-label={`Team ${noun} totals`}>
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
        <dl className="tournament-bev-activity" aria-label={`${kind} beverage activity`}>
          <div><dt>BEVs owed</dt><dd>{stats.beverageActivity?.owed ?? "—"}</dd></div>
          <div><dt>BEV credits</dt><dd data-credit={!!stats.beverageActivity?.earned}>{stats.beverageActivity ? -stats.beverageActivity.earned || 0 : "—"}</dd></div>
        </dl>
        <p className="micro">Positive = owed · negative = in credit.</p>
        {!stats.beverageActivity && <p className="micro">Credit and owed activity is unavailable from the recorded plays.</p>}
      </div> : <p>{individual ? `No recorded plate appearances in this ${noun}.` : `No recorded ${noun} plate appearances this season.`}</p>}
    </section>
    {stats.players.length > 0 && <PlayerLeaderboard key={`${kind}:${team}:${season}:${competitionId ?? "overall"}`} players={stats.players}
      title="Player leaders" scopeLabel={scope} regionLabel={individual ? `${kind} player leaderboard` : `Overall ${noun} player leaderboard`} />}
  </section>;
}
