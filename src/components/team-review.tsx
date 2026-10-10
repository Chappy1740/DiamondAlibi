"use client";
import { useState } from "react";
export function TeamReview() {
  const [mode, setMode] = useState<"history" | "scoring">("history");
  return (
    <main className="team-review">
      <header>
        <p className="eyebrow">Diamond Alibi · Team preview</p>
        <h1>Try the phone experience</h1>
        <p>
          12 sample players · four 16-game league seasons · seven tournaments.
        </p>
        <nav aria-label="Team review modes">
          <button
            className="button secondary"
            aria-pressed={mode === "history"}
            onClick={() => setMode("history")}
          >
            Sample history
          </button>
          <button
            className="button secondary"
            aria-pressed={mode === "scoring"}
            onClick={() => setMode("scoring")}
          >
            Test scoring
          </button>
        </nav>
        <p className="micro" role="status">
          {mode === "history"
            ? "Explore the shared sample history. These examples are read-only."
            : "Your own practice scorebook. Changes stay in this browser and do not sync with teammates or affect real games."}
        </p>
      </header>
      <iframe
        key={mode}
        title={
          mode === "history" ? "Phone sample history" : "Phone scoring practice"
        }
        src={mode === "history" ? "/review/history" : "/review/scoring"}
      />
    </main>
  );
}
