"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { beverageAction } from "@/app/club/beverage-actions";
import { DEFAULT_BOARD } from "@/lib/scoring";
import type { BeverageRequest, BeverageState } from "@/lib/team-beverage";
const labels = {
  strikeout: "Strikeout",
  solo: "Solo fence HR",
  bandSolo: "Solo fence HR with Band",
  grandSlam: "Grand slam",
  overLimit: "Over-limit HR",
  insidePark: "Inside-the-park HR",
  multiRun: "Other multi-run HR",
};
export function BeverageControls({
  teamId,
  teamSettings = false,
}: {
  teamId: string;
  teamSettings?: boolean;
}) {
  const [value, setValue] = useState<BeverageState | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [uncertain, setUncertain] = useState(false);
  const generation = useRef(0),
    lock = useRef(false),
    pending = useRef<BeverageRequest | null>(null);
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
    void beverageAction({ type: "read", teamId }).then((result) => {
      if (run !== generation.current) return;
      if (result.status === "ok") setValue(result.data);
      // Until the specifically approved migration exists, do not offer a fake toggle.
      else if (result.status !== "unsupported")
        setMessage("Could not load Beverage settings. Refresh to retry.");
    });
    return () => {
      ++generation.current;
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, [teamId]);
  async function save(request: BeverageRequest, retry = false) {
    if (lock.current || !online || (!retry && pending.current)) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    pending.current = request;
    const run = generation.current;
    const result = await beverageAction(request);
    if (run !== generation.current) return;
    if (result.status === "uncertain" || result.status === "unavailable") {
      setUncertain(true);
      setMessage("Save not confirmed. Retry the same change.");
    } else {
      pending.current = null;
      setUncertain(false);
      const current = await beverageAction({ type: "read", teamId });
      if (run !== generation.current) return;
      if (current.status === "ok") setValue(current.data);
      setMessage(
        result.status === "accepted"
          ? current.status === "ok"
            ? "Saved."
            : "Saved. Refresh to see your current settings."
          : result.status === "conflict"
            ? "Settings changed. Review the current choice before trying again."
            : result.status === "paused"
              ? "Finish games using different Beverage rules before finalizing these team rules."
              : result.status === "auth-required"
                ? "Sign in again to save."
                : "Could not save. Refresh and check your team access.",
      );
    }
    lock.current = false;
    setBusy(false);
  }
  function finalize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value) return;
    const form = new FormData(event.currentTarget);
    const rules = Object.fromEntries(
      Object.keys(DEFAULT_BOARD).map((key) => [key, Number(form.get(key))]),
    ) as typeof DEFAULT_BOARD;
    void save({
      type: "change",
      teamId,
      commandId: crypto.randomUUID(),
      expectedRevision: value.revision,
      change: { type: "finalize", rules },
    });
  }
  if (!value && !message) return null;
  const disabled = busy || uncertain || !online;
  return (
    <section
      className={
        teamSettings
          ? "card detail-card beverage-controls"
          : "beverage-controls"
      }
      aria-label={
        teamSettings ? "Team Beverage Rules" : "My Beverage participation"
      }
    >
      {teamSettings ? (
        <>
          <h2>Beverage Rules</h2>
          {value?.finalized ? (
            <>
              <p>
                Your team’s finalized rules apply to league and tournament
                games.
              </p>
              <dl className="beverage-rule-list">
                {Object.entries(value.rules!).map(([key, amount]) => (
                  <div key={key}>
                    <dt>{labels[key as keyof typeof labels]}</dt>
                    <dd>{amount}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            value && (
              <form className="club-form" onSubmit={finalize}>
                <p>
                  Agree on these rules with your team, then finalize them once.
                  Existing game history is retained.
                </p>
                <fieldset disabled={disabled}>
                  {Object.entries(DEFAULT_BOARD).map(([key, amount]) => (
                    <label key={key}>
                      {labels[key as keyof typeof labels]}
                      <input
                        type="number"
                        name={key}
                        min={-100}
                        max={100}
                        step={1}
                        defaultValue={amount}
                        required
                      />
                    </label>
                  ))}
                  <button className="button primary" type="submit">
                    Finalize team Beverage Rules
                  </button>
                </fieldset>
              </form>
            )
          )}
        </>
      ) : (
        value && (
          <>
            <p>
              <strong>
                {value.participating
                  ? "Participating in Beverage Rules"
                  : "Opted out of Beverage Rules"}
              </strong>
            </p>
            <p className="micro">
              Changes apply to future at-bats. Your existing balance and player
              stats stay intact.
            </p>
            {value.canToggle ? (
              <button
                className="button secondary"
                type="button"
                disabled={disabled}
                onClick={() =>
                  void save({
                    type: "change",
                    teamId,
                    commandId: crypto.randomUUID(),
                    expectedRevision: value.revision,
                    change: {
                      type: "participation",
                      participating: !value.participating,
                    },
                  })
                }
              >
                {value.participating ? "Opt out" : "Participate"}
              </button>
            ) : (
              <p className="micro">
                Sign in with your account-linked player to choose participation.
              </p>
            )}
          </>
        )
      )}
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
      {!online && <p role="status">Offline · reconnect to save.</p>}
      {uncertain && (
        <button
          className="button secondary"
          disabled={busy || !online}
          type="button"
          onClick={() => pending.current && void save(pending.current, true)}
        >
          Retry the same change
        </button>
      )}
    </section>
  );
}
