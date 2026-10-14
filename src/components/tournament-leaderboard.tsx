"use client";
import { useState } from "react";
import {
  rankTournamentPlayers,
  type TournamentPlayer,
  type LeaderboardMetric,
} from "@/lib/tournament-leaderboard";
export function TournamentLeaderboard({
  players,
}: {
  players: TournamentPlayer[];
}) {
  const [metric, setMetric] = useState<LeaderboardMetric>("H");
  const labels = { H: "Hits", HR: "HR", RBI: "RBI", board: "Beverage" };
  const rows = rankTournamentPlayers(players, metric);
  return (
    <section
      className="tournament-leaderboard"
      aria-label="Tournament player leaderboard"
    >
      <h2>Player leaderboard</h2>
      <div
        className="leaderboard-metrics"
        role="group"
        aria-label="Rank players by"
      >
        {(["H", "HR", "RBI", "board"] as LeaderboardMetric[]).map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={metric === key}
            onClick={() => setMetric(key)}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      <p className="micro">
        This tournament only ·{" "}
        {metric === "board"
          ? "Most owed first · Net balance includes credits"
          : `Ranked by ${labels[metric]}`}{" "}
        · Ties share a rank
      </p>
      {!rows.length ? (
        <p>No recorded plate appearances in this tournament yet.</p>
      ) : (
        <ol className="leaderboard-players">
          {rows.map((row) => (
            <li key={row.id}>
              <span
                className="leaderboard-rank"
                aria-label={`Rank ${row.rank}`}
              >
                {row.rank}
              </span>
              <div className="leaderboard-player">
                <strong>{row.name}</strong>
                <span className="micro">
                  {row.totals.PA} PA · OBP{" "}
                  {row.rates.OBP == null ? "—" : row.rates.OBP.toFixed(3)}
                </span>
              </div>
              <div className="leaderboard-counts">
                <span>
                  <strong>{row.totals.H}</strong>Hits
                </span>
                <span>
                  <strong>{row.totals.HR}</strong>HR
                </span>
                <span>
                  <strong>{row.totals.RBI}</strong>RBI
                </span>
                <span
                  className="leaderboard-beverage"
                  data-credit={row.totals.board < 0}
                  aria-label={`Beverage: ${row.totals.board < 0 ? `${Math.abs(row.totals.board)} in credit` : row.totals.board > 0 ? `${row.totals.board} owed` : "Even"}`}
                >
                  <strong>{Math.abs(row.totals.board)}</strong>Beverage
                  <small>
                    {row.totals.board < 0
                      ? "in credit"
                      : row.totals.board > 0
                        ? "owed"
                        : "Even"}
                  </small>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
