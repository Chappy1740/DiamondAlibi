"use client";
import { useState } from "react";
import Link from "next/link";
import { SavedGameRules } from "./saved-game-rules";
import { parseNamedPlay } from "@/lib/named-play";

const roster = [{ id: "sample-alex", display_name: "Alex Sample" }, { id: "sample-blair", display_name: "Blair Sample" }];
const proposals = [
  { id: "voice-review", title: "Review a spoken result", detail: "Show the player, result, runs and RBI before a spoken result is saved. Quick result taps stay fast.", decision: "One extra tap for voice entry. Try the example below." },
  { id: "career", title: "Career stats & rankings", detail: "Bring past seasons together with clear eligibility and tie rules.", decision: "Choose which seasons and minimum appearances count before implementation." },
  { id: "reliability", title: "Availability & reliability", detail: "Help a team plan who will show up.", decision: "Choose who can see it, how corrections work and what counts. No player rating is enabled." },
  { id: "brackets", title: "Tournament progression", detail: "Show the next round and championship path alongside games.", decision: "Choose eligible teams, seeding and advancement rules first." },
  { id: "alibis", title: "Personal alibis across devices", detail: "Keep a player’s saved alibi available when they switch devices.", decision: "Choose ownership and visibility before enabling shared storage." },
] as const;

export function GameDayReview() {
  const [choices, setChoices] = useState<string[]>([]);
  const [phrase, setPhrase] = useState("Alex home run 2 RBI");
  const [preview, setPreview] = useState<ReturnType<typeof parseNamedPlay> | null>(null);
  const [notice, setNotice] = useState("");
  return <main className="game-day-review connected-wrap">
    <header>
      <Link href="/review" className="text-link">Back to phone preview</Link>
      <p className="eyebrow">Diamond Alibi · Owner review</p>
      <h1>Easy at the field. Solid behind it.</h1>
      <p>One place to review what’s next. Keep the game moving, even when the dugout gets loud.</p>
      <p className="review-notice">Feature proposals use sample data. Selecting an idea does not change the app or any game.</p>
    </header>
    <section className="card detail-card" aria-labelledby="prepared-heading">
      <p className="eyebrow">Prepared in this change</p>
      <h2 id="prepared-heading">See the rules a game actually saved</h2>
      <p>Open Game details to check its original Beverage Rules. HR limit corrections remain separate and require a reason.</p>
      <SavedGameRules rules={{ version_label: "Sample game rules", fence_limit: 2, strikeout: 1, solo: 1, band_solo: -1, grand_slam: -1, over_limit: 1, inside_park: -1, multi_run: 0 }} />
      <p className="micro">Also prepared: browser protections against outside framing and off-site referrer leakage. Existing phone previews and voice access are preserved.</p>
    </section>
    <section aria-labelledby="choices-heading">
      <h2 id="choices-heading">Choose what to explore next</h2>
      <p>These larger changes need your decisions. Your selections stay on this screen until you leave or refresh it.</p>
      <div className="review-options">
        {proposals.map(proposal => <article className="card detail-card" key={proposal.id}>
          <label className="review-choice"><input type="checkbox" checked={choices.includes(proposal.id)} onChange={event => { setNotice(""); setChoices(current => event.target.checked ? [...current, proposal.id] : current.filter(id => id !== proposal.id)); }} /><span>{proposal.title}</span></label>
          <p>{proposal.detail}</p><p className="micro">{proposal.decision}</p>
        </article>)}
      </div>
    </section>
    <section className="card detail-card" aria-labelledby="voice-heading">
      <p className="eyebrow">Interactive sample · voice review proposal</p>
      <h2 id="voice-heading">Check it before it counts</h2>
      <p>Sample players: Alex Sample and Blair Sample. Try “Alex hit” or “Blair home run 2 RBI”. This uses the current result parser.</p>
      <form className="club-form" onSubmit={event => { event.preventDefault(); setPreview(parseNamedPlay(phrase, roster)); }}>
        <label>Sample spoken result<input maxLength={200} value={phrase} onChange={event => { setPhrase(event.target.value); setPreview(null); }} /></label>
        <button className="button secondary" type="submit">Review sample result</button>
      </form>
      <div role="status" aria-live="polite">
        {preview?.status === "invalid" && <p>{preview.message}</p>}
        {preview?.status === "ok" && <div className="review-receipt"><strong>{roster.find(player => player.id === preview.playerId)?.display_name}</strong><p>{preview.outcome} · {preview.runs} runs · {preview.rbi} RBI</p><p>Ready to confirm in the proposed flow. Nothing has been saved.</p></div>}
      </div>
    </section>
    <section className="card detail-card" aria-labelledby="return-heading">
      <h2 id="return-heading">Bring your choices back to this chat</h2>
      <label className="review-summary-label">Your review summary<textarea readOnly rows={5} value={choices.length ? "Explore next: " + proposals.filter(proposal => choices.includes(proposal.id)).map(proposal => proposal.title).join("; ") + ". Decisions still required before implementation." : "No proposals selected. Existing scoring rules and game history stay as they are."} /></label>
      <button className="button secondary" type="button" onClick={async () => { const text = "Explore next: " + proposals.filter(proposal => choices.includes(proposal.id)).map(proposal => proposal.title).join("; "); try { await navigator.clipboard.writeText(text); setNotice("Copied. Paste your choices into this chat when you’re ready."); } catch { setNotice("Copy is unavailable. Select the review summary above and copy it."); } }} disabled={!choices.length}>Copy my choices</button>
      <p role="status">{notice}</p>
      <p className="micro">Security checks and local tests do not replace real-phone, two-client, backup or hosting-capacity acceptance. Those launch checks remain open.</p>
    </section>
  </main>;
}
