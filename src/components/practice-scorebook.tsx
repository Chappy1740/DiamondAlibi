"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createScorebook,
  applyCommand,
  evaluateGame,
  emptyTotals,
  rates,
  DEFAULT_BOARD,
  OUTCOMES,
  type Request,
  type Command,
  type Outcome,
  type Rules,
  type Scope,
} from "@/lib/scoring";
import {
  applySeasonCommand,
  replaySeasonJournal,
  createSeasonScorebook,
  seasonView,
  type SeasonJournal,
  type SeasonScorebook,
  type SeasonCommand,
} from "@/lib/season-scorebook";
import { seasonTotals, seasonBeverageBoard } from "@/lib/season-scoring";

const KEY = "diamond-alibi.practice.v2";
const LEGACY_KEY = "diamond-alibi.practice.v1";
const roster = [
  { id: "demo-a", name: "Alex (sample)" },
  { id: "demo-b", name: "Morgan (sample)" },
  { id: "demo-c", name: "Casey (sample guest)" },
];
type LegacyJournal = {
  format: 1;
  initial: Parameters<typeof createScorebook>[0];
  requests: Request[];
};
function replayLegacy(journal: LegacyJournal) {
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
  const [journal, setJournal] = useState<SeasonJournal | null>(null),
    [seasonBook, setSeasonBook] = useState<SeasonScorebook | null>(null),
    [seasonId, setSeasonId] = useState(""),
    [legacy, setLegacy] = useState(""),
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
  const [kind, setKind] = useState<"League" | "Tournament">("League"),
    [tournamentId, setTournamentId] = useState(""),
    [rulesTarget, setRulesTarget] = useState("league");
  const [outcome, setOutcome] = useState<Outcome>("Hit"),
    [runs, setRuns] = useState(0),
    [rbi, setRbi] = useState(0),
    [editId, setEditId] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const j = JSON.parse(saved) as SeasonJournal;
        if (
          j.initial.teamId !== "practice-team" ||
          JSON.stringify(j.initial.players) !== JSON.stringify(roster)
        )
          throw new Error("Synthetic roster only.");
        const b = replaySeasonJournal(j);
        setJournal(j);
        setSeasonBook(b);
        setSeasonId(b.seasons.at(-1)?.id ?? "");
        setGameId(b.seasons.at(-1)?.scoring.games.at(-1)?.game.id ?? "");
      }
    } catch {
      setRecovery(true);
      setError(
        "The saved season practice scorebook could not be read. It has been preserved. Clear it to start over.",
      );
    } finally {
      setReady(true);
    }
    try {
      const old = localStorage.getItem(LEGACY_KEY);
      if (old) {
        const b = replayLegacy(JSON.parse(old));
        setLegacy(
          `Earlier day journal preserved: ${b.games.length} games, ${b.revision} changes. It has not been imported because tournament and season assignments were not recorded.`,
        );
      }
    } catch {
      setLegacy(
        "Earlier day journal preserved. It could not be read; its original data has not been changed.",
      );
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
  const season = seasonBook?.seasons.find((s) => s.id === seasonId),
    book = seasonBook ? seasonView(seasonBook, seasonId, gameId) : null,
    game = book?.games.find((g) => g.id === gameId),
    evaluation = game && book ? evaluateGame(game, book.bands) : null;
  const selectedTournament = season?.tournaments.find(
      (t) => t.id === tournamentId,
    ),
    startingRules =
      kind === "Tournament" ? selectedTournament?.rules : season?.leagueRules,
    futureRules =
      rulesTarget === "league"
        ? season?.leagueRules
        : season?.tournaments.find((t) => t.id === rulesTarget)?.rules;
  const assigned =
    season?.scoring.bands.filter((b) => b.tournamentId === tournamentId) ?? [];
  const lineupMatchesGame =
    game?.kind === kind &&
    (kind === "League" ||
      season?.scoring.games.find((e) => e.game.id === gameId)?.tournamentId ===
        tournamentId);
  const scopedTotals = season ? seasonTotals(season.scoring, scope) : {};
  const beverageBoard = season ? seasonBeverageBoard(season.scoring) : {};
  const choices = Object.fromEntries(
    lineup
      .filter(
        (id) => kind === "League" || !assigned.some((b) => b.playerId === id),
      )
      .map((id) => [id, bands.includes(id)]),
  );
  function save(j: SeasonJournal, b: SeasonScorebook) {
    localStorage.setItem(KEY, JSON.stringify(j));
    setJournal(j);
    setSeasonBook(b);
    setError("");
  }
  function sendSeason(command: SeasonCommand) {
    if (!seasonBook || !journal) return false;
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
      const request = {
        commandId: crypto.randomUUID(),
        expectedRevision: seasonBook.revision,
        actor,
        at: new Date().toISOString(),
        command,
      };
      const next = applySeasonCommand(seasonBook, request);
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
  function send(command: Command) {
    if (command.type === "start" || command.type === "bands") return false;
    const gameTournament = season?.scoring.games.find(
      (e) => e.game.id === gameId,
    )?.tournamentId;
    const newcomers = lineup.filter(
      (id) =>
        !season?.scoring.bands.some(
          (b) => b.tournamentId === gameTournament && b.playerId === id,
        ),
    );
    return sendSeason(
      command.type === "rules"
        ? {
            type: "rules",
            seasonId,
            ...(rulesTarget !== "league" ? { tournamentId: rulesTarget } : {}),
            rules: command.rules,
          }
        : {
            type: "game",
            seasonId,
            change: command,
            ...(command.type === "lineup" && gameTournament
              ? {
                  firstGameBands: Object.fromEntries(
                    newcomers.map((id) => [id, bands.includes(id)]),
                  ),
                }
              : {}),
          },
    );
  }
  function setup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const data = new FormData(e.currentTarget);
      const id = crypto.randomUUID();
      const command: SeasonCommand = {
        type: "season",
        seasonId: id,
        name: String(data.get("season")),
        rules: {
          version: crypto.randomUUID(),
          fenceLimit: Number(data.get("limit")),
          board: { ...DEFAULT_BOARD },
        },
      };
      if (seasonBook) {
        if (!sendSeason(command)) return;
      } else {
        if (localStorage.getItem(KEY) !== null)
          throw new Error("Another tab created practice. Reload first.");
        if (!online) throw new Error("Reconnect before setup.");
        const initial = { teamId: "practice-team", players: roster };
        const request = {
          commandId: crypto.randomUUID(),
          expectedRevision: 0,
          actor,
          at: new Date().toISOString(),
          command,
        };
        save(
          { format: 2, initial, requests: [request] },
          applySeasonCommand(
            createSeasonScorebook(initial.teamId, initial.players),
            request,
          ),
        );
      }
      setSeasonId(id);
      setGameId("");
      setTournamentId("");
      setRulesTarget("league");
      setBands([]);
      setNotice(
        "New practice season created with a fresh Beverage Board. Earlier seasons remain available.",
      );
    } catch {
      setError(
        "Could not create or save this practice season. Check the name, limit and browser storage; reload if another tab changed it.",
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
        <p className="eyebrow">Practice · synthetic players only</p>
        <h1>Practice scorebook</h1>
        <p>
          Try the scoring workflow here. These seasons stay in this browser. It
          does not score real games or sync between people. League, Tournament
          and Overall below cover the selected practice season.
        </p>
        <p>
          Choose HR limits explicitly, including zero. Tournament Bands are
          assigned at each player's first game and retained across tournament
          dates. The Beverage Board combines league and tournament play for the
          season.
        </p>
        {legacy && (
          <section className="club-card">
            <h2>Earlier practice data</h2>
            <p>{legacy}</p>
          </section>
        )}
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
            <h2>Set up a practice season</h2>
            <form onSubmit={setup}>
              <label>
                Season name
                <input
                  name="season"
                  required
                  maxLength={80}
                  placeholder="Sample fall season"
                />
              </label>
              <label>
                League fence HR limit
                <input
                  name="limit"
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Choose explicitly"
                />
              </label>
              <button className="primary-button" disabled={!online}>
                Create practice season
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="club-card">
              <h2>Season and game setup</h2>
              <label>
                Selected season
                <select
                  value={seasonId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSeasonId(id);
                    setGameId(
                      seasonBook?.seasons
                        .find((s) => s.id === id)
                        ?.scoring.games.at(-1)?.game.id ?? "",
                    );
                    setTournamentId("");
                    setRulesTarget("league");
                    setEditId("");
                    setBands([]);
                  }}
                >
                  {seasonBook?.seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <details>
                <summary>Start another practice season</summary>
                <form onSubmit={setup}>
                  <label>
                    New season name
                    <input name="season" required maxLength={80} />
                  </label>
                  <label>
                    New season league fence HR limit
                    <input
                      name="limit"
                      type="number"
                      min="0"
                      max="100"
                      required
                      placeholder="Choose explicitly"
                    />
                  </label>
                  <p>
                    A new season starts at zero. Earlier seasons and their
                    corrections remain available.
                  </p>
                  <button disabled={!online}>Create next season</button>
                </form>
              </details>
              <details>
                <summary>Add a tournament</summary>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget);
                    const id = crypto.randomUUID();
                    if (
                      sendSeason({
                        type: "tournament",
                        seasonId,
                        tournamentId: id,
                        name: String(d.get("name")),
                        rules: {
                          version: crypto.randomUUID(),
                          fenceLimit: Number(d.get("limit")),
                          board: { ...DEFAULT_BOARD },
                        },
                      })
                    ) {
                      setTournamentId(id);
                      setKind("Tournament");
                      setBands([]);
                    }
                  }}
                >
                  <label>
                    Tournament name
                    <input name="name" required maxLength={80} />
                  </label>
                  <label>
                    Tournament fence HR limit
                    <input
                      name="limit"
                      type="number"
                      min="0"
                      max="100"
                      required
                      placeholder="Choose explicitly"
                    />
                  </label>
                  <button disabled={!online}>Add tournament</button>
                </form>
              </details>
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
                  if (!startingRules) {
                    setError("Choose or add a tournament first.");
                    return;
                  }
                  const override = String(d.get("limit") ?? "").trim();
                  const saved = sendSeason({
                    type: "start",
                    seasonId,
                    dayId: String(d.get("date")),
                    gameId: id,
                    opponent: String(d.get("opponent")),
                    kind,
                    ...(kind === "Tournament" ? { tournamentId } : {}),
                    lineup,
                    rules: override
                      ? {
                          ...startingRules,
                          version: crypto.randomUUID(),
                          fenceLimit: Number(override),
                        }
                      : startingRules,
                    bands: choices,
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
                  <select
                    name="kind"
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as "League" | "Tournament");
                      setBands([]);
                    }}
                  >
                    <option>League</option>
                    <option>Tournament</option>
                  </select>
                </label>
                <label>
                  Game date
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toLocaleDateString("en-CA")}
                  />
                </label>
                {kind === "Tournament" && (
                  <label>
                    Selected tournament
                    <select
                      value={tournamentId}
                      onChange={(e) => {
                        setTournamentId(e.target.value);
                        setBands([]);
                      }}
                      required
                    >
                      <option value="">Choose a tournament</option>
                      {season?.tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Game fence HR limit override
                  <input
                    key={`${seasonId}-${kind}-${tournamentId}`}
                    name="limit"
                    type="number"
                    min="0"
                    max="100"
                    placeholder={
                      startingRules
                        ? `Use setup limit: ${startingRules.fenceLimit}`
                        : "Choose tournament first"
                    }
                  />
                </label>
                <p>
                  {startingRules
                    ? `Setup limit: ${startingRules.fenceLimit}. Leave the override blank to use it; zero is a valid override.`
                    : "Add or choose a tournament and its limit."}
                </p>
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
                <fieldset>
                  <legend>
                    {kind === "Tournament"
                      ? "First tournament game Bands (multiple or none)"
                      : "League-game Bands (explicit sample setup)"}
                  </legend>
                  {lineup.map((id) => {
                    const fixed =
                      kind === "Tournament"
                        ? assigned.find((b) => b.playerId === id)
                        : undefined;
                    return (
                      <label key={id} className="check-label">
                        <input
                          type="checkbox"
                          checked={fixed ? fixed.hasBand : bands.includes(id)}
                          disabled={!!fixed}
                          onChange={() => toggle(id, bands, setBands)}
                        />
                        {roster.find((p) => p.id === id)?.name}
                        {fixed
                          ? ` · ${fixed.hasBand ? "Band" : "No Band"} retained from first game`
                          : ""}
                      </label>
                    );
                  })}
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
                  disabled={!online || lineup.length === 0 || !startingRules}
                >
                  Start game
                </button>
                {game && !game.complete && (
                  <button
                    type="button"
                    disabled={
                      !online || lineup.length === 0 || !lineupMatchesGame
                    }
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
                        Game {i + 1} vs {g.opponent} · {g.kind} ·{" "}
                        {
                          season?.scoring.games.find((e) => e.game.id === g.id)
                            ?.dayId
                        }
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
                Statistics follow the selected filter. The Beverage Board always
                includes both league and tournament games in {season?.name}.
                Positive values are owed; negative values are credits. New
                seasons start fresh; prior season history stays available.
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
                    {roster.map(({ id }) => {
                      const t = scopedTotals[id] ?? emptyTotals();
                      const board = beverageBoard[id] ?? 0;
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
                          <td>{rate(r.OBP)}</td>
                          <td>{rate(r.Reach)}</td>
                          <td>
                            {board > 0 ? "+" : ""}
                            {board}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="club-card">
              <h2>Tournament Bands and future rules</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  const band = season?.scoring.bands.find(
                    (b) =>
                      `${b.tournamentId}/${b.playerId}` === d.get("assignment"),
                  );
                  if (!band) {
                    setError("Choose an existing tournament assignment.");
                    return;
                  }
                  sendSeason({
                    type: "band",
                    seasonId,
                    tournamentId: band.tournamentId,
                    playerId: band.playerId,
                    hasBand: d.get("value") === "true",
                    reason: String(d.get("reason")),
                  });
                }}
              >
                <p>
                  Assignment stays fixed for the tournament. A correction
                  records a reason and recalculates every affected game, across
                  all dates.
                </p>
                <label>
                  Tournament Band assignment
                  <select name="assignment" required>
                    <option value="">Choose an assignment</option>
                    {season?.scoring.bands.map((b) => (
                      <option
                        key={`${b.tournamentId}/${b.playerId}`}
                        value={`${b.tournamentId}/${b.playerId}`}
                      >
                        {
                          season.tournaments.find(
                            (t) => t.id === b.tournamentId,
                          )?.name
                        }{" "}
                        · {roster.find((p) => p.id === b.playerId)?.name} ·{" "}
                        {b.hasBand ? "Band" : "No Band"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Corrected Band status
                  <select name="value">
                    <option value="true">Band</option>
                    <option value="false">No Band</option>
                  </select>
                </label>
                <label>
                  Band correction reason
                  <input name="reason" maxLength={200} required />
                </label>
                <button disabled={!online || !season?.scoring.bands.length}>
                  Save tournament Band correction
                </button>
              </form>
              <label>
                Future rules apply to
                <select
                  value={rulesTarget}
                  onChange={(e) => setRulesTarget(e.target.value)}
                >
                  <option value="league">League</option>
                  {season?.tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <form
                key={`${seasonId}-${rulesTarget}-${futureRules?.version}`}
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
                    defaultValue={futureRules?.fenceLimit}
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
                      defaultValue={futureRules?.board[key]}
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
                  setSeasonBook(null);
                  setSeasonId("");
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
