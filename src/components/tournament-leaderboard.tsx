"use client";
import { useEffect, useRef, useState } from "react";
import { formatBaseballRate } from "@/lib/baseball-rate";
import {
  rankTournamentPlayers,
  leaderboardValue,
  type TournamentPlayer,
  type LeaderboardMetric,
} from "@/lib/tournament-leaderboard";
const metrics: LeaderboardMetric[] = ["OBP", "H", "2B", "3B", "HR", "RBI", "board", "SO", "DP"];
const labels = {
  OBP: "OBP%",
  H: "Hits",
  "2B": "Doubles", "3B": "Triples",
  HR: "HR",
  RBI: "RBI",
  board: "Beverages",
  SO: "SO", DP: "Hit into double play",
};
const badges = { OBP: "OBP", H: "H", "2B": "2B", "3B": "3B", HR: "HR", RBI: "RBI", board: "BEV", SO: "SO", DP: "DP" };
function MetricValue({
  row,
  metric,
  showLabel = true,
}: {
  row: TournamentPlayer;
  metric: LeaderboardMetric;
  showLabel?: boolean;
}) {
  return metric === "board" ? (
    <span
      className="leaderboard-beverage"
      data-credit={row.totals.board < 0}
      aria-label={`Beverage: ${row.totals.board < 0 ? `${Math.abs(row.totals.board)} in credit` : row.totals.board > 0 ? `${row.totals.board} owed` : "Even"}`}
    >
      <strong>{row.totals.board}</strong>
      {showLabel && labels[metric]}
      <small>
        {row.totals.board < 0
          ? "in credit"
          : row.totals.board > 0
            ? "owed"
            : "Even"}
      </small>
    </span>
  ) : (
    <span>
      <strong>
        {metric === "OBP"
          ? formatBaseballRate(row.rates.OBP)
          : (leaderboardValue(row, metric) ?? "—")}
      </strong>
      {showLabel && labels[metric]}
    </span>
  );
}
export function PlayerLeaderboard({
  players,
  scopeLabel,
  title,
  regionLabel,
}: {
  players: TournamentPlayer[];
  scopeLabel: string;
  title: string;
  regionLabel: string;
}) {
  const [metric, setMetric] = useState<LeaderboardMetric | null>(null);
  const lastMetric = useRef<LeaderboardMetric | null>(null);
  const summaryButtons = useRef<
    Partial<Record<LeaderboardMetric, HTMLButtonElement | null>>
  >({});
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (metric) backButton.current?.focus();
    else if (lastMetric.current)
      summaryButtons.current[lastMetric.current]?.focus();
  }, [metric]);
  const rows = metric ? rankTournamentPlayers(players, metric) : [];
  return (
    <section className="tournament-leaderboard" aria-label={regionLabel}>
      <h2>{metric ? `${labels[metric]} rankings` : title}</h2>
      <p className="micro leaderboard-scope">{scopeLabel}</p>
      <p className="micro">SO includes looking, swinging, and SOFO strikeouts.</p>
      {players.some(row => leaderboardValue(row, "2B") == null || leaderboardValue(row, "3B") == null) && <p className="micro">Some older hits did not record a hit type. Unavailable doubles and triples show — and are unranked.</p>}
      {players.some(row => leaderboardValue(row, "DP") == null) && <p className="micro">Some older games did not record double plays. Unavailable DP counts show — and are unranked.</p>}
      {metric == null ? (
        <div
          className="leaderboard-summary"
          role="group"
          aria-label="Category leaders"
        >
          {metrics.map((key) => {
            const ranked = rankTournamentPlayers(players, key);
            const leaders = ranked.filter((row) => row.rank === 1);
            const leader = leaders[0];
            return (
              <button
                key={key}
                type="button"
                disabled={!leader}
                aria-label={`View ${labels[key]} rankings`}
                ref={(el) => {
                  summaryButtons.current[key] = el;
                }}
                onClick={() => {
                  lastMetric.current = key;
                  setMetric(key);
                }}
              >
                <span className="leaderboard-badge" aria-hidden="true">
                  {badges[key]}
                </span>
                <span className="leaderboard-player">
                  <strong>
                    {leaders.length > 1
                      ? `${leaders.length} tied`
                      : (leader?.name ?? "No recorded value")}
                  </strong>
                  <span className="micro">{labels[key]}</span>
                </span>
                <span className="leaderboard-counts">
                  {leader ? (
                    <MetricValue row={leader} metric={key} showLabel={false} />
                  ) : (
                    <span>—</span>
                  )}
                </span>
                <span className="leaderboard-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <button
            ref={backButton}
            type="button"
            className="leaderboard-back"
            onClick={() => setMetric(null)}
          >
            ← Back to leaders
          </button>
          <p className="micro">
            {metric === "board"
              ? "Most owed first · Highest BEVs leads"
              : "Highest to lowest"}{" "}
            · Ties share a rank
          </p>
          <ol className="leaderboard-players">
            {rows.map((row) => (
              <li key={row.id}>
                <span
                  className="leaderboard-rank"
                  aria-label={
                    row.rank == null ? "Unranked" : `Rank ${row.rank}`
                  }
                >
                  {row.rank ?? "—"}
                </span>
                <div className="leaderboard-player">
                  <strong>{row.name}</strong>
                </div>
                <div className="leaderboard-counts">
                  <MetricValue row={row} metric={metric} />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      {!players.length && (
        <p>No recorded plate appearances in this view yet.</p>
      )}
    </section>
  );
}
export function TournamentLeaderboard({
  players,
}: {
  players: TournamentPlayer[];
}) {
  return (
    <PlayerLeaderboard
      players={players}
      title="Player leaders"
      scopeLabel="This tournament only"
      regionLabel="Tournament player leaderboard"
    />
  );
}
