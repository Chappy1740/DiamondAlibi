"use client";
import { useEffect, useRef, useState } from "react";
import { ALIBI_CATEGORIES, ALIBI_PHRASES, type AlibiCategory, type AlibiPage, type AlibiResult, type PersonalAlibi } from "@/lib/personal-alibis";

export function AlibiEditor({ initial = { status: "setup-required" }, saveAction, reloadAction }: {
  initial?: AlibiPage; saveAction?: (input: unknown) => Promise<AlibiResult>;
  reloadAction?: (offset?: number) => Promise<AlibiPage>;
}) {
  const [category, setCategory] = useState<AlibiCategory>("New Gear");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<PersonalAlibi | null>(null);
  const [items, setItems] = useState(initial.status === "ok" ? initial.items : []);
  const [hasMore, setHasMore] = useState(initial.status === "ok" && initial.hasMore);
  const [available, setAvailable] = useState(initial.status === "ok");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [retry, setRetry] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const pending = useRef<unknown>(null);
  const locked = useRef(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);
  const disabled = busy || retry;
  function open(item: PersonalAlibi | null) {
    setSelected(item); setTitle(item?.title ?? ""); setBody(item?.body ?? "");
    setCategory(item?.category ?? "New Gear"); setDeleteConfirm(false); setMessage("");
  }
  async function reload(more = false) {
    if (!reloadAction || locked.current) return;
    locked.current = true; setBusy(true);
    try {
      const result = await reloadAction(more ? items.length : 0);
      if (result.status === "ok") {
        setItems(more ? [...items, ...result.items.filter((i) => !items.some((old) => old.id === i.id))] : result.items);
        setAvailable(true); setHasMore(result.hasMore);
        setMessage("Saved alibis refreshed. Your draft stays in the editor.");
      } else {
        setAvailable(false);
        if (result.status === "auth-required") setItems([]);
        setMessage("Could not load saved alibis. Your draft stays here; retry after reconnecting or signing in.");
      }
    } finally { locked.current = false; setBusy(false); }
  }
  async function send(request: unknown) {
    if (!saveAction || locked.current || !available) return;
    if (!navigator.onLine) { setMessage("Offline. Reconnect before saving; your draft stays here."); return; }
    locked.current = true; setBusy(true); pending.current = request;
    try {
      const result = await saveAction(request);
      if (result.status === "uncertain" || result.status === "unavailable") {
        setRetry(true); setMessage("Save could not be confirmed. Retry the same change before editing further."); return;
      }
      setRetry(false); pending.current = null;
      if (result.status === "saved") {
        setSelected(result.item); setTitle(result.item.title); setBody(result.item.body);
        setItems((old) => [result.item, ...old.filter((i) => i.id !== result.item.id)]);
        setMessage("Alibi saved to your account.");
      } else if (result.status === "deleted") {
        const id = (request as { id: string }).id;
        setItems((old) => old.filter((i) => i.id !== id)); open(null); setMessage("Alibi deleted.");
      } else if (result.status === "conflict") {
        setMessage("This alibi changed on another device. Refresh the list and reopen its latest version before editing. Copy your draft first to keep it.");
      } else {
        if (result.status === "auth-required" || result.status === "setup-required") { setAvailable(false); setItems([]); }
        setMessage("Could not save this change. Your draft stays here; check your connection and account.");
      }
    } catch { setRetry(true); setMessage("Save could not be confirmed. Retry the same change."); }
    finally { locked.current = false; setBusy(false); setDeleteConfirm(false); }
  }
  return <>
    <div className="page-heading"><div><span className="eyebrow">Your side of the story</span><h1>My alibis</h1><p>Write your own or give the generator a turn.</p></div></div>
    <section className="card detail-card alibi-editor">
      <h2>{selected ? "Edit alibi" : "Write an alibi"}</h2>
      {!available && <p className="connection-notice">{initial.status === "auth-required" ? "Sign in to save your alibis." : initial.status === "unavailable" ? "Saved alibis are unavailable. Refresh to retry." : "Saving is being prepared. You can write, generate, copy and share now."}</p>}
      <label>Title <span className="micro">Optional</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} disabled={disabled} /></label>
      <label>Category<select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as AlibiCategory)} disabled={disabled}>{ALIBI_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <button className="button secondary" disabled={disabled} onClick={() => {
        const pool = ALIBI_PHRASES[category].filter((phrase) => phrase !== body);
        setBody(pool[Math.floor(Math.random() * pool.length)]); setMessage("");
      }}>Plead the Fifth? Nah. Generate an Alibi.</button>
      <label>Your alibi<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={4000} disabled={disabled} /></label>
      {body && <blockquote aria-live="polite">“{body}”</blockquote>}
      <div className="action-row">
        <button className="button primary" disabled={disabled || !available || !body.trim()} onClick={() => void send({ action: "save", id: selected?.id ?? crypto.randomUUID(), commandId: crypto.randomUUID(), revision: selected?.revision ?? 0, title, body, category })}>{busy ? "Working…" : "Save alibi"}</button>
        <button className="button secondary" disabled={disabled} onClick={() => open(null)}>New alibi</button>
        {body && <>
          <button className="button secondary" disabled={busy} onClick={async () => { try { await navigator.clipboard.writeText(body); setMessage("Alibi copied. Your defense is ready."); } catch { setMessage("Clipboard unavailable. Select the alibi text and copy it manually."); } }}>Copy alibi</button>
          <button className="button secondary" disabled={busy || !canShare} onClick={async () => { try { await navigator.share({ text: body }); setMessage("Share action handed to your device."); } catch (error) { setMessage(error instanceof DOMException && error.name === "AbortError" ? "Sharing canceled. Your alibi stayed here." : "Sharing unavailable. Try copying the alibi instead."); } }}>Share alibi</button>
        </>}
        {selected && <button className="button secondary" disabled={disabled || !available} onClick={() => setDeleteConfirm(true)}>Delete alibi</button>}
      </div>
      {deleteConfirm && selected && <div role="group" aria-label="Confirm alibi deletion"><p>Delete this saved alibi from your account?</p><button className="button secondary" disabled={disabled} onClick={() => setDeleteConfirm(false)}>Keep alibi</button><button className="button secondary" disabled={disabled} onClick={() => void send({ action: "delete", id: selected.id, revision: selected.revision })}>Confirm delete</button></div>}
      {retry && <button className="button primary" disabled={busy} onClick={() => void send(pending.current)}>Retry the same change</button>}
      <p role="status">{message}</p>
      <p className="micro">Saved alibis are private to your account across devices. Copy or share only when you choose. Unsaved drafts stay on this page until you leave or reload.</p>
    </section>
    {reloadAction && <section className="card detail-card"><div className="scorebook-toolbar"><h2>Saved alibis</h2><button className="button secondary" disabled={disabled} onClick={() => void reload()}>Refresh saved alibis</button></div>
      {available && !items.length && <p>No saved alibis yet.</p>}
      <div className="alibi-list">{items.map((item) => <button className="alibi-saved" key={item.id} disabled={disabled} onClick={() => open(item)}><strong>{item.title || "Untitled alibi"}</strong><span>{item.category} · {item.updated_at.slice(0, 10)}</span><p>{item.body}</p><span className="text-link">Reopen & edit →</span></button>)}</div>
      {hasMore && <button className="button secondary" disabled={disabled} onClick={() => void reload(true)}>Load older alibis</button>}
    </section>}
  </>;
}
