"use client";

import { useId, useRef, useState } from "react";
import { DashboardSelect } from "./dashboard-select";

export type GameContextTeam = {
  id: string;
  name: string;
  seasons: {
    id: string;
    name: string;
    archived: boolean;
    leagues: { id: string; name: string }[];
  }[];
};

export function GameContextPicker({
  teams,
  teamId,
  seasonId,
  leagueId = "",
  scope,
  sample,
  player,
  error,
}: {
  teams: GameContextTeam[];
  teamId: string;
  seasonId: string;
  leagueId?: string;
  scope: string;
  sample: boolean;
  player: string;
  error?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [team, setTeam] = useState(teamId);
  const [season, setSeason] = useState(seasonId);
  const [league, setLeague] = useState(leagueId);
  const selected = teams.find((option) => option.id === team);
  const selectedSeason = selected?.seasons.find(
    (option) => option.id === season,
  );
  function chooseTeam(value: string) {
    const next = teams.find((option) => option.id === value);
    setTeam(value);
    setSeason(
      next?.seasons.find((option) => !option.archived)?.id ??
        next?.seasons[0]?.id ??
        "",
    );
    setLeague("");
  }
  return (
    <div className="games-team-picker">
      <button
        type="button"
        className="button secondary"
        ref={trigger}
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => {
          setTeam(teamId);
          setSeason(seasonId);
          setLeague(leagueId);
          dialog.current?.showModal();
        }}
      >
        Choose team or league
      </button>
      <dialog
        ref={dialog}
        id={id}
        aria-labelledby={`${id}-title`}
        className="preview-dialog games-team-dialog"
        onClose={() => trigger.current?.focus()}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <h2 id={`${id}-title`}>Choose team or league</h2>
        <p className="micro">
          Choose where you play. You’ll return to Games before starting
          anything.
        </p>
        {sample && <p className="micro">Fictional sample teams · read only.</p>}
        {error ? (
          <p role="alert">{error} Close and refresh to retry.</p>
        ) : !teams.length ? (
          <p>No teams available. Join or create a team in your clubhouse.</p>
        ) : null}
        <form action="/games" method="get" className="games-picker-form">
          <input type="hidden" name="scope" value={scope} />
          {sample && (
            <>
              <input type="hidden" name="sample" value="1" />
              <input type="hidden" name="player" value={player} />
            </>
          )}
          {!error && teams.length > 0 && (
            <>
              <fieldset className="games-picker-teams">
                <legend>Your teams</legend>
                <div>
                  {teams.map((option) => (
                    <label key={option.id}>
                      <input
                        type="radio"
                        name="team"
                        value={option.id}
                        checked={team === option.id}
                        onChange={() => chooseTeam(option.id)}
                      />
                      <span>{option.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <DashboardSelect
                label="Season"
                name="season"
                value={season}
                disabled={!selected?.seasons.length}
                options={
                  selected?.seasons.map((option) => ({
                    id: option.id,
                    name: `${option.name}${option.archived ? " · history" : ""}`,
                  })) ?? []
                }
                onChange={(value) => {
                  setSeason(value);
                  setLeague("");
                }}
              />
              {!selected?.seasons.length && (
                <p>
                  This team has no seasons yet. Open your clubhouse to set one
                  up.
                </p>
              )}
              <DashboardSelect
                label="League"
                name="league"
                value={league}
                disabled={!selectedSeason}
                options={[
                  { id: "", name: "All leagues" },
                  ...(selectedSeason?.leagues ?? []),
                ]}
                onChange={setLeague}
              />
              {selectedSeason && !selectedSeason.leagues.length && (
                <p className="micro">
                  No named leagues in this season yet. All league games remain
                  available.
                </p>
              )}
              {selectedSeason?.archived && (
                <p className="micro">Archived season · history only.</p>
              )}
            </>
          )}
          <div className="games-picker-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button
              className="button primary"
              disabled={!!error || !selectedSeason}
            >
              Use selection
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
