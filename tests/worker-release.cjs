const test = require("node:test");
const assert = require("node:assert/strict");
const { release } = require("../scripts/deploy-worker.cjs");
const policy = require("../scripts/worker-release-policy.json");

const sha = "a".repeat(40);
const otherSha = "b".repeat(40);
function successfulRun(overrides = {}) {
  return {
    id: 123,
    run_attempt: 1,
    head_sha: sha,
    head_branch: "main",
    event: "push",
    path: ".github/workflows/personal-workflow.yml",
    status: "completed",
    conclusion: "success",
    repository: { full_name: "Chappy1740/DiamondAlibi" },
    head_repository: { full_name: "Chappy1740/DiamondAlibi" },
    ...overrides,
  };
}
function harness(options = {}) {
  let time = 0;
  let polls = 0;
  let refs = 0;
  const deployments = [];
  const calls = [];
  const args = {
    env: {
      WORKERS_CI: "1",
      WORKERS_CI_BRANCH: "main",
      WORKERS_CI_COMMIT_SHA: sha,
      WORKERS_CI_BUILD_UUID: "synthetic-build",
      ...options.env,
    },
    git: (ref) =>
      ref === "HEAD"
        ? options.head || sha
        : options.migrationTree || policy.approvedMigrationTree,
    get: async (route) => {
      calls.push(route);
      if (options.failApi) throw new Error("Synthetic API failure");
      if (route === "git/ref/heads/main") {
        refs++;
        return {
          ref: "refs/heads/main",
          object: { sha: options.superseded && refs > 1 ? otherSha : sha },
        };
      }
      if (route.includes("/jobs?")) {
        return (
          options.jobs || {
            total_count: 1,
            jobs: [
              {
                name: "validate",
                head_sha: sha,
                status: "completed",
                conclusion: "success",
              },
            ],
          }
        );
      }
      if (route.startsWith("actions/workflows/")) {
        polls++;
        const runs = options.runs ? options.runs(polls) : [successfulRun()];
        return { total_count: runs.length, workflow_runs: runs };
      }
      throw new Error(`Unexpected route ${route}`);
    },
    wait: async (ms) => {
      time += ms;
    },
    now: () => time,
    log: () => {},
    timeoutMs: 100_000,
    deploy: async (candidate) => {
      deployments.push(candidate);
    },
  };
  return {
    run: () => release(args),
    deployments,
    calls,
    get polls() {
      return polls;
    },
  };
}

test("deploys only after complete exact-main validation and final source recheck", async () => {
  const h = harness();
  await h.run();
  assert.deepEqual(h.deployments, [sha]);
  assert.equal(h.calls.at(-1), "git/ref/heads/main");
  assert.ok(h.calls.some((route) => route.includes("/123/attempts/1/jobs?")));
});

test("waits for a missing/queued main workflow, then deploys its successful completion", async () => {
  const h = harness({
    runs: (poll) =>
      poll === 1
        ? []
        : [
            successfulRun(
              poll === 2 ? { status: "in_progress", conclusion: null } : {},
            ),
          ],
  });
  await h.run();
  assert.deepEqual(h.deployments, [sha]);
  assert.equal(h.polls, 4);
});

for (const [name, options, message] of [
  ["local execution", { env: { WORKERS_CI: undefined } }, /main Workers Build/],
  [
    "branch preview",
    { env: { WORKERS_CI_BRANCH: "feature" } },
    /main Workers Build/,
  ],
  [
    "missing source",
    { env: { WORKERS_CI_COMMIT_SHA: undefined } },
    /main Workers Build/,
  ],
  [
    "abbreviated source",
    { env: { WORKERS_CI_COMMIT_SHA: "aaaaaaa" } },
    /main Workers Build/,
  ],
  [
    "missing build identity",
    { env: { WORKERS_CI_BUILD_UUID: undefined } },
    /main Workers Build/,
  ],
  [
    "another Worker environment",
    { env: { CLOUDFLARE_ENV: "staging" } },
    /main Workers Build/,
  ],
  ["mismatched checkout", { head: otherSha }, /checkout/],
  [
    "unapproved migration source",
    { migrationTree: otherSha },
    /Separate database approval/,
  ],
  ["unavailable GitHub evidence", { failApi: true }, /API failure/],
  ["newer main after validation", { superseded: true }, /latest main/],
  ["validation timeout", { runs: () => [] }, /wait expired/],
]) {
  test(`does not deploy: ${name}`, async () => {
    const h = harness(options);
    await assert.rejects(h.run(), message);
    assert.deepEqual(h.deployments, []);
  });
}

for (const conclusion of [
  "failure",
  "cancelled",
  "skipped",
  "timed_out",
  "neutral",
  null,
]) {
  test(`does not deploy a completed workflow with conclusion ${conclusion}`, async () => {
    const h = harness({ runs: () => [successfulRun({ conclusion })] });
    await assert.rejects(h.run(), /did not succeed/);
    assert.deepEqual(h.deployments, []);
  });
}

for (const mismatch of [
  { head_sha: otherSha },
  { head_branch: "feature" },
  { event: "pull_request" },
  { path: ".github/workflows/another.yml" },
  { repository: { full_name: "other/repo" } },
  { head_repository: { full_name: "other/repo" } },
]) {
  test(`rejects mismatched workflow identity: ${JSON.stringify(mismatch)}`, async () => {
    const h = harness({ runs: () => [successfulRun(mismatch)] });
    await assert.rejects(h.run(), /identity/);
    assert.deepEqual(h.deployments, []);
  });
}

test("an older success cannot authorize a newer pending run", async () => {
  const h = harness({
    runs: () => [
      successfulRun(),
      successfulRun({ id: 124, status: "queued", conclusion: null }),
    ],
  });
  await assert.rejects(h.run(), /wait expired/);
  assert.deepEqual(h.deployments, []);
});

for (const change of [
  { id: 124 },
  { run_attempt: 2 },
  { status: "in_progress", conclusion: null },
]) {
  test(`stops when validation changes before deployment: ${JSON.stringify(change)}`, async () => {
    const h = harness({
      runs: (poll) => [successfulRun(poll > 1 ? change : {})],
    });
    await assert.rejects(h.run(), /Validation changed/);
    assert.deepEqual(h.deployments, []);
  });
}

for (const jobs of [
  { total_count: 0, jobs: [] },
  {
    total_count: 1,
    jobs: [
      {
        name: "validate",
        head_sha: otherSha,
        status: "completed",
        conclusion: "success",
      },
    ],
  },
  {
    total_count: 1,
    jobs: [
      {
        name: "validate",
        head_sha: sha,
        status: "completed",
        conclusion: "skipped",
      },
    ],
  },
  {
    total_count: 101,
    jobs: [
      {
        name: "validate",
        head_sha: sha,
        status: "completed",
        conclusion: "success",
      },
    ],
  },
]) {
  test(`requires successful validate job and complete evidence: ${JSON.stringify(jobs)}`, async () => {
    const h = harness({ jobs });
    await assert.rejects(h.run(), /Required validate job/);
    assert.deepEqual(h.deployments, []);
  });
}
