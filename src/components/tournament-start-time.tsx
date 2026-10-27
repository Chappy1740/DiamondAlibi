"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scoringAction, loadScorebook } from "@/app/club/scoring-actions";
import { START_TIME_ZONES, validStartTime } from "@/lib/tournament-start-time";

export function TournamentStartTimeForm({
  team,
  season,
  tournament,
  disabled,
}: {
  team: string;
  season: string;
  tournament: {
    id: string;
    revision: number;
    firstGameTime?: string | null;
    firstGameZone?: string | null;
  };
  disabled: boolean;
}) {
  const router = useRouter();
  const [time, setTime] = useState(tournament.firstGameTime?.slice(0, 5) ?? "");
  const [zone, setZone] = useState(
    tournament.firstGameZone ?? "America/Chicago",
  );
  const [revision, setRevision] = useState(tournament.revision);
  const [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false),
    pending = useRef<Record<string, unknown> | null>(null);
  async function send(request: Record<string, unknown>) {
    if (lock.current || disabled) return;
    if (!navigator.onLine) {
      setMessage("Offline. Reconnect before saving the start time.");
      return;
    }
    lock.current = true;
    setBusy(true);
    pending.current = request;
    const uncertain = () => {
      setRetry(true);
      setMessage("Start time could not be confirmed. Retry the same change.");
    };
    try {
      const result = await scoringAction(request);
      if (result.status === "uncertain" || result.status === "unavailable") {
        uncertain();
        return;
      }
      if (result.status !== "ok") {
        pending.current = null;
        setRetry(false);
        setMessage(
          result.status === "paused"
            ? "Restore this tournament and season before changing the start time."
            : "Could not save the start time. Check your access and refresh.",
        );
        return;
      }
      const receipt = result.data as { status?: string; revision?: number };
      if (!["accepted", "conflict"].includes(receipt.status ?? "")) {
        uncertain();
        return;
      }
      const loaded = await loadScorebook(team, season, "Overall");
      const current =
        loaded.status === "ok" &&
        loaded.data.snapshot.teamId === team &&
        loaded.data.snapshot.seasonId === season
          ? loaded.data.snapshot.tournaments.find((t) => t.id === tournament.id)
          : undefined;
      if (
        !current ||
        !Number.isSafeInteger(current.revision) ||
        !Object.hasOwn(current, "firstGameTime") ||
        !Object.hasOwn(current, "firstGameZone")
      ) {
        uncertain();
        return;
      }
      const savedTime = current.firstGameTime?.slice(0, 5) ?? null;
      if (
        receipt.status === "conflict" ||
        ((savedTime !== request.time ||
          current.firstGameZone !== request.zone) &&
          current.revision > (receipt.revision ?? Infinity))
      ) {
        pending.current = null;
        setRetry(false);
        setRevision(current.revision);
        setTime(savedTime ?? "");
        setZone(current.firstGameZone ?? "America/Chicago");
        setMessage(
          "Tournament settings changed. Latest start time loaded; review before saving again.",
        );
        router.refresh();
        return;
      }
      if (
        savedTime !== request.time ||
        current.firstGameZone !== request.zone ||
        current.revision <= Number(request.expectedRevision)
      ) {
        uncertain();
        return;
      }
      pending.current = null;
      setRetry(false);
      setRevision(current.revision);
      setMessage(
        savedTime
          ? "First game start time saved."
          : "First game start time cleared.",
      );
      router.refresh();
    } catch {
      uncertain();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section aria-label="First game start time">
      <h3>First game start time</h3>
      <p>
        Optional. Applies only to Game 1; its saved game date stays unchanged.
        Later games have no inherited start time.
      </p>
      <form
        className="club-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!validStartTime(time || null, zone)) {
            setMessage("Enter a valid time and choose a time zone.");
            return;
          }
          void send({
            type: "tournamentStartTime",
            teamId: team,
            seasonId: season,
            tournamentId: tournament.id,
            commandId: crypto.randomUUID(),
            expectedRevision: revision,
            time: time || null,
            zone,
          });
        }}
      >
        <fieldset disabled={disabled || busy || retry}>
          <label>
            Start time
            <input
              type="time"
              name="startTime"
              step="60"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label>
            Time zone
            <select
              aria-label="Time zone"
              name="timeZone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              {START_TIME_ZONES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="button primary">
            {busy ? "Saving…" : "Save first game time"}
          </button>
        </fieldset>
      </form>
      {retry && (
        <button
          className="button secondary"
          disabled={disabled || busy}
          onClick={() => pending.current && void send(pending.current)}
        >
          Retry the same start time
        </button>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
