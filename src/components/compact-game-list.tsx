import Link from "next/link";
import { connectedScoreboard } from "@/lib/game-scoreboard";
import type { ConnectedGame } from "@/lib/scorebook-view";
import { tournamentStartLabel, type TournamentStartTime } from "@/lib/tournament-start-time";

// Present the saved scoreboard, never infer runs from batting statistics.
export function CompactGameList({ games, gameHref, firstGameStart }: {
  games: ConnectedGame[];
  gameHref: (id: string) => string;
  firstGameStart?: TournamentStartTime;
}) {
  return <>
    {games.length > 0 && <p className="game-score-key">Your team’s score first.</p>}
    <ul className="game-entry-list" aria-label="Games">
    {games.map((g) => {
      const score = connectedScoreboard(g.game);
      const start = g.game.kind === "Tournament" && g.game.tournament_game_number === 1 && firstGameStart ? tournamentStartLabel(firstGameStart) : null;
      return <li className="card game-entry-row" key={g.game.id}>
        <div className="game-entry-details">
          <span className={`game-entry-status${g.game.completed ? "" : " game-entry-status--live"}`}>{g.game.completed ? "Final" : "Live"}</span>
          <p className="game-entry-name"><strong>{g.game.opponent}</strong></p>
          {start && <p className="micro">Game 1 · {g.playedOn} · {start}</p>}
          <p className="game-entry-score" aria-label={score ? `Score: our team ${score.teamRuns}, opponent ${score.opponentRuns}` : "Score unavailable"}>
            {score ? `${score.teamRuns}–${score.opponentRuns}` : "Score unavailable"}
          </p>
        </div>
        <Link className="button primary" href={gameHref(g.game.id)} aria-label={`Enter game against ${g.game.opponent}, ${g.playedOn}${g.game.completed ? ", final" : ", active"}`}>Enter</Link>
      </li>;
    })}
    </ul>
  </>;
}
