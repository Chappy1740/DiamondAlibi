import test from "node:test";
import assert from "node:assert/strict";
import {
  projectProgress,
  milestoneProgress,
  milestoneGate,
  type ProjectTracker,
} from "../src/lib/project-status.ts";
import { projectTracker } from "../src/data/project-tracker.ts";

test("built features and acceptance gaps never earn completion credit", () => {
  const tracker = structuredClone(projectTracker);
  tracker.milestones = [tracker.milestones[0]];
  tracker.milestones[0].tasks = tracker.milestones[0].tasks.slice(0, 2);
  tracker.milestones[0].tasks[1].status = "implemented";
  assert.equal(projectProgress(tracker).percent, 50);
  assert.equal(milestoneGate(tracker, 0).ready, false);
  tracker.milestones[0].tasks[1].status = "done";
  tracker.milestones[0].tasks[1].evidence = "";
  assert.equal(projectProgress(tracker).percent, 50);
  tracker.milestones[0].tasks[1].evidence = "Acceptance recorded";
  assert.equal(projectProgress(tracker).percent, 100);
  assert.equal(milestoneGate(tracker, 0).ready, true);
});

test("later completed work cannot unlock progression past an earlier gap", () => {
  const tracker = structuredClone(projectTracker);
  tracker.milestones = tracker.milestones.slice(0, 2);
  tracker.milestones[0].tasks[0].status = "blocked";
  for (const task of tracker.milestones[1].tasks) {
    task.status = "done";
    task.evidence = "Verified";
    task.next = "";
  }
  assert.equal(milestoneProgress(tracker.milestones[1]).percent, 100);
  assert.equal(milestoneGate(tracker, 1).ready, false);
  assert.equal(projectProgress(tracker).active?.id, "M1");
});

test("empty checklists cannot claim completion; optional ideas do not inflate the denominator", () => {
  const tracker = structuredClone(projectTracker);
  const before = projectProgress(tracker);
  tracker.deferred.push({ title: "Optional idea", reason: "Future" });
  assert.deepEqual(projectProgress(tracker), before);
  tracker.milestones[0].tasks = [];
  assert.equal(milestoneProgress(tracker.milestones[0]).complete, false);
});

test("canonical tracker includes M1–M6, M4.1–M4.5, unique tasks and explicit remaining/evidence records", () => {
  assert.deepEqual(
    projectTracker.milestones.map((m) => m.id),
    ["M1", "M2", "M3", "M4", "M5", "M6"],
  );
  const tasks = projectTracker.milestones.flatMap((m) => m.tasks);
  assert.equal(new Set(tasks.map((t) => t.id)).size, tasks.length);
  for (const task of tasks)
    assert.ok(task.status === "done" ? task.evidence : task.next);
  for (let i = 1; i <= 5; i++)
    assert.ok(tasks.some((t) => t.group.startsWith(`M4.${i}`)));
  assert.ok(tasks.some((t) => t.title.includes("guest player")));
  assert.ok(tasks.some((t) => t.title.includes("career")));
  assert.ok(tasks.some((t) => t.title.includes("reliability")));
  assert.ok(tasks.some((t) => t.title.includes("advancement")));
  assert.ok(tasks.some((t) => t.title.includes("backup/restore")));
  assert.ok(projectProgress(projectTracker).percent < 100);
});
