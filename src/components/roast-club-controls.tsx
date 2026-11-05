"use client";
import { useEffect, useRef, useState } from "react";
import { roastClubAction } from "@/app/club/roast-club-actions";
import type { RoastClubRequest, RoastClubState } from "@/lib/roast-club-consent";

/**
 * Self-service Roast Club participation. Optional and OFF until the player chooses.
 * Renders nothing unless the database supports it and the viewer is an account-linked
 * player, so it adds no clutter and offers no fake toggle.
 */
export function RoastClubControls({ teamId, teamName }: { teamId: string; teamName?: string }) {
  const [value, setValue] = useState<RoastClubState | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [uncertain, setUncertain] = useState(false);
  const generation = useRef(0),
    lock = useRef(false),
    pending = useRef<RoastClubRequest | null>(null);
  useEffect(() => {
    const run = ++generation.current;
    setValue(null);
    setMessage("");
    setUncertain(false);
    setBusy(false);
    lock.current = false;
    pending.current = null;
    const connection = () => setOnline(navigator.onLine);
    connection();
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    void roastClubAction({ type: "read", teamId }).then((result) => {
      if (run === generation.current && result.status === "ok") setValue(result.data);
    });
    return () => {
      ++generation.current;
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, [teamId]);
  async function save(request: RoastClubRequest, retry = false) {
    if (lock.current || !online || (!retry && pending.current)) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    pending.current = request;
    const run = generation.current;
    try {
      const result = await roastClubAction(request);
      if (run !== generation.current) return;
      if (result.status !== "accepted") {
        // Uncertain or refused: keep the same command so a retry can never double-apply.
        setUncertain(true);
        setMessage(
          result.status === "access-denied" || result.status === "auth-required"
            ? "Sign in with your account-linked player to choose."
            : "Save not confirmed. Retry the same change.",
        );
        return;
      }
      pending.current = null;
      setUncertain(false);
      const current = await roastClubAction({ type: "read", teamId });
      if (run !== generation.current) return;
      if (current.status === "ok") setValue(current.data);
      else setValue((v) => (v ? { ...v, optedIn: result.optedIn } : v));
      setMessage(result.optedIn ? "You're in Roast Club." : "You're out of Roast Club.");
    } finally {
      lock.current = false;
      if (run === generation.current) setBusy(false);
    }
  }
  if (!value || !value.canToggle) return null;
  const disabled = busy || !online;
  return (
    <div className="roast-club-controls" role="group" aria-label={teamName ? `Roast Club for ${teamName}` : "Roast Club"}>
      {teamName && <h3 data-testid="roast-club-team">Roast Club · {teamName}</h3>}
      <p>
        <strong>{value.optedIn ? "You're in Roast Club" : "Roast Club is off for you"}</strong>{teamName ? ` on ${teamName}` : ""}
      </p>
      <p className="micro">
        Optional. When it is on, clean, funny lines about your at-bats may be shown to the team, and read aloud if the scorer turns on the announcer.
        Turn it off any time and it stops right away. It never changes your stats or scoring.
      </p>
      <button
        className="button secondary"
        type="button"
        disabled={disabled}
        onClick={() =>
          void save({ type: "change", teamId, commandId: crypto.randomUUID(), optedIn: !value.optedIn })
        }
      >
        {value.optedIn ? "Leave Roast Club" : "Join Roast Club"}
      </button>
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
      {!online && <p role="status">Offline · reconnect to save.</p>}
      {uncertain && (
        <button
          className="button secondary"
          type="button"
          disabled={disabled}
          onClick={() => pending.current && void save(pending.current, true)}
        >
          Retry the same change
        </button>
      )}
    </div>
  );
}
