"use client";
import { revealInvalidField } from "@/lib/form-details";
import { useEffect, useState } from "react";
import type { LoadedScorebook } from "@/lib/scorebook-view";
import type { TournamentContinuation } from "@/lib/tournament-continuation";

const labels = {
  strikeout: "Strikeout",
  solo: "Solo fence HR",
  bandSolo: "Solo fence HR with Band",
  grandSlam: "Grand slam",
  overLimit: "Over-limit HR",
  insidePark: "Inside-the-park HR",
  multiRun: "Other multi-run HR",
};
export function TournamentNextGame({
  template,
  data,
  number,
  disabled,
  submit,
  otherCompetition,
  compact = false,
}: {
  template: TournamentContinuation;
  data: LoadedScorebook;
  number: number;
  disabled: boolean;
  submit(form: FormData): Promise<boolean | undefined>;
  otherCompetition(): void;
  compact?: boolean;
}) {
  // Preserve an in-progress draft during polling and other players' saves.
  const [seed, setSeed] = useState(template);
  const [accepted, setAccepted] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(template.game.playedOn);
  const [override, setOverride] = useState(false);
  const [limit, setLimit] = useState(String(template.tournament.fenceLimit));
  useEffect(() => {
    if (!accepted) return;
    setSeed(template);
    setOverride(false);
    setLimit(String(template.tournament.fenceLimit));
    setAccepted(false);
  }, [accepted, template]);
  return (
    <form
      className={`club-form tournament-next-game${compact ? " game-setup-form" : ""}`}
      onInvalidCapture={(e) => revealInvalidField(e.target)}
      aria-label={`Next game for ${template.tournament.name}`}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const values = new FormData(form);
        if (compact) {
          values.set("date", seed.game.playedOn);
          values.set("limit", String(seed.tournament.fenceLimit));
          seed.game.lineup.forEach((id, index) => { values.append("player", id); values.set(`order-${id}`, String(index + 1)); });
          Object.entries(seed.board).forEach(([key, value]) => values.set(`board-${key}`, String(value)));
        }
        if (await submit(values)) {
          setOpponent("");
          setAccepted(true);
        }
      }}
    >
      <fieldset disabled={disabled}>
        {!compact && <p>
          Game {number} · {date} · {seed.battingMode === "manual" ? "Choose players as needed; Beverage rules retained." : "Reuses the lineup and beverage rules."}
          Tournament HR limit: {template.tournament.fenceLimit}.
        </p>}
        <label>
          Opponent
          <input
            name="opponent"
            maxLength={200}
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            required
          />
        </label>
        <button className="button primary" type="submit">Start Game {number}</button>
        {compact && <p className="setup-summary">Fence HR limit: {template.tournament.fenceLimit} · {seed.battingMode === "manual" ? "No batting order needed. HR Bands and Beverage rules retained." : "Lineup, HR Bands and Beverage rules retained."}</p>}
        {!compact && <details className="setup-details">
          <summary>Edit game settings</summary>
          <div key={seed.game.game.id}>
            <label>
              Game date
              <input
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label>
              <input
                name="overrideLimit"
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
              />
              Override HR limit for this game only
            </label>
            <label>
              Fence HR limit for this game
              <input
                name="limit"
                type="number"
                min={0}
                max={100}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                readOnly={!override}
                required
              />
            </label>
            {override && (
              <label>
                Game HR override reason
                <input name="overrideReason" maxLength={200} required />
              </label>
            )}
            <h3>{data.snapshot.capabilities?.manualBatting ? "Batting order (optional)" : "Lineup"}</h3>
            {data.roster.map((p, index) => {
              const fixed = data.bands.find(
                (b) =>
                  b.tournament_id === template.tournament.id &&
                  b.player_id === p.id,
              );
              const position = seed.game.lineup.indexOf(p.id);
              return (
                <div className="scorebook-player" key={p.id}>
                  <label>
                    <input
                      name="player"
                      type="checkbox"
                      value={p.id}
                      defaultChecked={position >= 0}
                    />
                    {p.display_name}
                  </label>
                  <label>
                    Batting position for {p.display_name}
                    <input
                      name={`order-${p.id}`}
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={position >= 0 ? position + 1 : index + 1}
                    />
                  </label>
                  {fixed ? (
                    <p className="micro">
                      {fixed.has_band ? "HR Band" : "No HR Band"} · retained
                    </p>
                  ) : (
                    <label>
                      <input name={`band-${p.id}`} type="checkbox" />
                      HR Band for {p.display_name} · first assignment
                    </label>
                  )}
                </div>
              );
            })}
            <details>
              <summary>Beverage rules for this game</summary>
              {Object.entries(seed.board).map(([key, value]) => (
                <label key={key}>
                  {labels[key as keyof typeof labels]}
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
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={otherCompetition}
          >
            Set up a different league or tournament
          </button>
        </details>}
      </fieldset>
    </form>
  );
}
