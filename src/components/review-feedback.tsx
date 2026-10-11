"use client";
import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { useRef, useState } from "react";
import type { FeedbackKind, FeedbackRecord } from "@/lib/feedback";

export function ReviewFeedback({
  ready,
  owner = false,
}: {
  ready: boolean;
  owner?: boolean;
}) {
  const [kind, setKind] = useState<FeedbackKind>("suggestion");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const retry = useRef<{ body: string; id: string } | null>(null);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setNotice("");
    const body = JSON.stringify({
      kind,
      name: name.trim(),
      message: message.trim(),
    });
    if (retry.current?.body !== body)
      retry.current = { body, id: crypto.randomUUID() };
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(body), id: retry.current.id }),
      });
      const result = await response.json();
      if (!response.ok || result.sent !== true)
        throw new Error(
          result.error ?? "Not confirmed as sent. Please try again.",
        );
      setNotice("Sent to the owner. Thanks for helping improve Diamond Alibi!");
      setMessage("");
      retry.current = null;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Not confirmed as sent. Your message is still here.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="connected-wrap feedback-page">
      <Link className="button secondary" href="/review">
        Back to review
      </Link>
      {owner && (
        <Link className="button secondary" href="/owner/feedback">
          Owner inbox · Booth Reviews
        </Link>
      )}
      <header>
        <BrandLink href="/review" variant="primary" className="header-logo" />
        <p className="eyebrow">Diamond Alibi · Booth review</p>
        <h1>Challenge the Call</h1>
        <p>Question, suggestion, or issue? Send it to the owner.</p>
      </header>
      {!ready && (
        <p role="status">
          This feedback form is being prepared. Sending will be available after
          the next approved release.
        </p>
      )}
      <form className="panel" onSubmit={send}>
        <label>
          What kind of call?
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as FeedbackKind)}
            disabled={busy}
          >
            <option value="suggestion">Suggestion</option>
            <option value="question">Question</option>
            <option value="issue">Issue</option>
          </select>
        </label>
        <label>
          Your name (optional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={busy}
            autoComplete="off"
          />
        </label>
        <label>
          Your message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={7}
            required
            disabled={busy}
            aria-describedby="feedback-help"
          />
        </label>
        <p id="feedback-help" className="micro">
          Only the app owner can read submissions. For an issue, tell us what
          you tapped and what happened. Please leave out passwords, login codes,
          and private team records.
        </p>
        <p className="micro">
          {message.length.toLocaleString()} / 2,000 characters
        </p>
        <button
          className="button"
          disabled={!ready || busy || !message.trim()}
          type="submit"
        >
          {busy ? "Sending…" : "Send to the owner"}
        </button>
        <p role="status" aria-live="polite">
          {notice}
        </p>
      </form>
    </main>
  );
}

export function OwnerFeedbackInbox() {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function load(nextPage = page) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/feedback?page=${nextPage}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setItems(result.items);
      setMore(result.more);
      setPage(nextPage);
      setLoaded(true);
    } catch {
      setNotice("Inbox unavailable. Try again later.");
    } finally {
      setBusy(false);
    }
  }
  async function mark(item: FeedbackRecord) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, reviewed: !item.reviewed }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error("Unavailable");
      setItems((current) =>
        current.map((row) =>
          row.id === result.id ? { ...row, reviewed: result.reviewed } : row,
        ),
      );
    } catch {
      setNotice("Update not confirmed. Try again later.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="connected-wrap feedback-page">
      <Link className="button secondary" href="/more">
        Back to More
      </Link>
      <header>
        <BrandLink href="/" variant="primary" className="header-logo" />
        <p className="eyebrow">Diamond Alibi · Owner inbox</p>
        <h1>Booth Reviews</h1>
        <p>Questions, suggestions, and issues sent to you.</p>
      </header>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => load()}
      >
        {busy ? "Loading…" : loaded ? "Refresh inbox" : "Open inbox"}
      </button>
      <p role="status">{notice}</p>
      {loaded && !items.length && <p>No messages yet.</p>}
      {items.map((item) => (
        <article className="panel" key={item.id}>
          <p className="eyebrow">
            {item.kind} · {item.reviewed ? "Reviewed" : "New"}
          </p>
          <p>
            {item.name || "No name supplied"} ·{" "}
            {new Date(item.created_at).toLocaleString()}
          </p>
          <p className="feedback-message">{item.message}</p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => mark(item)}
          >
            {item.reviewed ? "Mark as new" : "Mark reviewed"}
          </button>
        </article>
      ))}
      {loaded && (
        <nav aria-label="Inbox pages">
          <button
            className="button secondary"
            disabled={busy || page === 0}
            onClick={() => load(page - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            className="button secondary"
            disabled={busy || !more}
            onClick={() => load(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
