"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
export function DashboardRefresh() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, start] = useTransition();
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) start(() => router.refresh());
    };
    setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const timer = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible")
        start(() => router.refresh());
    }, 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [router]);
  return (
    <div className="dashboard-refresh">
      <span role="status">
        {!online
          ? "Offline · displayed records may be out of date"
          : pending
            ? "Refreshing…"
            : "Confirmed snapshot · refreshes every 15 seconds"}
      </span>
      <button
        className="button secondary"
        disabled={!online || pending}
        onClick={() => start(() => router.refresh())}
      >
        Refresh records
      </button>
    </div>
  );
}
