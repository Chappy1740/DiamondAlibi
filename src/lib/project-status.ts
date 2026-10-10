export type TaskStatus =
  "done" | "implemented" | "in_progress" | "blocked" | "planned";
export type ProjectTask = {
  id: string;
  group: string;
  title: string;
  status: TaskStatus;
  evidence: string;
  next: string;
  kind: "work" | "acceptance" | "decision";
};
export type ProjectMilestone = {
  id: string;
  name: string;
  description: string;
  tasks: ProjectTask[];
};
export type ProjectTracker = {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  scope: string;
  release: { commit: string; label: string; status: string };
  milestones: ProjectMilestone[];
  deferred: { title: string; reason: string }[];
  changes: { title: string; status: string; milestone: string }[];
};
export const statusLabels: Record<TaskStatus, string> = {
  done: "Verified complete",
  implemented: "Built · acceptance open",
  in_progress: "In progress",
  blocked: "Awaiting decision or check",
  planned: "Not started",
};
export function taskComplete(task: ProjectTask) {
  return (
    task.status === "done" && Boolean(task.evidence.trim()) && !task.next.trim()
  );
}
export function milestoneProgress(milestone: ProjectMilestone) {
  const total = milestone.tasks.length;
  const completed = milestone.tasks.filter(taskComplete).length;
  return {
    total,
    completed,
    percent: total ? Math.floor((completed / total) * 100) : 0,
    complete: total > 0 && completed === total,
  };
}
export function projectProgress(tracker: ProjectTracker) {
  const rows = tracker.milestones.map(milestoneProgress);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const completed = rows.reduce((n, r) => n + r.completed, 0);
  const active = tracker.milestones.find((_, i) => !rows[i].complete);
  return {
    total,
    completed,
    percent: total ? Math.floor((completed / total) * 100) : 0,
    completedMilestones: rows.filter((r) => r.complete).length,
    active,
    next: active?.tasks.find((t) => !taskComplete(t)),
  };
}
export function milestoneGate(tracker: ProjectTracker, index: number) {
  const previous = tracker.milestones
    .slice(0, index)
    .filter((m) => !milestoneProgress(m).complete);
  const own = milestoneProgress(tracker.milestones[index]);
  return { ready: own.complete && previous.length === 0, previous };
}
