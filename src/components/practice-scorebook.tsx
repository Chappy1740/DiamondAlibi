"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createScorebook,
  applyCommand,
  evaluateGame,
  aggregate,
  rates,
  DEFAULT_BOARD,
  OUTCOMES,
  type Scorebook,
  type Request,
  type Command,
  type Outcome,
  type Rules,
  type Scope,
} from "@/lib/scoring";

const KEY = "diamond-alibi.practice.v1";
const roster = [
  { id: "demo-a", name: "Alex (sample)" },
  { id: "demo-b", name: "Morgan (sample)" },
  { id: "demo-c", name: "Casey (sample guest)" },
];
type Journal = {
  format: 1;
  initial: Parameters<typeof createScorebook>[0];
  requests: Request[];
};
function replay(journal: Journal) {
  if (
    journal.format !== 1 ||
    !Array.isArray(journal.requests) ||
    journal.requests.length > 1000
  )
    throw new Error("Unrecognized saved scorebook.");
  if (
    journal.initial.teamId !== "practice-team" ||
    journal.initial.seasonId !== "practice-season" ||
    JSON.stringify(journal.initial.players) !== JSON.stringify(roster)
  )
    throw new Error("Only the synthetic practice roster can be restored here.");
  let b = createScorebook(journal.initial);
  for (const r of journal.requests) b = applyCommand(b, r);
  return b;
}
const rate = (value: number | null) =>
  value === null ? "—" : value.toFixed(3);
