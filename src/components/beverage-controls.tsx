"use client";
import { safeGameSetupReturn } from "@/lib/game-navigation";
import { BOARD_LABELS, EXTENDED_BOARD } from "@/lib/scoring";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { beverageAction } from "@/app/club/beverage-actions";
import { DEFAULT_BOARD } from "@/lib/scoring";
import type { BeverageRequest, BeverageState } from "@/lib/team-beverage";
const labels = BOARD_LABELS;
export function BeverageControls({
  teamId,
  teamSettings = false,
  returnHref,
}: {
  teamId: string;
  teamSettings?: boolean;
  returnHref?: string;
}) {
  const setupReturnHref = safeGameSetupReturn(returnHref, teamId);
  const [value, setValue] = useState<BeverageState | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [uncertain, setUncertain] = useState(false);
  const [editing, setEditing] = useState(false);
  const generation = useRef(0),
    lock = useRef(false),
    pending = useRef<BeverageRequest | null>(null);
  useEffect(() => {
    const run = ++generation.current;
    setValue(null);
    setMessage("");
    setUncertain(false);
    setEditing(false);
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
      // Only a confirmed save and authoritative finalized readback may resume setup.
      if (result.status === "accepted" && current.status === "ok" && current.data.finalized && teamSettings && request.type === "change" && (request.change.type === "finalize" || request.change.type === "replace") && setupReturnHref) {
        const target = setupReturnHref;
        if (target) { window.location.assign(target); return; }
      }
      if (result.status === "accepted" || result.status === "conflict")
        setEditing(false);
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
    if (
      !value ||
      !value.management?.canEdit ||
      lock.current ||
      pending.current ||
      !online
    )
      return;
    const form = new FormData(event.currentTarget);
    const ruleKeys = Object.keys(value.extendedOutcomes ? EXTENDED_BOARD : DEFAULT_BOARD) as (keyof typeof EXTENDED_BOARD)[];
    const rules = Object.fromEntries(
      ruleKeys.map((key) => [key, Number(form.get(key))]),
    ) as typeof EXTENDED_BOARD;
    if (
      value.finalized &&
      ruleKeys.every((key) => rules[key] === value.rules?.[key])
    ) {
      setEditing(false);
      setMessage("No changes to save.");
      return;
    }
    void save({
      type: "change",
      teamId,
      commandId: crypto.randomUUID(),
      expectedRevision: value.revision,
      change: { type: value.finalized ? "replace" : "finalize", rules },
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
          {setupReturnHref && <a className="button secondary" href={setupReturnHref}>Back to game setup</a>}
          <div className="beverage-rules-heading">
            <h2>Current rules</h2>
            {value?.management?.canEdit && !editing && (
              <button
                className="button secondary"
                type="button"
                disabled={disabled}
                onClick={() => setEditing(true)}
              >
                {value.finalized ? "Change" : "Set Rules"}
              </button>
            )}
          </div>
          {value?.finalized ? (
            <>
              <p className="micro">
                Locked by {value.management?.lockedBy ?? "Team member"}
                {value.management?.lockedAt && (
                  <> · {new Date(value.management.lockedAt).toLocaleString()}</>
                )}
              </p>
              <dl className="beverage-rule-list">
                {Object.entries(value.rules!).map(([key, amount]) => (
                  <div key={key}>
                    <dt>{key === "strikeout" && value.extendedOutcomes ? "Unspecified strikeout (legacy)" : labels[key as keyof typeof labels]}</dt>
                    <dd>{amount}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            value && (
              <p>The team manager hasn’t locked in Beverage Rules yet.</p>
            )
          )}
          {value?.management?.canEdit && editing && (
            <form
              key={`${teamId}:${value.revision}`}
              className="club-form"
              onSubmit={finalize}
            >
              <p>
                Changes apply to new games. Existing games keep their saved
                rules and balances.
              </p>
              <fieldset disabled={disabled}>
                {Object.entries(value.extendedOutcomes ? { ...EXTENDED_BOARD, ...value.rules } : value.rules ?? DEFAULT_BOARD).map(
                  ([key, amount]) => (
                    <label key={key}>
                      {key === "strikeout" && value.extendedOutcomes ? "Unspecified strikeout (legacy)" : labels[key as keyof typeof labels]}
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
                  ),
                )}
                <div className="beverage-rules-actions">
                  <button className="button primary" type="submit">
                    {value.finalized
                      ? "Save Beverage Rules"
                      : "Finalize team Beverage Rules"}
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </fieldset>
            </form>
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
