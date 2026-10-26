import Link from "next/link";
import { ClubForm } from "./club-form";

type Season = {id: string; name: string; archived: boolean};
export function SeasonManager({team, seasons, selected}: {team: string; seasons: Season[]; selected?: Season}) {
  function entry(season: Season) {
    return <div className="season-actions" key={season.id}>
      <ClubForm operation="select-season" team={team} hidden={{season: season.id}}
        label={`${season.name}${season.archived ? " · archived" : ""}${season.id === selected?.id ? " · selected" : ""}`} />
      <ClubForm operation="archive-season" team={team} hidden={{season: season.id, archived: String(!season.archived)}}
        label={season.archived ? "Restore season" : "Archive season"}
        confirmation={`${season.archived ? "Restore" : "Archive"} ${season.name}? ${season.archived ? "It will return to active seasons." : "It moves to Archived seasons and scoring pauses."} Games, statistics and BEVs are retained.`} />
    </div>;
  }
  const archived = seasons.filter(s => s.archived);
  return <section className="card detail-card" id="seasons" aria-label="Season management">
    <h2>Seasons</h2>
    {selected && <Link className="button primary" href={`/club/score?${new URLSearchParams({team,season:selected.id})}`}>Open team scorebook</Link>}
    <p className="muted">Selected: {selected?.name ?? "No season yet"}. Archive hides a season from the active list. You can restore it; games, stats and BEVs stay saved.</p>
    <h3>Active seasons</h3>
    {seasons.filter(s => !s.archived).map(entry)}
    {!seasons.some(s => !s.archived) && <p>No active seasons.</p>}
    {archived.length > 0 && <details className="archive-history" id="season-history"><summary>Archived seasons ({archived.length})</summary>{archived.map(entry)}</details>}
    <ClubForm operation="create-season" team={team} label="Create season"><label>Season name<input name="name" maxLength={80} required /></label></ClubForm>
  </section>;
}
