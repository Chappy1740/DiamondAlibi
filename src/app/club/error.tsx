"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="connected-wrap">
      <h1>Couldn’t load your clubhouse.</h1>
      <p className="muted">
        No changes are assumed saved. Check the connection and try again.
      </p>
      <button className="button primary" onClick={reset}>
        Retry
      </button>
    </main>
  );
}
