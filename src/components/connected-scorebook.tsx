"use client";
import { ScorebookAudit } from "@/components/scorebook-audit";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  DEFAULT_BOARD,
  OUTCOMES,
  emptyTotals,
  rates,
  type Outcome,
  type Scope,
} from "@/lib/scoring";
import type { ConnectedResult } from "@/lib/connected-scoring";
import type {
  ConnectedGame,
  LoadedScorebook,
  ScorebookLoadResult,
  ScoreRow,
} from "@/lib/scorebook-view";

type Props = {
  storageKey: string;
  teamId: string;
  seasonId: string;
  initial: ScorebookLoadResult;
  initialGameId?: string;
  submitAction(input: unknown): Promise<ConnectedResult>;
  reloadAction(
    team: string,
    season: string,
    scope: Scope,
  ): Promise<ScorebookLoadResult>;
};
const rate = (value: number | null) =>
  value === null ? "—" : value.toFixed(3).replace(/^0/, "");
const boardLabels: Record<keyof typeof DEFAULT_BOARD, string> = {
  strikeout: "Strikeout",
  solo: "Solo fence HR",
  bandSolo: "Solo fence HR with Band",
  grandSlam: "Grand slam",
  overLimit: "Over-limit HR",
  insidePark: "Inside-the-park HR",
  multiRun: "Other multi-run HR",
};
export function ConnectedScorebook({
  storageKey,
  teamId,
  seasonId,
  initial,
  initialGameId = "",
  submitAction,
  reloadAction,
}: Props) {
  const [data, setData] = useState<LoadedScorebook | null>(
    initial.status === "ok" ? initial.data : null,
  );
  const [scope, setScope] = useState<Scope>("Overall"),
    [selected, setSelected] = useState(initialGameId);
  const [busy, setBusy] = useState(false),
    [online, setOnline] = useState(true),
    [paused, setPaused] = useState(initial.status !== "ok");
  const [review, setReview] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [message, setMessage] = useState(
      initial.status === "ok"
        ? "Scorebook loaded."
        : "Could not load the scorebook. Refresh to retry.",
    );
  const [kind, setKind] = useState<"League" | "Tournament">("League"),
    [tournamentId, setTournamentId] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("Hit"),
    [runs, setRuns] = useState(0),
    [rbi, setRbi] = useState(0);
  const [audit, setAudit] = useState<{
    events: unknown[];
    nextCursor: { at: string; key: string } | null;
  } | null>(null);
  const lock = useRef(false),
    pending = useRef<unknown>(null),
    mounted = useRef(true);
  const snapshot = data?.snapshot;
  const games = [...(snapshot?.games ?? [])].sort(
    (a, b) =>
      Number(a.game.completed) - Number(b.game.completed) ||
      b.playedOn.localeCompare(a.playedOn) ||
      a.game.id.localeCompare(b.game.id),
  );
  const current = games.find((g) => g.game.id === selected) ?? games[0];
  const playerName = (id: string) =>
    data?.roster.find((p) => p.id === id)?.display_name ??
    "Former roster player";
  const disabled =
    busy || !online || paused || review || uncertain || !data || data.archived;
  const base = { teamId, seasonId };
  async function read(nextScope = scope): Promise<boolean> {
    try {
      const result = await reloadAction(teamId, seasonId, nextScope);
      if (!mounted.current) return false;
      if (result.status === "ok") {
        setData(result.data);
        setScope(nextScope);
        setPaused(false);
        return true;
      }
      setPaused(true);
      if (
        result.status === "access-denied" ||
        result.status === "auth-required"
      )
        setData(null);
      setMessage(
        result.status === "auth-required"
          ? "Sign in again in My clubhouse."
          : result.status === "access-denied"
            ? "Team access is no longer available."
            : "Could not refresh. Scoring is paused; previous numbers may be out of date.",
      );
    } catch {
      if (mounted.current) {
        setPaused(true);
        setMessage(
          "Could not refresh. Scoring is paused; reconnect and retry.",
        );
      }
    }
    return false;
  }
  async function refresh(nextScope = scope) {
    if (lock.current || !navigator.onLine) return;
    lock.current = true;
    setBusy(true);
    try {
      const loaded = await read(nextScope);
      if (loaded && mounted.current)
        setMessage((previous) =>
          /^(Offline\.|Could not (load|refresh))/.test(previous)
            ? "Scorebook refreshed. Review the latest numbers before scoring."
            : previous,
        );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    try {
      const previous = sessionStorage.getItem(storageKey);
      if (previous) {
        const request = JSON.parse(previous);
        if (
          previous.length <= 32768 &&
          request.teamId === teamId &&
          request.seasonId === seasonId
        ) {
          pending.current = request;
          setUncertain(true);
          setMessage(
            "A previous save needs confirmation. Retry the same change before scoring again.",
          );
        } else sessionStorage.removeItem(storageKey);
      }
    } catch {
      setMessage(
        "Retry storage is unavailable. A change will not be sent unless its retry information can be preserved.",
      );
    }
    const offline = () => {
      setOnline(false);
      setPaused(true);
      setMessage("Offline. Scoring is paused until the scorebook reconnects.");
    };
    const reconnect = () => {
      setOnline(true);
      void refresh();
    };
    setOnline(navigator.onLine);
    if (!navigator.onLine) offline();
    window.addEventListener("offline", offline);
    window.addEventListener("online", reconnect);
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine &&
        !lock.current
      )
        void refresh();
    }, 15000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", reconnect);
    };
    // Recreate polling when the selected statistics scope changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, seasonId, scope, storageKey]);
  async function save(request: unknown, retry = false) {
    if (lock.current || !navigator.onLine || (!retry && disabled)) return;
    lock.current = true;
    setBusy(true);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(request));
    } catch {
      lock.current = false;
      setBusy(false);
      setMessage(
        "Could not preserve retry information. This attempt was not sent. Enable browser storage and retry.",
      );
      return;
    }
    pending.current = request;
    setMessage("Saving…");
    try {
      let result: ConnectedResult;
      try {
        result = await submitAction(request);
      } catch {
        result = { status: "uncertain", commandId: "retained" };
      }
      if (!mounted.current) return;
      if (result.status === "uncertain" || result.status === "unavailable") {
        setUncertain(true);
        setMessage(
          "Save could not be confirmed. Retry the same change before scoring again.",
        );
        return;
      }
      setUncertain(false);
      setAudit(null);
      pending.current = null;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* A retained command retries once, never creates a second save. */
      }
      if (result.status !== "ok") {
        if (
          result.status === "access-denied" ||
          result.status === "auth-required"
        ) {
          setData(null);
          setPaused(true);
        }
        setMessage(
          result.status === "paused"
            ? "This season is archived. Writes are paused."
            : result.status === "invalid"
              ? "That change was not accepted. Check the setup and refresh before retrying."
              : "Sign in and check your team access in My clubhouse.",
        );
        setReview(true);
        await read();
        return;
      }
      const receipt = result.data as { status?: string; duplicate?: boolean };
      const conflict = receipt.status === "conflict";
      if (conflict) setReview(true);
      const loaded = await read();
      if (loaded && !conflict && request && typeof request === "object") {
        const submitted = request as {
          type?: string;
          setup?: { gameId?: string };
          tournamentId?: string;
        };
        if (submitted.type === "start" && submitted.setup?.gameId)
          setSelected(submitted.setup.gameId);
        if (submitted.type === "tournament" && submitted.tournamentId)
          setTournamentId(submitted.tournamentId);
      }
      if (loaded)
        setMessage(
          conflict
            ? "A teammate changed the scorebook. Review the latest numbers before trying your change again."
            : receipt.duplicate
              ? "Previous save confirmed. The change was recorded once."
              : "Saved to the team scorebook.",
        );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const formData = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new FormData(event.currentTarget);
  };
  function lineup(form: FormData): string[] | null {
    const chosen = form.getAll("player").map(String);
    const ranks = chosen.map((id) => Number(form.get(`order-${id}`)));
    if (
      !chosen.length ||
      chosen.length > 100 ||
      ranks.some((n) => !Number.isInteger(n) || n < 1 || n > 100) ||
      new Set(ranks).size !== ranks.length
    ) {
      setMessage(
        "Choose at least one player and give each selected player a different batting position.",
      );
      return null;
    }
    return chosen.sort(
      (a, b) => Number(form.get(`order-${a}`)) - Number(form.get(`order-${b}`)),
    );
  }
  const gameRequest = (g: ConnectedGame, change: Record<string, unknown>) => ({
    ...base,
    type: "change",
    dayId: g.game.day_id,
    gameId: g.game.id,
    commandId: crypto.randomUUID(),
    expectedRevision: g.dayRevision,
    tournamentRevision: g.tournamentRevision,
    change: { ...change, gameId: g.game.id },
  });
  function bandFields(tour: string | null, game?: ConnectedGame) {
    return data?.roster.map((p, index) => {
      const fixed = tour
        ? data.bands.find(
            (b) => b.tournament_id === tour && b.player_id === p.id,
          )
        : undefined;
      const participated =
        game &&
        data.participation.some(
          (a) => a.game_id === game.game.id && a.player_id === p.id,
        );
      const hasBand =
        fixed?.has_band ??
        Boolean(
          game &&
          data.leagueBands.some(
            (b) => b.game_id === game.game.id && b.player_id === p.id,
          ),
        );
      const chosen = !game || game.lineup.includes(p.id);
      return (
        <div className="scorebook-player" key={p.id}>
          <label>
            <input
              type="checkbox"
              name="player"
              value={p.id}
              defaultChecked={chosen}
            />
            {p.display_name}
            {p.is_guest ? " · guest" : ""}
          </label>
          <label>
            Batting position for {p.display_name}
            <input
              type="number"
              name={`order-${p.id}`}
              min={1}
              max={100}
              defaultValue={
                game?.lineup.includes(p.id)
                  ? game.lineup.indexOf(p.id) + 1
                  : index + 1
              }
            />
          </label>
          {tour && (
            <label>
              <input
                type="checkbox"
                name={`band-${p.id}`}
                defaultChecked={hasBand}
                disabled={Boolean(fixed || participated)}
              />
              HR Band for {p.display_name}
              {fixed || participated ? " · retained" : " · first assignment"}
            </label>
          )}
        </div>
      );
    });
  }
  function start(event: FormEvent<HTMLFormElement>) {
    const form = formData(event),
      selectedLineup = lineup(form);
    if (!selectedLineup) return;
    const date = String(form.get("date")),
      existingDay = snapshot?.games.find((g) => g.playedOn === date);
    const tour =
      kind === "Tournament"
        ? snapshot?.tournaments.find((t) => t.id === tournamentId)
        : null;
    if (kind === "Tournament" && !tour) {
      setMessage("Choose a tournament first.");
      return;
    }
    const bands = Object.fromEntries(
      selectedLineup
        .filter(
          (id) =>
            !tour ||
            !data?.bands.some(
              (b) => b.tournament_id === tour.id && b.player_id === id,
            ),
        )
        .map((id) => [id, Boolean(tour) && form.has(`band-${id}`)]),
    );
    const board = Object.fromEntries(
      Object.keys(DEFAULT_BOARD).map((key) => [
        key,
        Number(form.get(`board-${key}`)),
      ]),
    );
    void save({
      ...base,
      type: "start",
      dayId: existingDay?.game.day_id ?? crypto.randomUUID(),
      playedOn: date,
      tournamentId: tour?.id ?? null,
      commandId: crypto.randomUUID(),
      expectedRevision: existingDay?.dayRevision ?? 0,
      tournamentRevision: tour?.revision ?? null,
      setup: {
        type: "start",
        gameId: crypto.randomUUID(),
        opponent: String(form.get("opponent")).trim(),
        kind,
        lineup: selectedLineup,
        rules: {
          version: `Game rules ${crypto.randomUUID()}`,
          fenceLimit: Number(form.get("limit")),
          board,
        },
        bands,
      },
    });
  }
  function editLineup(event: FormEvent<HTMLFormElement>, g: ConnectedGame) {
    const form = formData(event),
      next = lineup(form);
    if (!next || !data) return;
    const changes: Record<string, unknown> = { type: "lineup", lineup: next };
    if (g.game.kind === "Tournament")
      changes.firstGameBands = Object.fromEntries(
        next
          .filter(
            (id) =>
              !data.bands.some(
                (b) =>
                  b.tournament_id === g.game.tournament_id &&
                  b.player_id === id,
              ),
          )
          .map((id) => [id, form.has(`band-${id}`)]),
      );
    else
      changes.leagueBands = Object.fromEntries(
        next
          .filter(
            (id) =>
              !data.participation.some(
                (p) => p.game_id === g.game.id && p.player_id === id,
              ),
          )
          .map((id) => [id, false]),
      );
    void save(gameRequest(g, changes));
  }
  function correct(
    event: FormEvent<HTMLFormElement>,
    g: ConnectedGame,
    row: ScoreRow,
  ) {
    const form = formData(event);
    void save(
      gameRequest(g, {
        type: "correct",
        playId: row.id,
        playerId: String(form.get("batter")),
        outcome: String(form.get("outcome")),
        runs: Number(form.get("runs")),
        rbi: Number(form.get("rbi")),
        voided: form.has("voided"),
        reason: String(form.get("reason")).trim(),
      }),
    );
  }
  async function loadAudit(more = false) {
    if (lock.current || !online || !data) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await submitAction({
        ...base,
        type: "audit",
        limit: 20,
        cursorAt: more ? audit?.nextCursor?.at : null,
        cursorKey: more ? audit?.nextCursor?.key : null,
      });
      if (result.status === "ok") {
        const page = result.data as NonNullable<typeof audit>;
        setAudit({
          ...page,
          events: more
            ? [...(audit?.events ?? []), ...page.events]
            : page.events,
        });
      } else {
        setMessage(
          "Could not load history. Check your connection and team access.",
        );
        if (
          result.status === "access-denied" ||
          result.status === "auth-required"
        ) {
          setData(null);
          setAudit(null);
          setPaused(true);
        }
      }
    } catch {
      setMessage("Could not load history. Try again when connected.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="team-scorebook">
      <section className="card detail-card">
        <div className="scorebook-toolbar">
          <h2>Team scorebook</h2>
          <button
            className="button secondary"
            disabled={busy || !online}
            onClick={() => void refresh()}
          >
            Refresh scorebook
          </button>
        </div>
        <p role="status" aria-live="polite">
          {busy ? "Working… " : ""}
          {message}
        </p>
        <p className="micro">
          {online ? "Connected" : "Offline"} ·{" "}
          {data?.archived
            ? "Archived season · read only"
            : "Changes require a confirmed save"}
          . Automatic refresh every 15 seconds while this page is visible.
        </p>
        {uncertain && (
          <button
            className="button primary"
            disabled={busy || !online}
            onClick={() => void save(pending.current, true)}
          >
            Retry the same change
          </button>
        )}
        {review && !uncertain && (
          <button
            className="button secondary"
            disabled={busy || paused || !online}
            onClick={() => {
              setReview(false);
              setMessage(
                "Latest scorebook reviewed. You can make a new change.",
              );
            }}
          >
            I reviewed the latest scorebook
          </button>
        )}
      </section>
      {data && (
        <>
          <section className="card detail-card">
            <h2>Games</h2>
            {games.length ? (
              <label>
                Choose a game
                <select
                  value={current?.game.id ?? ""}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={busy}
                >
                  {games.map((g) => (
                    <option key={g.game.id} value={g.game.id}>
                      {g.game.completed ? "Final" : "Live"} · {g.playedOn} ·{" "}
                      {g.game.opponent} · {g.game.kind}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p>No games in this season yet. Set up the first game below.</p>
            )}
          </section>
          {current && (
            <section className="card detail-card" key={current.game.id}>
              <h2>{current.game.opponent}</h2>
              <p>
                {current.playedOn} · {current.game.kind} ·{" "}
                {current.game.completed
                  ? "Final — corrections remain available"
                  : "Live"}
              </p>
              <p className="micro">
                Frozen fence HR limit: {current.rules.fence_limit}. Used:{" "}
                {current.evaluation.fenceUsed}.{" "}
                {current.game.kind === "Tournament"
                  ? "Bands remain fixed throughout the tournament."
                  : "HR Bands apply only to tournaments."}
              </p>
              {!current.game.completed && (
                <>
                  <h3>
                    Next batter:{" "}
                    {playerName(
                      current.lineup[current.game.next_batter_position],
                    )}
                  </h3>
                  <form
                    className="club-form"
                    onSubmit={(e) => {
                      formData(e);
                      void save(
                        gameRequest(current, {
                          type: "score",
                          playId: crypto.randomUUID(),
                          playerId:
                            current.lineup[current.game.next_batter_position],
                          outcome,
                          runs,
                          rbi,
                        }),
                      );
                    }}
                  >
                    <fieldset disabled={disabled}>
                      <label>
                        Batting outcome
                        <select
                          value={outcome}
                          aria-label="Batting outcome"
                          onChange={(e) => {
                            const next = e.target.value as Outcome;
                            setOutcome(next);
                            const hr = next === "Fence HR" || next === "ITP HR";
                            setRuns(hr ? 1 : 0);
                            setRbi(hr ? 1 : 0);
                          }}
                        >
                          {OUTCOMES.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Runs on this play
                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={runs}
                          onChange={(e) => setRuns(Number(e.target.value))}
                          required
                        />
                      </label>
                      <label>
                        RBI on this play
                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={rbi}
                          onChange={(e) => setRbi(Number(e.target.value))}
                          required
                        />
                      </label>
                      <button className="button primary">
                        Record plate appearance
                      </button>
                    </fieldset>
                  </form>
                  <details>
                    <summary>Change next batter</summary>
                    <form
                      className="club-form"
                      key={current.game.next_batter_position}
                      onSubmit={(e) => {
                        const f = formData(e);
                        void save(
                          gameRequest(current, {
                            type: "batter",
                            playerId: String(f.get("batter")),
                          }),
                        );
                      }}
                    >
                      <fieldset disabled={disabled}>
                        <label>
                          Next batter override
                          <select
                            name="batter"
                            defaultValue={
                              current.lineup[current.game.next_batter_position]
                            }
                            aria-label="Next batter override"
                          >
                            {current.lineup.map((id) => (
                              <option key={id} value={id}>
                                {playerName(id)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button className="button secondary">
                          Apply next batter
                        </button>
                      </fieldset>
                    </form>
                  </details>
                  <details>
                    <summary>Edit batting order</summary>
                    <form
                      className="club-form"
                      key={JSON.stringify(current.lineup)}
                      onSubmit={(e) => editLineup(e, current)}
                    >
                      <fieldset disabled={disabled}>
                        {bandFields(current.game.tournament_id, current)}
                        <button className="button secondary">
                          Save lineup
                        </button>
                      </fieldset>
                    </form>
                  </details>
                  <button
                    className="button secondary"
                    disabled={disabled}
                    onClick={() =>
                      void save(gameRequest(current, { type: "complete" }))
                    }
                  >
                    Mark game complete
                  </button>
                </>
              )}
              <h3>Plate appearances</h3>
              {!current.evaluation.rows.length && (
                <p>No plate appearances recorded.</p>
              )}
              {current.evaluation.rows.map((row) => (
                <details
                  key={`${row.id}-${current.dayRevision}`}
                  className="scorebook-play"
                >
                  <summary>
                    {playerName(row.playerId)} · {row.official} ·{" "}
                    {row.voided ? "voided" : `${row.runs} runs, ${row.rbi} RBI`}
                  </summary>
                  <p className="micro">
                    Beverage adjustment: {row.delta > 0 ? "+" : ""}
                    {row.delta}
                  </p>
                  <form
                    className="club-form"
                    onSubmit={(e) => correct(e, current, row)}
                  >
                    <fieldset disabled={disabled}>
                      <label>
                        Correct batter
                        <select
                          name="batter"
                          defaultValue={row.playerId}
                          aria-label="Correct batter"
                        >
                          {[
                            ...new Set([
                              ...current.lineup,
                              ...current.evaluation.rows.map((r) => r.playerId),
                            ]),
                          ].map((id) => (
                            <option key={id} value={id}>
                              {playerName(id)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Correct outcome
                        <select
                          name="outcome"
                          aria-label="Correct outcome"
                          defaultValue={row.outcome}
                        >
                          {OUTCOMES.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Correct runs
                        <input
                          name="runs"
                          type="number"
                          min={0}
                          max={4}
                          defaultValue={row.runs}
                          required
                        />
                      </label>
                      <label>
                        Correct RBI
                        <input
                          name="rbi"
                          type="number"
                          min={0}
                          max={4}
                          defaultValue={row.rbi}
                          required
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="voided"
                          defaultChecked={row.voided}
                        />
                        Void this appearance
                      </label>
                      <label>
                        Correction reason
                        <input name="reason" maxLength={200} required />
                      </label>
                      <button className="button secondary">
                        Save correction
                      </button>
                    </fieldset>
                  </form>
                </details>
              ))}
            </section>
          )}
          <section className="card detail-card">
            <h2>Season statistics</h2>
            <div
              className="scorebook-toolbar"
              role="group"
              aria-label="Statistics scope"
            >
              {(["League", "Tournament", "Overall"] as Scope[]).map((s) => (
                <button
                  className="button secondary"
                  key={s}
                  aria-pressed={scope === s}
                  disabled={busy || !online || uncertain}
                  onClick={() => void refresh(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="micro">
              Beverage Board always combines league and tournament play for this
              season. Positive is owed; negative is credit. Prior seasons retain
              history.
            </p>
            <div
              className="table-scroll"
              role="region"
              aria-label="Season statistics"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {[
                      "Player",
                      "PA",
                      "H",
                      "HR",
                      "RBI",
                      "OBP",
                      "Reach Base %",
                      "Beverage Board",
                    ].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.roster.map((p) => {
                    const t = snapshot?.totals[p.id] ?? emptyTotals(),
                      r = rates(t);
                    return (
                      <tr key={p.id}>
                        <th scope="row">{p.display_name}</th>
                        <td>{t.PA}</td>
                        <td>{t.H}</td>
                        <td>{t.HR}</td>
                        <td>{t.RBI}</td>
                        <td>{rate(r.OBP)}</td>
                        <td>{rate(r.Reach)}</td>
                        <td>{snapshot?.board[p.id] ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card detail-card">
            <h2>Set up a game</h2>
            <form className="club-form" onSubmit={start}>
              <fieldset disabled={disabled}>
                <label>
                  Game date
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toLocaleDateString("en-CA")}
                    required
                  />
                </label>
                <label>
                  Opponent
                  <input name="opponent" maxLength={200} required />
                </label>
                <label>
                  Game kind
                  <select
                    value={kind}
                    aria-label="Game kind"
                    onChange={(e) => setKind(e.target.value as typeof kind)}
                  >
                    <option>League</option>
                    <option>Tournament</option>
                  </select>
                </label>
                {kind === "Tournament" && (
                  <label>
                    Tournament
                    <select
                      value={tournamentId}
                      aria-label="Tournament"
                      onChange={(e) => setTournamentId(e.target.value)}
                      required
                    >
                      <option value="">Choose tournament</option>
                      {snapshot?.tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.guaranteedGames
                            ? ` · ${t.guaranteedGames}-game guaranteed`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Fence HR limit for this game
                  <input
                    name="limit"
                    type="number"
                    min={0}
                    max={100}
                    required
                  />
                </label>
                <p className="micro">
                  Zero is allowed. These rules are frozen when the game starts;
                  1-up is deferred.
                </p>
                <h3>
                  {kind === "Tournament"
                    ? "Lineup and first Band assignments"
                    : "Lineup"}
                </h3>
                <div key={`${kind}-${tournamentId}`}>
                  {bandFields(kind === "Tournament" ? tournamentId : null)}
                </div>
                <details>
                  <summary>Beverage rules for this game</summary>
                  {Object.entries(DEFAULT_BOARD).map(([key, value]) => (
                    <label
                      key={key}
                      hidden={kind === "League" && key === "bandSolo"}
                    >
                      {boardLabels[key as keyof typeof DEFAULT_BOARD]}
                      <input
                        name={`board-${key}`}
                        type="number"
                        min={-100}
                        max={100}
                        defaultValue={value}
                        required
                      />
                    </label>
                  ))}
                </details>
                <button className="button primary">Start game</button>
              </fieldset>
            </form>
            <details>
              <summary>Create a tournament</summary>
              <form
                className="club-form"
                onSubmit={(e) => {
                  const f = formData(e);
                  void save({
                    ...base,
                    type: "tournament",
                    tournamentId: crypto.randomUUID(),
                    name: String(f.get("name")).trim(),
                    guaranteedGames: Number(f.get("guaranteedGames")),
                  });
                }}
              >
                <fieldset disabled={disabled}>
                  <label>
                    Tournament name
                    <input name="name" maxLength={200} required />
                  </label>
                  <label>
                    Games guaranteed
                    <select
                      name="guaranteedGames"
                      aria-label="Games guaranteed"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Choose games guaranteed
                      </option>
                      <option value="2">2-game guaranteed</option>
                      <option value="3">3-game guaranteed</option>
                    </select>
                  </label>
                  <button className="button secondary">
                    Create tournament
                  </button>
                </fieldset>
              </form>
            </details>
          </section>
          <section className="card detail-card">
            <h2>Tournament Band corrections</h2>
            <p className="micro">
              Assignments stay fixed across tournament games. Corrections
              require a reason and recalculate the tournament.
            </p>
            {snapshot?.tournaments.map((t) => (
              <details key={t.id}>
                <summary>
                  {t.name}
                  {t.guaranteedGames
                    ? ` · ${t.guaranteedGames}-game guaranteed`
                    : ""}
                </summary>
                {data.bands
                  .filter((b) => b.tournament_id === t.id)
                  .map((b) => (
                    <form
                      className="club-form"
                      key={`${b.player_id}-${t.revision}`}
                      onSubmit={(e) => {
                        const f = formData(e);
                        void save({
                          ...base,
                          type: "band",
                          tournamentId: t.id,
                          commandId: crypto.randomUUID(),
                          expectedRevision: t.revision,
                          playerId: b.player_id,
                          hasBand: f.has("band"),
                          reason: String(f.get("reason")).trim(),
                        });
                      }}
                    >
                      <fieldset disabled={disabled}>
                        <label>
                          <input
                            name="band"
                            type="checkbox"
                            defaultChecked={b.has_band}
                          />
                          HR Band for {playerName(b.player_id)}
                        </label>
                        <label>
                          Band correction reason
                          <input name="reason" maxLength={200} required />
                        </label>
                        <button className="button secondary">
                          Correct tournament Band
                        </button>
                      </fieldset>
                    </form>
                  ))}
              </details>
            ))}
          </section>
          <section className="card detail-card">
            <h2>Audit history</h2>
            <button
              className="button secondary"
              disabled={busy || !online}
              onClick={() => void loadAudit()}
            >
              Load audit history
            </button>
            {audit && (
              <>
                <p>{audit.events.length} history entries loaded.</p>
                <ScorebookAudit entries={audit.events} roster={data.roster} />
                {audit.nextCursor && (
                  <button
                    className="button secondary"
                    disabled={busy || !online}
                    onClick={() => void loadAudit(true)}
                  >
                    Load older history
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
