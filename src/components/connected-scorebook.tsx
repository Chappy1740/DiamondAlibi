"use client";
import { competitionGames, competitionPath, contextQuery } from "@/lib/competitions";
import { revealInvalidField } from "@/lib/form-details";
import { TournamentNextGame } from "@/components/tournament-next-game";
import { tournamentContinuation } from "@/lib/tournament-continuation";
import { ScorebookAudit } from "@/components/scorebook-audit";
import { GameHrLimitPanel } from "@/components/game-hr-limit";
import { BattingOutcomePicker } from "./batting-outcome-picker";
import { DashboardSelect } from "./dashboard-select";
import { VoicePlayEntry } from "./voice-play-entry";
import { parseNamedPlay } from "@/lib/named-play";
import { GameScoreboardPanel } from "@/components/game-scoreboard";
import { connectedScoreboard } from "@/lib/game-scoreboard";
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
  initialTournamentId?: string;
  initialLeagueId?: string;
  mode?: "full" | "score" | "setup" | "manage";
  managementHref?: string;
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
  initialTournamentId = "",
  initialLeagueId = "",
  mode = "full",
  managementHref,
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
  const [kind, setKind] = useState<"League" | "Tournament">(
      initialTournamentId ? "Tournament" : "League",
    ),
    [tournamentId, setTournamentId] = useState(initialTournamentId);
  const [nextTournamentId, setNextTournamentId] = useState(initialTournamentId);
  const [openTournaments, setOpenTournaments] = useState<
    Record<string, boolean>
  >(initialTournamentId ? { [initialTournamentId]: true } : {});
  const [auditStale, setAuditStale] = useState(false);
  const [leagueId, setLeagueId] = useState(initialLeagueId);
  const [overrideLimit, setOverrideLimit] = useState(false);
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
  const setupForm = useRef<HTMLFormElement | null>(null);
  const [manualPlayer, setManualPlayer] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [firstBand, setFirstBand] = useState<boolean | null>(null);
  const [entryError, setEntryError] = useState("");
  const countsEdited = useRef(false);
  const pendingPlay = useRef<{ playerId: string; outcome: Outcome; runs: number; rbi: number } | null>(null);
  const snapshot = data?.snapshot;
  const allGames = snapshot?.games ?? [];
  const visibleGames = initialTournamentId ? competitionGames(allGames, "Tournament", initialTournamentId)
    : initialLeagueId ? competitionGames(allGames, "League", initialLeagueId) : allGames;
  const games = [...visibleGames].sort(
    (a, b) =>
      Number(a.game.completed) - Number(b.game.completed) ||
      b.playedOn.localeCompare(a.playedOn) ||
      a.game.id.localeCompare(b.game.id),
  );
  // A requested game that vanished must not silently select a different game.
  const current = selected ? games.find((g) => g.game.id === selected) : games[0];
  const manual = current?.game.batting_mode === "manual";
  const battingPlayer = manual ? manualPlayer : current?.lineup[current.game.next_batter_position] ?? "";
  useEffect(() => { setManualPlayer(""); setPlayerSearch(""); setFirstBand(null); setEntryError(""); pendingPlay.current = null; }, [current?.game.id]);
  const playerName = (id: string) =>
    data?.roster.find((p) => p.id === id)?.display_name ??
    "Former roster player";
  const disabled =
    busy || !online || paused || review || uncertain || !data || data.archived;
  const base = { teamId, seasonId };
  const continuation =
    kind === "Tournament" ? tournamentContinuation(data, tournamentId) : null;
  const inheritedLimit =
    kind === "Tournament"
      ? snapshot?.tournaments.find((t) => t.id === tournamentId)?.fenceLimit
      : snapshot?.leagues?.find((l) => l.id === leagueId)?.fenceLimit;
  const setupNumber = kind === "Tournament"
    ? (snapshot?.games.filter((g) => g.game.tournament_id === tournamentId).length ?? 0) + 1 : null;
  const routineMessage = /^(Scorebook loaded\.|Scorebook refreshed\.|Latest scorebook reviewed\.|Saved to the team scorebook\.|Previous save confirmed\.|Saving…|Set up Game )/.test(message);
  const needsAttention = !online || paused || review || uncertain || !routineMessage;
  useEffect(() => setOverrideLimit(false), [kind, tournamentId, leagueId]);
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
      setAuditStale(true);
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
          competitionId?: string;
          kind?: string;
        };
        if (submitted.type === "start" && submitted.setup?.gameId) {
          setSelected(submitted.setup.gameId);
          if (mode === "setup") window.location.assign(`/club/score?${contextQuery(teamId, seasonId)}&game=${encodeURIComponent(submitted.setup.gameId)}`);
        }
        if (submitted.type === "tournament" && submitted.tournamentId)
          setTournamentId(submitted.tournamentId);
        if (submitted.type === "competition" && submitted.competitionId) {
          if (submitted.kind === "Tournament")
            setTournamentId(submitted.competitionId);
          else setLeagueId(submitted.competitionId);
          if (mode !== "full") window.location.assign(`${competitionPath(submitted.kind === "Tournament" ? "Tournament" : "League", submitted.competitionId)}?${contextQuery(teamId, seasonId)}`);
        }
      }
      if (loaded)
        setMessage(
          conflict
            ? "A teammate changed the scorebook. Review the latest numbers before trying your change again."
            : receipt.duplicate
              ? "Previous save confirmed. The change was recorded once."
              : "Saved to the team scorebook.",
        );
      if (loaded && !conflict && mode === "score" && (request as { change?: { type?: string } }).change?.type === "score") { setOutcome("Hit"); setRuns(0); setRbi(0); countsEdited.current = false; setFirstBand(null); pendingPlay.current = null; setManualPlayer(""); setPlayerSearch(""); }
      return loaded && !conflict;
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
      const settings = setupForm.current?.querySelector<HTMLDetailsElement>("[data-setup-lineup]");
      if (settings) settings.open = true;
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
  async function recordPlay(playerId: string, nextOutcome: Outcome, nextRuns: number, nextRbi: number, bandChoice = firstBand) {
    if (disabled || lock.current || !current || !data || current.game.completed) return false;
    if (!data.roster.some(player => player.id === playerId)) { setEntryError("Choose the player first."); return false; }
    if (!manual && playerId !== current.lineup[current.game.next_batter_position]) { setEntryError(`The lineup’s next batter is ${playerName(current.lineup[current.game.next_batter_position])}.`); return false; }
    if (![nextRuns, nextRbi].every(value => Number.isInteger(value) && value >= 0 && value <= 4) || nextRbi > nextRuns || ((nextOutcome === "Fence HR" || nextOutcome === "ITP HR") && nextRuns < 1)) { setEntryError("RBI cannot exceed runs. A home run must score at least one run."); return false; }
    const needsBand = manual && current.game.kind === "Tournament" && !data.bands.some(band => band.tournament_id === current.game.tournament_id && band.player_id === playerId);
    if (needsBand && bandChoice === null) {
      setManualPlayer(playerId); setEntryError("Choose Band or no Band for this player’s first tournament appearance.");
      pendingPlay.current = { playerId, outcome: nextOutcome, runs: nextRuns, rbi: nextRbi }; return false;
    }
    setEntryError("");
    const accepted = await save(gameRequest(current, { type: "score", playId: crypto.randomUUID(), playerId, outcome: nextOutcome, runs: nextRuns, rbi: nextRbi, ...(needsBand ? { firstGameBand: bandChoice } : {}) }));
    if (accepted && mode === "score") { setOutcome("Hit"); setRuns(0); setRbi(0); countsEdited.current = false; setFirstBand(null); pendingPlay.current = null; if (manual) { setManualPlayer(""); setPlayerSearch(""); } }
    return accepted;
  }
  function pickOutcome(next: Outcome) {
    const hr = next === "Fence HR" || next === "ITP HR";
    const nextRuns = countsEdited.current ? Math.max(runs, hr ? 1 : 0) : hr ? 1 : 0;
    const nextRbi = countsEdited.current ? rbi : hr ? 1 : 0;
    setOutcome(next); setRuns(nextRuns); setRbi(nextRbi);
    void recordPlay(battingPlayer, next, nextRuns, nextRbi);
  }
  async function spokenPlay(text: string) {
    if (!data || !current || disabled) return false;
    const result = parseNamedPlay(text, data.roster, battingPlayer);
    if (result.status !== "ok") { setEntryError(result.message); return false; }
    setOutcome(result.outcome); setRuns(result.runs); setRbi(result.rbi);
    return recordPlay(result.playerId, result.outcome, result.runs, result.rbi);
  }
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
      const chosen = game ? game.lineup.includes(p.id) : !snapshot?.capabilities?.manualBatting;
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
    void startGame(
      formData(event),
      kind,
      tournamentId,
      leagueId,
      overrideLimit,
    );
  }
  async function startGame(
    form: FormData,
    gameKind: "League" | "Tournament",
    chosenTournament: string,
    chosenLeague: string,
    gameOverride: boolean,
  ) {
    const selectedLineup = snapshot?.capabilities?.manualBatting && !form.getAll("player").length ? [] : lineup(form);
    if (!selectedLineup) return;
    const date = String(form.get("date")),
      existingDay = snapshot?.games.find((g) => g.playedOn === date);
    const tour =
      gameKind === "Tournament"
        ? snapshot?.tournaments.find((t) => t.id === chosenTournament)
        : null;
    if (gameKind === "Tournament" && !tour) {
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
    const accepted = await save({
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
        kind: gameKind,
        ...(gameKind === "League" && chosenLeague
          ? { leagueId: chosenLeague }
          : {}),
        ...(gameOverride
          ? {
              overrideLimit: true,
              overrideReason: String(form.get("overrideReason")).trim(),
            }
          : {}),
        lineup: selectedLineup,
        ...(snapshot?.capabilities?.manualBatting ? { battingMode: selectedLineup.length ? "ordered" : "manual" } : {}),
        rules: {
          version: `Game rules ${crypto.randomUUID()}`,
          fenceLimit: Number(form.get("limit")),
          board,
        },
        bands,
      },
    });
    if (accepted && tour) {
      setNextTournamentId(tour.id);
      setOpenTournaments((current) => ({ ...current, [tour.id]: true }));
    }
    return accepted;
  }
  function editLineup(event: FormEvent<HTMLFormElement>, g: ConnectedGame) {
    const form = formData(event),
      next = lineup(form);
    if (!next || !data) return;
    const changes: Record<string, unknown> = { type: "lineup", lineup: next };
    if (g.game.batting_mode === "manual") { changes.battingMode = "ordered"; changes.nextBatter = next[0]; changes.reason = String(form.get("modeReason")).trim() || "Coach-entered batting order before scoring"; }
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
        setAuditStale(false);
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
    <div className={`team-scorebook${mode === "setup" ? " team-scorebook--setup" : mode === "score" ? " team-scorebook--score" : ""}`}>
      <section className={mode === "full" ? "card detail-card" : `scorebook-status${needsAttention ? " scorebook-status--attention" : ""}`} aria-label="Scorebook connection">
        <div className="scorebook-toolbar">
          {mode === "full" ? <h2>Team scorebook</h2> : <span className="connection-indicator" role="status">
            {busy ? "Working…" : !online ? "Offline" : paused ? "Paused" : uncertain ? "Save unconfirmed" : review ? "Review needed" : data?.archived ? "Read only" : "Connected"}
          </span>}
          <button
            className="button secondary"
            disabled={busy || !online}
            onClick={() => void refresh()}
            aria-label="Refresh scorebook"
          >
            {mode === "full" ? "Refresh scorebook" : "Refresh"}
          </button>
        </div>
        {(mode === "full" || needsAttention || (!busy && message !== "Scorebook loaded.")) && <p role={needsAttention && mode !== "full" ? "alert" : "status"}>
          {busy ? "Working… " : ""}
          {message}
        </p>}
        {mode === "full" && <p className="micro">
          {online ? "Connected" : "Offline"} ·{" "}
          {data?.archived
            ? "Archived season · read only"
            : "Changes require a confirmed save"}
          . Automatic refresh every 15 seconds while this page is visible.
        </p>}
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
          {mode !== "setup" && selected && !current && <p role="alert">That game is unavailable in this scorebook. Return to its competition or refresh.</p>}
          {mode !== "setup" && current && (
            <section className={`card detail-card at-bat-card${mode === "score" ? " at-bat-card--compact" : ""}`} key={current.game.id}>
              <h2>{current.game.opponent}</h2>
              <p>
                {current.playedOn} · {current.game.kind}{current.game.tournament_game_number ? ` · Game ${current.game.tournament_game_number}` : ""} ·{" "}
                {current.game.completed
                  ? "Final — corrections remain available"
                  : "Live"}
              </p>
              {!current.game.completed && mode !== "manage" && (
                <>
                  {manual ? <div className="manual-batter">
                    <h3>{manualPlayer ? `Batting: ${playerName(manualPlayer)}` : "Who’s batting?"}</h3>
                    <input aria-label="Find player" placeholder="Player name" value={playerSearch} disabled={disabled} onChange={event => { setPlayerSearch(event.target.value); setManualPlayer(""); setFirstBand(null); pendingPlay.current = null; }} />
                    <div className="manual-player-buttons" role="group" aria-label="Choose batting player">
                      {data?.roster.filter(player => (!manualPlayer || player.id === manualPlayer || playerSearch) && player.display_name.toLocaleLowerCase().includes(playerSearch.toLocaleLowerCase())).slice(0,6).map(player => <button type="button" key={player.id} disabled={disabled} aria-pressed={manualPlayer === player.id} onClick={() => { setManualPlayer(player.id); setPlayerSearch(""); setFirstBand(null); pendingPlay.current = null; setEntryError(""); }}>{player.display_name}</button>)}
                    </div>
                  </div> : <h3>Next batter: {playerName(battingPlayer)}</h3>}
                  {mode === "score" && <VoicePlayEntry disabled={disabled} onResult={spokenPlay} />}
                  {entryError && <p className="entry-error" role="alert">{entryError}</p>}
                  {manual && manualPlayer && current.game.kind === "Tournament" && !data?.bands.some(band => band.tournament_id === current.game.tournament_id && band.player_id === manualPlayer) && <div className="first-band-choice" role="group" aria-label="First tournament Band choice">
                    <span>HR Band for {playerName(manualPlayer)}?</span>
                    {[false,true].map(choice => <button key={String(choice)} type="button" disabled={disabled} aria-pressed={firstBand === choice} onClick={() => { setFirstBand(choice); const draft = pendingPlay.current; if (draft) void recordPlay(draft.playerId,draft.outcome,draft.runs,draft.rbi,choice); }}>{choice ? "Has Band" : "No Band"}</button>)}
                  </div>}
                  <form
                    className="club-form at-bat-form"
                    onSubmit={(e) => {
                      formData(e);
                      void recordPlay(battingPlayer, outcome, runs, rbi);
                    }}
                  >
                    <fieldset disabled={disabled}>
                      <div className="at-bat-rbi" role="group" aria-label="RBI on this play">
                        <span>RBI</span>
                        <div className="rbi-buttons">
                          {[0, 1, 2, 3, 4].map((value) => <button key={value} type="button" aria-label={`${value} RBI`} aria-pressed={rbi === value} disabled={disabled} onClick={() => { countsEdited.current = true; setRbi(value); setRuns(Math.max(runs, value)); }}>{value} RBI</button>)}
                        </div>
                      </div>
                      <label className="at-bat-runs">
                        Runs on this play
                        <input type="number" min={0} max={4} value={runs} onChange={(e) => { countsEdited.current = true; setRuns(Number(e.target.value)); }} required />
                      </label>
                      <input type="hidden" name="at-bat-rbi" value={rbi} />
                      {mode === "score" && <p className="quick-play-hint">Set RBI when needed, then tap the result to record.</p>}
                      <BattingOutcomePicker value={outcome} disabled={disabled} onPick={mode === "score" ? pickOutcome : undefined} onChange={(next) => {
                        setOutcome(next);
                        const hr = next === "Fence HR" || next === "ITP HR";
                        setRuns(hr ? 1 : 0);
                        setRbi(hr ? 1 : 0);
                      }} />
                      {mode !== "score" && <button className="button primary">Record plate appearance</button>}
                    </fieldset>
                  </form>
                </>
              )}
              {mode !== "score" && <details className="game-management" open={mode === "full" || mode === "manage" || current.game.completed}>
                <summary>Game details & settings</summary>
              <GameScoreboardPanel
                key={current.game.id}
                value={connectedScoreboard(current.game)}
                disabled={disabled}
                save={(value) =>
                  void save(
                    gameRequest(current, { type: "scoreboard", ...value }),
                  )
                }
              />
              <p className="micro">
                Game fence HR limit: {current.rules.fence_limit}. Used:{" "}
                {current.evaluation.fenceUsed}.{" "}
                {current.game.kind === "Tournament"
                  ? "Bands remain fixed throughout the tournament."
                  : "HR Bands apply only to tournaments."}
              </p>
              <GameHrLimitPanel
                key={`hr-limit-${current.game.id}`}
                limit={current.rules.fence_limit}
                disabled={disabled}
                save={(value) =>
                  void save(gameRequest(current, { type: "hrLimit", ...value }))
                }
              />
                {!current.game.completed && <>
                  {!manual && <details>
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
                  </details>}
                  <details>
                    <summary>{manual ? "Add coach lineup" : "Edit batting order"}</summary>
                    <form
                      className="club-form"
                      key={JSON.stringify(current.lineup)}
                      onSubmit={(e) => editLineup(e, current)}
                    >
                      <fieldset disabled={disabled}>
                        {bandFields(current.game.tournament_id, current)}
                        {current.game.batting_mode === "manual" && <label>Batting order change reason<input name="modeReason" required={current.evaluation.rows.length > 0} maxLength={200} /></label>}
                        {current.game.batting_mode === "manual" && <p>After saving, batting starts at position 1.</p>}
                        <button className="button secondary">
                          Save lineup
                        </button>
                      </fieldset>
                    </form>
                  </details>
                  {!manual && snapshot?.capabilities?.manualBatting && <form className="club-form" onSubmit={event => { const f = formData(event); void save(gameRequest(current, { type: "lineup", lineup: [], ...(current.game.kind === "Tournament" ? { firstGameBands: {} } : {}), battingMode: "manual", reason: String(f.get("modeReason")).trim() || "Choose batting players before scoring" })); }}>
                    <fieldset disabled={disabled}><label>Switch to player-by-player scoring reason<input name="modeReason" required={current.evaluation.rows.length > 0} maxLength={200} /></label><button className="button secondary">Choose players as they bat</button></fieldset>
                  </form>}
                  <button
                    className="button secondary"
                    disabled={disabled}
                    onClick={() =>
                      void save(gameRequest(current, { type: "complete" }))
                    }
                  >
                    Mark game complete
                  </button>
                </>}
              </details>}
              {mode === "score" && managementHref && <a className="text-link game-details-link" href={`${managementHref}&game=${encodeURIComponent(current.game.id)}`}>Game details</a>}
              {mode !== "score" && <details className="at-bat-history" open={mode === "full" || current.game.completed}>
                <summary>Plate appearances · {current.evaluation.rows.length}</summary>
              <h3>Plate appearances</h3>
              {!current.evaluation.rows.length && (
                <p>No plate appearances recorded.</p>
              )}
              {current.evaluation.rows.map((row) => (
                <details key={row.id} className="scorebook-play">
                  <summary>
                    {playerName(row.playerId)} · {row.official} ·{" "}
                    {row.voided ? "voided" : `${row.runs} runs, ${row.rbi} RBI`}
                  </summary>
                  <p className="micro">
                    Beverage adjustment: {row.delta > 0 ? "+" : ""}
                    {row.delta}
                  </p>
                  <form
                    key={JSON.stringify(row)}
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
              </details>}
            </section>
          )}
          {(mode === "full" || mode === "manage") && <details className="game-switcher" open={mode === "full"}>
            <summary>Change game</summary>
            {games.length ? (
              <DashboardSelect label="Choose a game" name="game" value={current?.game.id ?? ""} disabled={busy} onChange={setSelected} options={games.map((g) => ({ id: g.game.id, name: `${g.game.completed ? "Final" : "Live"} · ${g.playedOn} · ${g.game.opponent} · ${g.game.kind}` }))} />
            ) : (
              <p>No games in this season yet. Set up the first game below.</p>
            )}
          </details>}
          {(mode === "full" || mode === "manage") && <details className="card detail-card" open={mode === "full"}>
            <summary>Season statistics</summary>
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
          </details>}
          {!continuation && mode !== "score" && (
            <section className="card detail-card game-setup-card">
              {mode === "full" && <h2 id="new-game-setup" tabIndex={-1}>Set up a game</h2>}
              <form className="club-form game-setup-form" aria-label="Set up a game" ref={setupForm} onSubmit={start} onInvalidCapture={(e) => revealInvalidField(e.target)}>
                <fieldset disabled={disabled}>
                  <label>
                    Opponent
                    <input name="opponent" maxLength={200} required />
                  </label>
                  {mode === "setup" && <button className="button primary" type="submit">{setupNumber ? `Start Game ${setupNumber}` : "Start game"}</button>}
                  {mode === "setup" && <p className="setup-summary">{inheritedLimit != null ? `Fence HR limit: ${inheritedLimit} · ` : ""}Review lineup{kind === "Tournament" ? " and HR Bands" : ""} before starting.</p>}
                  <details className="setup-details" open={mode === "full" || inheritedLimit == null}>
                    <summary>Date & HR limit</summary>
                  <label>
                    Game date
                    <input
                      name="date"
                      type="date"
                      defaultValue={new Date().toLocaleDateString("en-CA")}
                      required
                    />
                  </label>
                  <label hidden={mode === "setup" && !!initialTournamentId || mode === "setup" && !!initialLeagueId}>
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
                    <label hidden={mode === "setup" && !!initialTournamentId}>
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
                  {kind === "League" && (
                    <label hidden={mode === "setup" && !!initialLeagueId}>
                      League
                      <select
                        aria-label="League"
                        value={leagueId}
                        onChange={(e) => setLeagueId(e.target.value)}
                      >
                        <option value="">
                          No saved league — enter game limit
                        </option>
                        {snapshot?.leagues?.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} · {l.fenceLimit} HR
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {inheritedLimit != null && (
                    <>
                      <p>
                        Saved {kind.toLowerCase()} fence HR limit:{" "}
                        {inheritedLimit}. HRs used reset each game.
                      </p>
                      <label>
                        <input
                          type="checkbox"
                          checked={overrideLimit}
                          onChange={(e) => setOverrideLimit(e.target.checked)}
                        />
                        Override HR limit for this game only
                      </label>
                    </>
                  )}
                  <label>
                    Fence HR limit for this game
                    <input
                      key={`${kind}-${tournamentId}-${leagueId}-${overrideLimit}`}
                      name="limit"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={inheritedLimit ?? ""}
                      readOnly={inheritedLimit != null && !overrideLimit}
                      required
                    />
                  </label>
                  {overrideLimit && (
                    <label>
                      Game HR override reason
                      <input name="overrideReason" maxLength={200} required />
                    </label>
                  )}
                  <p className="micro">
                    Zero is allowed. The game inherits the saved competition
                    limit unless explicitly overridden. An in-game correction
                    recalculates the whole game; 1-up is deferred.
                  </p>
                  </details>
                  <details className="setup-details" data-setup-lineup open={mode === "full"}>
                    <summary>{kind === "Tournament" ? "Lineup & HR Bands" : "Lineup"}</summary>
                  <div key={`${kind}-${tournamentId}`}>
                    {bandFields(kind === "Tournament" ? tournamentId : null)}
                  </div>
                  </details>
                  <details className="setup-details">
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
                  {mode === "full" && <button className="button primary">Start game</button>}
                </fieldset>
              </form>
              {mode === "full" && <>
              <details>
                <summary>Create a tournament</summary>
                <form
                  className="club-form"
                  onSubmit={(e) => {
                    const f = formData(e);
                    void save({
                      ...base,
                      type: "competition",
                      competitionId: crypto.randomUUID(),
                      kind: "Tournament",
                      name: String(f.get("name")).trim(),
                      fenceLimit: Number(f.get("fenceLimit")),
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
                      Tournament fence HR limit
                      <input
                        name="fenceLimit"
                        type="number"
                        min={0}
                        max={100}
                        required
                      />
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
              <details>
                <summary>Create a league</summary>
                <form
                  className="club-form"
                  onSubmit={(e) => {
                    const f = formData(e);
                    void save({
                      ...base,
                      type: "competition",
                      competitionId: crypto.randomUUID(),
                      kind: "League",
                      name: String(f.get("name")).trim(),
                      fenceLimit: Number(f.get("fenceLimit")),
                      guaranteedGames: null,
                    });
                  }}
                >
                  <fieldset disabled={disabled}>
                    <label>
                      League name
                      <input name="name" maxLength={200} required />
                    </label>
                    <label>
                      League fence HR limit
                      <input
                        name="fenceLimit"
                        type="number"
                        min={0}
                        max={100}
                        required
                      />
                    </label>
                    <button className="button secondary">Create league</button>
                  </fieldset>
                </form>
              </details>
              </>}
            </section>
          )}
          {mode === "setup" && continuation && (
            <section className="card detail-card game-setup-card">
              <TournamentNextGame
                template={continuation}
                data={data}
                number={setupNumber ?? 1}
                compact
                disabled={disabled}
                submit={(form) => startGame(form, "Tournament", tournamentId, "", form.has("overrideLimit"))}
                otherCompetition={() => window.location.assign(`/?${contextQuery(teamId, seasonId)}`)}
              />
            </section>
          )}
          {(mode === "full" || mode === "manage") && (mode === "full" || !!initialTournamentId || !!current?.game.tournament_id) && <details className="card detail-card" open={mode === "full" || !!current?.game.completed}>
            <summary>Tournament games and Band corrections</summary>
            <p className="micro">
              Assignments stay fixed across tournament games. Corrections
              require a reason and recalculate the tournament.
            </p>
            {snapshot?.tournaments.filter((t) => mode === "full" || t.id === (initialTournamentId || current?.game.tournament_id)).map((t) => (
              <details
                key={t.id}
                open={openTournaments[t.id] ?? false}
                onToggle={(e) => {
                  const open = e.currentTarget.open;
                  setOpenTournaments((current) =>
                    current[t.id] === open
                      ? current
                      : { ...current, [t.id]: open },
                  );
                }}
              >
                <summary>
                  {t.name}
                  {t.guaranteedGames
                    ? ` · ${t.guaranteedGames}-game guaranteed`
                    : ""}
                </summary>
                {t.fenceLimit != null ? (
                  <p>Saved fence HR limit: {t.fenceLimit}</p>
                ) : (
                  <form
                    className="club-form"
                    onSubmit={(e) => {
                      const f = formData(e);
                      void save({
                        ...base,
                        type: "competition",
                        competitionId: t.id,
                        kind: "Tournament",
                        name: t.name,
                        guaranteedGames: t.guaranteedGames ?? null,
                        fenceLimit: Number(f.get("fenceLimit")),
                      });
                    }}
                  >
                    <fieldset disabled={disabled}>
                      <label>
                        Save tournament fence HR limit
                        <input
                          name="fenceLimit"
                          type="number"
                          min={0}
                          max={100}
                          required
                        />
                      </label>
                      <p>
                        The previous default is unknown. Saving it applies to
                        new games; existing game rules stay intact.
                      </p>
                      <button className="button secondary">
                        Save tournament HR limit
                      </button>
                    </fieldset>
                  </form>
                )}
                <p>
                  {
                    snapshot.games.filter((g) => g.game.tournament_id === t.id)
                      .length
                  }{" "}
                  games recorded. Guarantee is a minimum, not a cap.
                </p>
                <button
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => {
                    setKind("Tournament");
                    setTournamentId(t.id);
                    const template = tournamentContinuation(data, t.id);
                    setNextTournamentId(template ? t.id : "");
                    setMessage(
                      `Set up Game ${snapshot.games.filter((g) => g.game.tournament_id === t.id).length + 1} for ${t.name}.`,
                    );
                    // The next-game form opens here, without scrolling to another section.
                  }}
                >
                  Create Game{" "}
                  {snapshot.games.filter((g) => g.game.tournament_id === t.id)
                    .length + 1}
                </button>
                <p className="micro">
                  This opens game setup. It does not decide bracket advancement
                  or championship eligibility.
                </p>
                {nextTournamentId === t.id &&
                  tournamentContinuation(data, t.id) && (
                    <TournamentNextGame
                      key={t.id}
                      template={tournamentContinuation(data, t.id)!}
                      data={data}
                      number={
                        snapshot.games.filter(
                          (g) => g.game.tournament_id === t.id,
                        ).length + 1
                      }
                      disabled={disabled}
                      submit={(form) =>
                        startGame(
                          form,
                          "Tournament",
                          t.id,
                          "",
                          form.has("overrideLimit"),
                        )
                      }
                      otherCompetition={() => {
                        setKind("League");
                        setTournamentId("");
                        setNextTournamentId("");
                      }}
                    />
                  )}
                <details>
                  <summary>Correct tournament Bands</summary>
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
              </details>
            ))}
          </details>}
          {(mode === "full" || mode === "manage") && <details className="card detail-card" open={mode === "full"}>
            <summary>Audit history</summary>
            <button
              className="button secondary"
              disabled={busy || !online}
              onClick={() => void loadAudit()}
            >
              Load audit history
            </button>
            {audit && (
              <>
                <p>
                  {audit.events.length} history entries loaded.
                  {auditStale
                    ? " New changes are available; load history to refresh."
                    : ""}
                </p>
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
          </details>}
        </>
      )}
    </div>
  );
}
