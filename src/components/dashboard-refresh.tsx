"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
export function DashboardRefresh() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, start] = useTransition();
  const lastAutomatic = useRef(-Infinity);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine || document.visibilityState !== "visible") return;
      // Online/visibility events can arrive together when a phone wakes.
      const now = Date.now();
      if (now - lastAutomatic.current < 1000) return;
      lastAutomatic.current = now;
      start(() => router.refresh());
    };
    setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [router]);
  return (
    <div className="dashboard-refresh">
      {(!online || pending) && <span role="status">{!online ? "Offline · displayed records may be out of date" : "Refreshing…"}</span>}
      <button className="button secondary" disabled={!online || pending} onClick={() => start(() => router.refresh())}>Refresh records</button>
    </div>
  );
}
