"use client";
import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedbackKind, FeedbackRecord } from "@/lib/feedback";
import { feedbackAlertStatus } from "@/lib/feedback";

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
      setNotice(
        "Saved to the owner's inbox. Thanks for helping improve Diamond Alibi!",
      );
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
      {ready && (
        <Link className="button secondary" href="/review/feedback/mine">
          My feedback and replies
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

export function FeedbackInbox({ mine = false }: { mine?: boolean }) {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [alertsConfigured, setAlertsConfigured] = useState(true);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const load = useCallback(
    async (nextPage: number, signal?: AbortSignal) => {
      setBusy(true);
      setNotice("");
      try {
        const query = `page=${nextPage}${mine ? "&view=mine" : ""}`;
        const response = await fetch(`/api/feedback?${query}`, {
          cache: "no-store",
          signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (signal?.aborted) return;
        setItems(result.items);
        setMore(result.more);
        setAlertsConfigured(result.alertsConfigured === true);
        setPage(nextPage);
        setLoaded(true);
      } catch {
        if (!signal?.aborted) setNotice("Could not load feedback. Try again.");
      } finally {
        if (!signal?.aborted) setBusy(false);
      }
    },
    [mine],
  );
  useEffect(() => {
    const request = new AbortController();
    void load(0, request.signal);
    return () => request.abort();
  }, [load]);
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
      <Link
        className="button secondary"
        href={mine ? "/review/feedback" : "/more"}
      >
        {mine ? "Back to Challenge the Call" : "Back to More"}
      </Link>
      <header>
        <BrandLink href="/" variant="primary" className="header-logo" />
        <p className="eyebrow">
          Diamond Alibi · {mine ? "Booth review" : "Owner inbox"}
        </p>
        <h1>{mine ? "My feedback" : "Booth Reviews"}</h1>
        <p>
          {mine
            ? "Your submissions and any private replies from the owner."
            : "Open a submission to read it and reply privately to the sender."}
        </p>
      </header>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => load(page)}
      >
        {busy ? "Loading…" : loaded ? "Refresh inbox" : "Try again"}
      </button>
      <p role="status">{notice}</p>
      {!mine && loaded && !alertsConfigured && (
        <p role="status">
          Email alerts are not configured. Feedback is still saved in this
          inbox.
        </p>
      )}
      {loaded && !items.length && <p>No submissions yet.</p>}
      {items.map((item) => (
        <details className="panel feedback-item" key={item.id}>
          <summary>
            <strong>Open {item.kind}</strong>
            <span>
              {mine ? "" : `${item.name || "No name supplied"} · `}
              {new Date(item.created_at).toLocaleString()} ·{" "}
              {item.owner_reply
                ? "Replied"
                : item.reviewed
                  ? "Reviewed"
                  : "New"}
            </span>
          </summary>
          <p className="feedback-message">{item.message}</p>
          {mine ? (
            item.owner_reply ? (
              <FeedbackReply message={item.owner_reply} />
            ) : (
              <p>No reply yet.</p>
            )
          ) : (
            <>
              <p className="micro">{feedbackAlertStatus(item)}</p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => mark(item)}
              >
                {item.reviewed ? "Mark as new" : "Mark reviewed"}
              </button>
              <OwnerReply
                item={item}
                onSaved={(message) =>
                  setItems((current) =>
                    current.map((row) =>
                      row.id === item.id
                        ? { ...row, owner_reply: message }
                        : row,
                    ),
                  )
                }
              />
            </>
          )}
        </details>
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

function FeedbackReply({ message }: { message: string }) {
  return (
    <section className="feedback-reply">
      <h2>Owner reply</h2>
      <p className="feedback-message">{message}</p>
    </section>
  );
}

function OwnerReply({
  item,
  onSaved,
}: {
  item: FeedbackRecord;
  onSaved: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !message.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, message }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.owner_reply !== message.trim()) {
        setNotice(
          typeof result?.error === "string"
            ? result.error
            : "Reply not confirmed. Your draft is still here.",
        );
        return;
      }
      onSaved(result.owner_reply);
      setMessage("");
      setNotice("Reply saved. The submitter can read it in My feedback.");
    } catch {
      setNotice("Reply not confirmed. Your draft is still here.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="feedback-reply">
      {item.owner_reply ? (
        <FeedbackReply message={item.owner_reply} />
      ) : (
        <form onSubmit={send}>
          <label>
            Private reply
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={busy}
              maxLength={2000}
              rows={4}
              required
            />
          </label>
          <p className="micro">The submitter can read this in My feedback.</p>
          <button
            className="button"
            disabled={busy || !message.trim()}
            type="submit"
          >
            {busy ? "Sending…" : "Send private reply"}
          </button>
        </form>
      )}
      <p role="status">{notice}</p>
    </div>
  );
}
