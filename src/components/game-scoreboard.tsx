"use client";
import type { GameScoreboard } from "@/lib/game-scoreboard";
export function GameScoreboardPanel({
  value,
  save,
  disabled = false,
}: {
  value: GameScoreboard | null;
  save?: (value: GameScoreboard & { reason: string }) => void;
  disabled?: boolean;
}) {
  return (
    <section className="game-scoreboard">
      <h3>Score and inning</h3>
      {value ? (
        <>
          <div className="dashboard-metrics">
            <span>
              Our team<strong>{value.teamRuns}</strong>
            </span>
            <span>
              Opponent<strong>{value.opponentRuns}</strong>
            </span>
            <span>
              {value.half}
              <strong>Inning {value.inning}</strong>
            </span>
          </div>
        </>
      ) : (
        <p>Score and inning have not been recorded.</p>
      )}
      {save && (
        <details>
          <summary>Update score and inning</summary>
          <p>
            Enter the confirmed scoreboard. This does not change individual
            plate appearances or beverage adjustments. Include a reason for the
            audit history.
          </p>
          <form
            className="club-form dashboard-context"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              save({
                teamRuns: Number(f.get("teamRuns")),
                opponentRuns: Number(f.get("opponentRuns")),
                inning: Number(f.get("inning")),
                half: f.get("half") as "Top" | "Bottom",
                reason: String(f.get("reason")).trim(),
              });
            }}
          >
            <label>
              Our team runs
              <input
                aria-label="Our team runs"
                name="teamRuns"
                type="number"
                min={0}
                max={999}
                step={1}
                required
                defaultValue={value?.teamRuns ?? ""}
              />
            </label>
            <label>
              Opponent runs
              <input
                aria-label="Opponent runs"
                name="opponentRuns"
                type="number"
                min={0}
                max={999}
                step={1}
                required
                defaultValue={value?.opponentRuns ?? ""}
              />
            </label>
            <label>
              Inning
              <input
                aria-label="Inning"
                name="inning"
                type="number"
                min={1}
                max={99}
                step={1}
                required
                defaultValue={value?.inning ?? ""}
              />
            </label>
            <label>
              Inning half
              <select
                aria-label="Inning half"
                name="half"
                required
                defaultValue={value?.half ?? ""}
              >
                <option value="" disabled>
                  Choose Top or Bottom
                </option>
                <option>Top</option>
                <option>Bottom</option>
              </select>
            </label>
            <label>
              Update reason
              <input
                aria-label="Scoreboard update reason"
                name="reason"
                required
                maxLength={200}
              />
            </label>
            <button className="button secondary" disabled={disabled}>
              Save scoreboard
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