export function PracticeScorebook() {
  const [journal, setJournal] = useState<Journal | null>(null),
    [book, setBook] = useState<Scorebook | null>(null),
    [ready, setReady] = useState(false),
    [recovery, setRecovery] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [online, setOnline] = useState(true);
  const [gameId, setGameId] = useState(""),
    [scope, setScope] = useState<Scope>("Overall"),
    [lineup, setLineup] = useState(roster.map((p) => p.id)),
    [bands, setBands] = useState<string[]>([]),
    [actor, setActor] = useState(roster[0].name);
  const [outcome, setOutcome] = useState<Outcome>("Hit"),
    [runs, setRuns] = useState(0),
    [rbi, setRbi] = useState(0),
    [editId, setEditId] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const j = JSON.parse(saved) as Journal,
          b = replay(j);
        setJournal(j);
        setBook(b);
        setGameId(b.games.at(-1)?.id ?? "");
        setBands(b.bands);
      }
    } catch {
      setRecovery(true);
      setError(
        "The saved practice scorebook could not be read. It has been preserved. Clear it to start over.",
      );
    } finally {
      setReady(true);
    }
    setOnline(navigator.onLine);
    const yes = () => setOnline(true),
      no = () => setOnline(false);
    window.addEventListener("online", yes);
    window.addEventListener("offline", no);
    return () => {
      window.removeEventListener("online", yes);
      window.removeEventListener("offline", no);
    };
  }, []);
  const game = book?.games.find((g) => g.id === gameId),
    evaluation = game && book ? evaluateGame(game, book.bands) : null;
  function save(j: Journal, b: Scorebook) {
    localStorage.setItem(KEY, JSON.stringify(j));
    setJournal(j);
    setBook(b);
    setError("");
  }
  function send(command: Command) {
    if (!book || !journal) return false;
    try {
      if (!online)
        throw new Error(
          "Scoring is paused while offline. Reconnect before changing the practice scorebook.",
        );
      if (localStorage.getItem(KEY) !== JSON.stringify(journal))
        throw new Error(
          "Another tab changed this practice scorebook. Reload to review it before continuing.",
        );
      if (journal.requests.length >= 1000)
        throw new Error(
          "Practice journal is full. Start a fresh practice session.",
        );
      const request: Request = {
        commandId: crypto.randomUUID(),
        expectedRevision: book.revision,
        actor,
        at: new Date().toISOString(),
        command,
      };
      const next = applyCommand(book, request);
      save({ ...journal, requests: [...journal.requests, request] }, next);
      setNotice(`Saved locally · revision ${next.revision}`);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your previous scorebook is preserved.",
      );
      return false;
    }
  }
  function setup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const data = new FormData(e.currentTarget);
      const initial = {
        teamId: "practice-team",
        seasonId: "practice-season",
        dayId: crypto.randomUUID(),
        players: roster,
        bands,
        rules: {
          version: crypto.randomUUID(),
          fenceLimit: Number(data.get("limit")),
          board: { ...DEFAULT_BOARD },
        },
      };
      const b = createScorebook(initial);
      save({ format: 1, initial, requests: [] }, b);
      setNotice("Practice game day created. Nothing was sent to Supabase.");
    } catch {
      setError(
        "Could not create or save this practice scorebook. Check the limit and browser storage.",
      );
    }
  }
  function chooseOutcome(value: Outcome) {
    setOutcome(value);
    setRuns(value.includes("HR") ? 1 : 0);
    setRbi(value.includes("HR") ? 1 : 0);
  }
  function toggle(
    id: string,
    selected: string[],
    set: (ids: string[]) => void,
  ) {
    set(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }
  return (
    <div className="club-page practice-page">
      <a className="skip-link" href="#practice-main">
        Skip to scorebook
      </a>
      <header className="club-header">
        <Link href="/">Diamond Alibi</Link>
        <Link href="/club">My clubhouse</Link>
      </header>
      <main id="practice-main">
        <p className="eyebrow">Local development · synthetic players only</p>
        <h1>Practice scorebook</h1>
        <p>
          Try the scoring workflow here. This game day stays in this browser. It
          does not score real games or sync between people. League, Tournament
          and Overall below cover this practice game day only.
        </p>
        <p>
          No default fence limit or balance carryover is assumed. Band
          selections here demonstrate manual setup; the original assignment
          method still needs your review.
        </p>
        {!online && (
          <p role="status" className="form-error">
            Offline: changes are paused. Your last saved practice scorebook
            remains available.
          </p>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {!ready ? (
          <p>Loading saved practice…</p>
        ) : recovery ? (
          <p>
            Use Clear practice scorebook below to remove the unreadable local
            practice data.
          </p>
        ) : !book ? (
          <section className="club-card">
            <h2>Set up a practice game day</h2>
            <form onSubmit={setup}>
              <label>
                Fence HR limit for this practice day
                <input
                  name="limit"
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Choose explicitly"
                />
              </label>
              <fieldset>
                <legend>Game-day HR Bands (multiple or none)</legend>
                {roster.map((p) => (
                  <label key={p.id} className="check-label">
                    <input
                      type="checkbox"
                      checked={bands.includes(p.id)}
                      onChange={() => toggle(p.id, bands, setBands)}
                    />
                    {p.name}
                  </label>
                ))}
              </fieldset>
              <button className="primary-button" disabled={!online}>
                Create practice day
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="club-card">
              <h2>Game day</h2>
              <label>
                Acting sample team member
                <select
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                >
                  {roster.slice(0, 2).map((p) => (
                    <option key={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <p>
                Both members have the same scoring and correction controls. No
                captain tag is needed. Guest participation does not grant
                account access.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget),
                    id = crypto.randomUUID();
                  const saved = send({
                    type: "start",
                    gameId: id,
                    opponent: String(d.get("opponent")),
                    kind: d.get("kind") as "League" | "Tournament",
                    lineup,
                  });
                  if (saved) {
                    setGameId(id);
                    setEditId("");
                  }
                }}
              >
                <label>
                  Opponent
                  <input name="opponent" required maxLength={80} />
                </label>
                <label>
                  Game classification
                  <select name="kind">
                    <option>League</option>
                    <option>Tournament</option>
                  </select>
                </label>
                <fieldset>
                  <legend>Lineup selection</legend>
                  {roster.map((p) => (
                    <label className="check-label" key={p.id}>
                      <input
                        type="checkbox"
                        checked={lineup.includes(p.id)}
                        onChange={() => toggle(p.id, lineup, setLineup)}
                      />
                      {p.name}
                    </label>
                  ))}
                </fieldset>
                <ol>
                  {lineup.map((id, i) => (
                    <li key={id}>
                      {roster.find((p) => p.id === id)?.name}{" "}
                      <button
                        type="button"
                        disabled={i === 0}
                        aria-label={`Move ${roster.find((p) => p.id === id)?.name} up`}
                        onClick={() => {
                          const next = [...lineup];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          setLineup(next);
                        }}
                      >
                        Move up
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  className="primary-button"
                  disabled={!online || lineup.length === 0}
                >
                  Start game
                </button>
                {game && !game.complete && (
                  <button
                    type="button"
                    disabled={!online || lineup.length === 0}
                    onClick={() =>
                      send({ type: "lineup", gameId: game.id, lineup })
                    }
                  >
                    Apply lineup to selected game
                  </button>
                )}
              </form>
              {book.games.length > 0 && (
                <label>
                  Selected game
                  <select
                    value={gameId}
                    onChange={(e) => {
                      setGameId(e.target.value);
                      setEditId("");
                    }}
                  >
                    {book.games.map((g, i) => (
                      <option key={g.id} value={g.id}>
                        Game {i + 1} vs {g.opponent} · {g.kind}
                        {g.complete ? " · Complete" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>
            {game && evaluation && (
              <section className="club-card">
                <h2>Score vs {game.opponent}</h2>
                <p>
                  {game.complete
                    ? "Complete · audited corrections remain available"
                    : "Live practice"}{" "}
                  · Fence HRs {evaluation.fenceUsed}/{game.rules.fenceLimit} ·
                  Rules {game.rules.version.slice(0, 8)} (frozen for this game)
                </p>
                <p>
                  Runs recorded:{" "}
                  {Object.values(evaluation.totals).reduce(
                    (sum, t) => sum + t.runs,
                    0,
                  )}
                  . Opponent scoring and inning automation are not included in
                  this practice workflow.
                </p>
                {!game.complete && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send({
                        type: "score",
                        gameId: game.id,
                        playId: crypto.randomUUID(),
                        playerId: game.lineup[game.next],
                        outcome,
                        runs,
                        rbi,
                      });
                    }}
                  >
                    <label>
                      Next batter / manual override
                      <select
                        value={game.lineup[game.next]}
                        onChange={(e) =>
                          send({
                            type: "batter",
                            gameId: game.id,
                            playerId: e.target.value,
                          })
                        }
                        disabled={!online}
                      >
                        {game.lineup.map((id) => (
                          <option key={id} value={id}>
                            {roster.find((p) => p.id === id)?.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Batting outcome
                      <select
                        value={outcome}
                        aria-label="Batting outcome"
                        onChange={(e) =>
                          chooseOutcome(e.target.value as Outcome)
                        }
                      >
                        {OUTCOMES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                    <div className="club-grid">
                      <label>
                        Runs on this play
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={runs}
                          onChange={(e) => setRuns(Number(e.target.value))}
                        />
                      </label>
                      <label>
                        RBI on this play
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={rbi}
                          onChange={(e) => setRbi(Number(e.target.value))}
                        />
                      </label>
                    </div>
                    {outcome === "Fence HR" &&
                      evaluation.fenceUsed >= game.rules.fenceLimit && (
                        <p>
                          Fence allowance is used. This records an OLHR out with
                          no hit, HR, runs or RBI and the configured over-limit
                          board adjustment.
                        </p>
                      )}
                    <button className="primary-button" disabled={!online}>
                      Record outcome
                    </button>
                    <button
                      type="button"
                      disabled={!online}
                      onClick={() =>
                        send({ type: "complete", gameId: game.id })
                      }
                    >
                      Complete game
                    </button>
                  </form>
                )}
                <ol className="play-history">
                  {evaluation.rows.map((p, i) => (
                    <li key={p.id}>
                      {i + 1}. {roster.find((r) => r.id === p.playerId)?.name}:{" "}
                      {p.official} · Board {p.delta > 0 ? "+" : ""}
                      {p.delta}
                      <button type="button" onClick={() => setEditId(p.id)}>
                        Correct play {i + 1}
                      </button>
                    </li>
                  ))}
                </ol>
                {editId && game.plays.some((p) => p.id === editId) && (
                  <form
                    key={editId}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const d = new FormData(e.currentTarget);
                      send({
                        type: "correct",
                        gameId: game.id,
                        playId: editId,
                        playerId: String(d.get("player")),
                        outcome: d.get("outcome") as Outcome,
                        runs: Number(d.get("runs")),
                        rbi: Number(d.get("rbi")),
                        voided: d.has("voided"),
                        reason: String(d.get("reason")),
                      });
                    }}
                  >
                    <h3>Audited correction</h3>
                    <p>
                      All later plays in this game are recalculated, including
                      which fence HR becomes over-limit. The original game rules
                      stay in force.
                    </p>
                    <label>
                      Corrected batter
                      <select
                        name="player"
                        defaultValue={
                          game.plays.find((p) => p.id === editId)!.playerId
                        }
                      >
                        {roster.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Corrected outcome
                      <select
                        name="outcome"
                        defaultValue={
                          game.plays.find((p) => p.id === editId)!.outcome
                        }
                      >
                        {OUTCOMES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Corrected runs
                      <input
                        name="runs"
                        type="number"
                        min="0"
                        max="4"
                        defaultValue={
                          game.plays.find((p) => p.id === editId)!.runs
                        }
                      />
                    </label>
                    <label>
                      Corrected RBI
                      <input
                        name="rbi"
                        type="number"
                        min="0"
                        max="4"
                        defaultValue={
                          game.plays.find((p) => p.id === editId)!.rbi
                        }
                      />
                    </label>
                    <label className="check-label">
                      <input
                        name="voided"
                        type="checkbox"
                        defaultChecked={
                          game.plays.find((p) => p.id === editId)!.voided
                        }
                      />
                      Void this play (retain history)
                    </label>
                    <label>
                      Correction reason
                      <input name="reason" required maxLength={200} />
                    </label>
                    <button className="primary-button" disabled={!online}>
                      Save correction
                    </button>
                  </form>
                )}
              </section>
            )}
            <section className="club-card">
              <h2>Statistics and Beverage Board</h2>
              <label>
                Practice statistics scope
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as Scope)}
                >
                  <option>League</option>
                  <option>Tournament</option>
                  <option>Overall</option>
                </select>
              </label>
              <p>
                Positive board values are owed; negative values are credits.
                Totals cover this game day only. No seasonal settlement,
                carryover or leaderboard ranking policy is assumed.
              </p>
              <div
                className="table-scroll"
                role="region"
                aria-label="Practice statistics"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      {[
                        "Player",
                        "PA",
                        "AB",
                        "H",
                        "HR",
                        "RBI",
                        "AVG",
                        "OBP",
                        "Reach",
                        "Board",
                      ].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(aggregate(book, scope)).map(([id, t]) => {
                      const r = rates(t);
                      return (
                        <tr key={id}>
                          <th scope="row">
                            {roster.find((p) => p.id === id)?.name}
                          </th>
                          <td>{t.PA}</td>
                          <td>{t.AB}</td>
                          <td>{t.H}</td>
                          <td>{t.HR}</td>
                          <td>{t.RBI}</td>
                          <td>{rate(r.AVG)}</td>
                          <td>{rate(r.OBP)}</td>
                          <td>{rate(r.Reach)}</td>
                          <td>
                            {t.board > 0 ? "+" : ""}
                            {t.board}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="club-card">
              <h2>Game-day Bands and future rules</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  send({
                    type: "bands",
                    players: bands,
                    reason: String(d.get("reason") ?? ""),
                  });
                }}
              >
                <fieldset>
                  <legend>Assigned HR Bands for the whole game day</legend>
                  {roster.map((p) => (
                    <label key={p.id} className="check-label">
                      <input
                        type="checkbox"
                        checked={bands.includes(p.id)}
                        onChange={() => toggle(p.id, bands, setBands)}
                      />
                      {p.name}
                    </label>
                  ))}
                </fieldset>
                <label>
                  Band correction reason (required after any play)
                  <input
                    name="reason"
                    maxLength={200}
                    required={book.games.some((g) => g.plays.length > 0)}
                  />
                </label>
                <button disabled={!online}>Save game-day Bands</button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget),
                    boardRules = { ...DEFAULT_BOARD };
                  for (const key of Object.keys(
                    boardRules,
                  ) as (keyof typeof DEFAULT_BOARD)[])
                    boardRules[key] = Number(d.get(key));
                  const rules: Rules = {
                    version: crypto.randomUUID(),
                    fenceLimit: Number(d.get("limit")),
                    board: boardRules,
                  };
                  send({ type: "rules", rules });
                }}
              >
                <h3>Rules for games started later</h3>
                <p>
                  Changing these values does not rewrite existing games.
                  Negative adjustments create credits.
                </p>
                <label>
                  Future fence HR limit
                  <input
                    name="limit"
                    type="number"
                    min="0"
                    max="100"
                    required
                    defaultValue={book.rules.fenceLimit}
                  />
                </label>
                {(
                  Object.keys(DEFAULT_BOARD) as (keyof typeof DEFAULT_BOARD)[]
                ).map((key) => (
                  <label key={key}>
                    {
                      {
                        strikeout: "Strikeout",
                        solo: "Solo fence HR without Band",
                        bandSolo: "Solo fence HR with Band",
                        grandSlam: "Grand slam",
                        overLimit: "Over-limit fence HR",
                        insidePark: "Inside-the-park HR",
                        multiRun: "Two/three-run fence HR",
                      }[key]
                    }{" "}
                    adjustment
                    <input
                      name={key}
                      type="number"
                      min="-100"
                      max="100"
                      required
                      defaultValue={book.rules.board[key]}
                    />
                  </label>
                ))}
                <button disabled={!online}>Save new rule version</button>
              </form>
            </section>
            <section className="club-card">
              <h2>Audit history</h2>
              <ol>
                {book.audit.map((a) => (
                  <li key={a.commandId}>
                    Revision {a.revision} · {a.actor} · {a.action} ·{" "}
                    {new Date(a.at).toLocaleTimeString()}
                    {a.reason ? ` · ${a.reason}` : ""}
                  </li>
                ))}
              </ol>
              <p>
                Full command payloads are retained in this local practice
                journal. This browser history is not a tamper-proof server
                audit.
              </p>
            </section>
          </>
        )}
        {ready && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Clear only this browser's synthetic practice scorebook?",
                )
              ) {
                try {
                  localStorage.removeItem(KEY);
                  setRecovery(false);
                  setBook(null);
                  setJournal(null);
                  setGameId("");
                  setBands([]);
                  setError("");
                  setNotice("Practice scorebook cleared.");
                } catch {
                  setError("Browser storage could not be cleared.");
                }
              }
            }}
          >
            Clear practice scorebook
          </button>
        )}
      </main>
    </div>
  );
}
