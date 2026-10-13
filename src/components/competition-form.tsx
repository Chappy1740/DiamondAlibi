"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { scoringAction, loadScorebook } from "@/app/club/scoring-actions";
import { competitionPath, contextQuery, type CompetitionKind } from "@/lib/competitions";

export function CompetitionForm({ team, season, kind, archived, existing }: {
  team: string; season: string; kind: CompetitionKind; archived: boolean;
  existing?: { id: string; name: string; fenceLimit?: number | null; guaranteedGames?: 2 | 3 | null };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(false);
  const pending = useRef<Record<string, unknown> | null>(null);
  const locked = useRef(false);
  async function send(request: Record<string, unknown>) {
    if (locked.current) return;
    if (!navigator.onLine) { setMessage("Offline. Reconnect before saving."); return; }
    locked.current = true;
    setBusy(true);
    pending.current = request;
    try {
      const result = await scoringAction(request);
      if (result.status === "uncertain" || result.status === "unavailable") {
        setRetry(true);
        setMessage("Save could not be confirmed. Retry the same change.");
        return;
      }
      if (result.status !== "ok") {
        pending.current = null;
        setRetry(false);
        setMessage(result.status === "paused" ? "This season is archived." : "Could not save. Check your access and the form.");
        return;
      }
      // Verify the saved competition before navigating or reporting success.
      const loaded = await loadScorebook(team, season, "Overall");
      const options = loaded.status === "ok" ? kind === "League"
        ? loaded.data.snapshot.leagues : loaded.data.snapshot.tournaments : [];
      const confirmed = options?.find((c) => c.id === request.competitionId);
      if (!confirmed || confirmed.name !== request.name || confirmed.fenceLimit !== request.fenceLimit) {
        setRetry(true);
        setMessage("Save needs confirmation. Retry the same change before editing further.");
        return;
      }
      pending.current = null;
      setRetry(false);
      setMessage("Competition saved. Existing game rules are retained.");
      router.push(`${competitionPath(kind, String(request.competitionId))}?${contextQuery(team, season)}`);
      router.refresh();
    } catch {
      setRetry(true);
      setMessage("Save could not be confirmed. Retry the same change.");
    } finally { locked.current = false; setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void send({ type: "competition", teamId: team, seasonId: season,
      competitionId: existing?.id ?? crypto.randomUUID(), kind,
      name: String(form.get("name")).trim(), fenceLimit: Number(form.get("fenceLimit")),
      guaranteedGames: kind === "Tournament" ? (form.get("guaranteedGames") ? Number(form.get("guaranteedGames")) : null) : null });
  }
  return <>
    <form className="club-form" onSubmit={submit}>
      <fieldset disabled={busy || retry || archived}>
        <label>{kind} name<input name="name" maxLength={200} defaultValue={existing?.name} required /></label>
        <label>Fence HR limit<input name="fenceLimit" type="number" min={0} max={100} defaultValue={existing?.fenceLimit ?? ""} required /></label>
        {kind === "Tournament" && <label>Games guaranteed
          <select name="guaranteedGames" defaultValue={existing?.guaranteedGames ?? ""} required={!existing}>
            <option value="">{existing ? "Unspecified" : "Choose games guaranteed"}</option>
            <option value="2">2-game guaranteed</option><option value="3">3-game guaranteed</option>
          </select>
        </label>}
        <button className="button primary">{busy ? "Saving…" : existing ? "Save competition settings" : `Create ${kind.toLowerCase()}`}</button>
      </fieldset>
    </form>
    {retry && <button className="button primary" disabled={busy} onClick={() => pending.current && void send(pending.current)}>Retry the same change</button>}
    <p role="status">{message}</p>
    {existing && <p className="micro">Saved defaults apply to new games. Correct an existing game in its scorebook with a reason.</p>}
  </>;
}
