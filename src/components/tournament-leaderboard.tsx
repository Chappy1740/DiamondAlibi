"use client";
import { useState } from "react";
import { rankTournamentPlayers, type TournamentPlayer, type LeaderboardMetric } from "@/lib/tournament-leaderboard";
export function TournamentLeaderboard({ players }: { players: TournamentPlayer[] }) {
  const [metric, setMetric] = useState<LeaderboardMetric>("H");
  const labels = { H: "Hits", HR: "HR", RBI: "RBI" };
  const rows = rankTournamentPlayers(players, metric);
  return <section className="tournament-leaderboard" aria-label="Tournament player leaderboard">
    <h2>Player leaderboard</h2>
    <div className="leaderboard-metrics" role="group" aria-label="Rank players by">
      {(["H", "HR", "RBI"] as LeaderboardMetric[]).map(key => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{labels[key]}</button>)}
    </div>
    <p className="micro">This tournament only · Ranked by {labels[metric]} · Ties share a rank</p>
    {!rows.length ? <p>No recorded plate appearances in this tournament yet.</p> : <ol className="leaderboard-players">
      {rows.map(row => <li key={row.id}>
        <span className="leaderboard-rank" aria-label={`Rank ${row.rank}`}>{row.rank}</span>
        <div className="leaderboard-player"><strong>{row.name}</strong><span className="micro">{row.totals.PA} PA · OBP {row.rates.OBP == null ? "—" : row.rates.OBP.toFixed(3)}</span></div>
        <div className="leaderboard-counts"><span><strong>{row.totals.H}</strong>Hits</span><span><strong>{row.totals.HR}</strong>HR</span><span><strong>{row.totals.RBI}</strong>RBI</span></div>
      </li>)}
    </ol>}
  </section>;
}
