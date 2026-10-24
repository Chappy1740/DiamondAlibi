import Link from "next/link";
import { connectedScoreboard } from "@/lib/game-scoreboard";
import type { ConnectedGame } from "@/lib/scorebook-view";

// Present the saved scoreboard, never infer runs from batting statistics.
export function CompactGameList({ games, gameHref }: {
  games: ConnectedGame[];
  gameHref: (id: string) => string;
}) {
  return <>
    {games.length > 0 && <p className="game-score-key">Your team’s score first.</p>}
    <ul className="game-entry-list" aria-label="Games">
    {games.map((g) => {
      const score = connectedScoreboard(g.game);
      return <li className="card game-entry-row" key={g.game.id}>
        <div className="game-entry-details">
          <span className={`game-entry-status${g.game.completed ? "" : " game-entry-status--live"}`}>{g.game.completed ? "Final" : "Live"}</span>
          <p><strong>{g.game.opponent}</strong>{" — "}
          <span aria-label={score ? `Score: our team ${score.teamRuns}, opponent ${score.opponentRuns}` : "Score unavailable"}>
            {score ? `${score.teamRuns}–${score.opponentRuns}` : "Score unavailable"}
          </span>
          </p>
        </div>
        <Link className="button primary" href={gameHref(g.game.id)} aria-label={`Enter game against ${g.game.opponent}, ${g.playedOn}${g.game.completed ? ", final" : ", active"}`}>Enter</Link>
      </li>;
    })}
    </ul>
  </>;
}
