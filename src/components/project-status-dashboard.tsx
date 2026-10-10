"use client";
import Link from "next/link";
import { BrandLink } from "./brand-link";
import { useEffect, useState } from "react";
import {
  milestoneGate,
  milestoneProgress,
  projectProgress,
  statusLabels,
  taskComplete,
  type ProjectTracker,
  type ProjectTask,
} from "@/lib/project-status";

export function ProjectStatusDashboard({
  tracker: initial,
}: {
  tracker: ProjectTracker;
}) {
  const [tracker, setTracker] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState(
    "Published status snapshot. Checks for updates every minute.",
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const poll = async () => {
      try {
        const response = await fetch("/api/project-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("application/json")
        )
          throw Error();
        const next = (await response.json()) as ProjectTracker;
        if (
          next.schemaVersion !== 1 ||
          !Number.isInteger(next.revision) ||
          !Array.isArray(next.milestones)
        )
          throw Error();
        setTracker((current) =>
          next.revision > current.revision ? next : current,
        );
      } catch {
        if (!controller.signal.aborted)
          setMessage(
            "Update check unavailable. Showing the last loaded snapshot.",
          );
      }
    };
    const timer = setInterval(() => {
      if (!document.hidden) void poll();
    }, 60_000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);
  async function refresh() {
    setBusy(true);
    try {
      const response = await fetch("/api/project-status", {
        cache: "no-store",
      });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/json")
      )
        throw Error();
      const next = (await response.json()) as ProjectTracker;
      if (
        next.schemaVersion !== 1 ||
        !Number.isInteger(next.revision) ||
        !Array.isArray(next.milestones)
      )
        throw Error();
      setTracker((current) =>
        next.revision >= current.revision ? next : current,
      );
      setMessage(
        "Latest published status checked. Local work appears after an approved release.",
      );
    } catch {
      setMessage("Update check unavailable. Showing the last loaded snapshot.");
    } finally {
      setBusy(false);
    }
  }
  const progress = projectProgress(tracker);
  const visible = (task: ProjectTask) =>
    filter === "all" ||
    (filter === "remaining"
      ? !taskComplete(task)
      : filter === "complete"
        ? taskComplete(task)
        : task.kind !== "work" && !taskComplete(task));
  return (
    <main className="connected-wrap project-status">
      <nav aria-label="Project status navigation" className="connected-header">
        <BrandLink className="compact-brand" href="/" />
        <Link className="button secondary" href="/more">
          Back to More
        </Link>
      </nav>
      <header>
        <p className="eyebrow">The full project checklist</p>
        <h1>Project status</h1>
        <p>{tracker.scope}</p>
        <p>
          Updated {tracker.updatedAt} · Revision {tracker.revision}
        </p>
      </header>
      <section className="card detail-card" aria-labelledby="overall-status">
        <h2 id="overall-status">Overall completion: {progress.percent}%</h2>
        <progress
          max={progress.total || 1}
          value={progress.completed}
          aria-label="Overall project completion"
        />
        <p>
          {progress.completed} of {progress.total} required checklist items
          verified complete · {progress.completedMilestones} of{" "}
          {tracker.milestones.length} milestones complete.
        </p>
        <p>
          Each checklist item counts equally. Built work earns completion only
          after its stated checks pass. Decisions, acceptance and launch gates
          count too. This measures completed scope, not time spent.
        </p>
        <p>
          <strong>
            Next milestone:{" "}
            {progress.active
              ? `${progress.active.id} · ${progress.active.name}`
              : "All complete"}
          </strong>
        </p>
        {progress.next && (
          <p>Next action: {progress.next.next || progress.next.title}</p>
        )}
        <p>
          Finish the earliest incomplete milestone before starting new work in
          later milestones. Existing later work stays preserved.
        </p>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void refresh()}
        >
          {busy ? "Checking…" : "Refresh status"}
        </button>
        <p role="status">{message}</p>
        <p className="micro">
          Status updates are maintained in the project checklist and appear here
          after an approved deployment. This page does not infer completion from
          commits or successful builds.
        </p>
      </section>
      <div className="status-filter">
        <label>
          Show tasks{" "}
          <select
            aria-label="Show tasks"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All tasks</option>
            <option value="remaining">Remaining tasks</option>
            <option value="gates">Open decisions and acceptance</option>
            <option value="complete">Verified complete tasks</option>
          </select>
        </label>
      </div>
      {tracker.milestones.map((milestone, index) => {
        const p = milestoneProgress(milestone),
          gate = milestoneGate(tracker, index);
        const groups = [...new Set(milestone.tasks.map((t) => t.group))];
        return (
          <section
            key={milestone.id}
            className="card detail-card status-milestone"
            aria-labelledby={`title-${milestone.id}`}
          >
            <h2 id={`title-${milestone.id}`}>
              {milestone.id} · {milestone.name} — {p.percent}%
            </h2>
            <p>{milestone.description}</p>
            <progress
              max={p.total || 1}
              value={p.completed}
              aria-label={`${milestone.id} completion`}
            />
            <p>
              {p.completed} of {p.total} required items complete.
            </p>
            <p className="status-gate">
              <strong>
                {gate.ready ? "Ready to advance" : "Not ready to advance"}
              </strong>
              {gate.previous.length > 0
                ? ` · Earlier milestones still open: ${gate.previous.map((m) => m.id).join(", ")}.`
                : !p.complete
                  ? " · Finish every remaining item and acceptance check below."
                  : " · All required checks complete."}
            </p>
            <details open={progress.active?.id === milestone.id || undefined}>
              <summary>Tasks and completion evidence ({p.total})</summary>
              {groups.map((group) => {
                const tasks = milestone.tasks.filter(
                  (t) => t.group === group && visible(t),
                );
                if (!tasks.length) return null;
                return (
                  <div key={group} className="status-group">
                    <h3>{group}</h3>
                    <ul className="status-tasks">
                      {tasks.map((task) => (
                        <li key={task.id}>
                          <div className="status-task-heading">
                            <strong>{task.title}</strong>
                            <span
                              className={`status-badge status-${task.status}`}
                            >
                              {statusLabels[task.status]}
                            </span>
                          </div>
                          <p className="micro">
                            {task.kind === "decision"
                              ? "Product decision"
                              : task.kind === "acceptance"
                                ? "Required acceptance check"
                                : "Required work"}
                          </p>
                          {task.evidence && <p>Evidence: {task.evidence}</p>}
                          {task.next && <p>Remaining: {task.next}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {!milestone.tasks.some(visible) && (
                <p>No tasks match this filter.</p>
              )}
            </details>
          </section>
        );
      })}
      <section className="card detail-card">
        <h2>Recent work</h2>
        <ul>
          {tracker.changes.map((change) => (
            <li key={change.title}>
              <strong>{change.title}</strong> · {change.milestone}
              <p>{change.status}</p>
            </li>
          ))}
        </ul>
        <p>
          Latest recorded app release: {tracker.release.commit} ·{" "}
          {tracker.release.label}. {tracker.release.status}.
        </p>
      </section>
      <section className="card detail-card">
        <h2>Future work outside these percentages</h2>
        <ul>
          {tracker.deferred.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
