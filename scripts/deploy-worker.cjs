// Workers Builds only. No new credentials or packages; unavailable evidence stops release.
const { execFileSync, spawnSync } = require("node:child_process");
const path = require("node:path");
const { setTimeout: sleep } = require("node:timers/promises");
const policy = require("./worker-release-policy.json");

const repository = "Chappy1740/DiamondAlibi";
const workflow = "personal-workflow.yml";
const root = path.resolve(__dirname, "..");
const shaPattern = /^[a-f0-9]{40}$/;

function buildContext(env, git) {
  const sha = env.WORKERS_CI_COMMIT_SHA;
  if (
    env.WORKERS_CI !== "1" ||
    env.WORKERS_CI_BRANCH !== "main" ||
    !shaPattern.test(sha || "") ||
    !env.WORKERS_CI_BUILD_UUID ||
    env.CLOUDFLARE_ENV
  ) {
    throw new Error(
      "Automatic release requires a main Workers Build with an exact commit and default Worker environment.",
    );
  }
  if (git("HEAD") !== sha)
    throw new Error("Build checkout does not match its source commit.");
  if (
    !shaPattern.test(policy.approvedMigrationTree) ||
    git("HEAD:supabase/migrations") !== policy.approvedMigrationTree
  ) {
    throw new Error(
      "Migration source changed. Separate database approval, application and verification are required before updating worker-release-policy.json.",
    );
  }
  return sha;
}

async function githubGet(route) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/${route}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DiamondAlibi-release-gate",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );
  // Never log response bodies, credentials, or environment variables.
  if (!response.ok)
    throw new Error(
      `GitHub release evidence unavailable (HTTP ${response.status}).`,
    );
  return response.json();
}

async function requireLatestMain(get, sha) {
  const ref = await get("git/ref/heads/main");
  if (ref.ref !== "refs/heads/main" || ref.object?.sha !== sha) {
    throw new Error(
      "Build is no longer the latest main commit; refusing an older release.",
    );
  }
}

function latestRun(data, sha) {
  if (
    !Array.isArray(data.workflow_runs) ||
    data.total_count !== data.workflow_runs.length ||
    data.total_count > 10
  ) {
    throw new Error("Ambiguous workflow evidence.");
  }
  const runs = data.workflow_runs;
  for (const run of runs) {
    if (
      run.head_sha !== sha ||
      run.head_branch !== "main" ||
      run.event !== "push" ||
      run.path !== `.github/workflows/${workflow}` ||
      run.repository?.full_name !== repository ||
      run.head_repository?.full_name !== repository ||
      !Number.isSafeInteger(run.id) ||
      !Number.isSafeInteger(run.run_attempt)
    ) {
      throw new Error("Workflow identity does not match the exact main build.");
    }
  }
  return runs.sort((a, b) => b.id - a.id)[0];
}

async function release({
  env,
  git,
  get,
  wait,
  now,
  deploy,
  log,
  timeoutMs = 15 * 60_000,
}) {
  const sha = buildContext(env, git);
  const route = `actions/workflows/${workflow}/runs?branch=main&event=push&head_sha=${sha}&per_page=10`;
  const deadline = now() + timeoutMs;
  await requireLatestMain(get, sha);
  let run;
  while (now() < deadline) {
    run = latestRun(await get(route), sha);
    if (run?.status === "completed") {
      if (run.conclusion !== "success")
        throw new Error(
          "Exact main validation did not succeed; release stopped.",
        );
      break;
    }
    log("Waiting for complete GitHub validation of this main commit.");
    await wait(Math.min(45_000, Math.max(0, deadline - now())));
  }
  if (!run || run.status !== "completed" || now() >= deadline) {
    throw new Error(
      "Validation wait expired; current deployment remains unchanged. Retry the build after checks succeed.",
    );
  }
  const jobs = await get(
    `actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`,
  );
  if (
    !Array.isArray(jobs.jobs) ||
    jobs.total_count !== jobs.jobs.length ||
    !jobs.jobs.some(
      (job) =>
        job.name === "validate" &&
        job.head_sha === sha &&
        job.status === "completed" &&
        job.conclusion === "success",
    )
  ) {
    throw new Error(
      "Required validate job did not succeed for this source and attempt.",
    );
  }
  // A newer run or a rerun must not be authorized by an older green receipt.
  const currentRun = latestRun(await get(route), sha);
  if (
    currentRun?.id !== run.id ||
    currentRun.run_attempt !== run.run_attempt ||
    currentRun.status !== "completed" ||
    currentRun.conclusion !== "success"
  ) {
    throw new Error(
      "Validation changed during release verification; release stopped.",
    );
  }
  buildContext(env, git);
  await requireLatestMain(get, sha);
  log(
    `Validated ${sha}; GitHub run ${run.id}, attempt ${run.run_attempt}; Workers Build ${env.WORKERS_CI_BUILD_UUID}.`,
  );
  await deploy(sha);
}

if (require.main === module) {
  release({
    env: process.env,
    git: (ref) =>
      execFileSync("git", ["rev-parse", ref], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
    get: githubGet,
    wait: sleep,
    now: Date.now,
    log: console.log,
    deploy: (sha) => {
      const result = spawnSync(
        process.execPath,
        [
          path.join(root, "node_modules", "wrangler", "bin", "wrangler.js"),
          "deploy",
          "--config",
          path.join(root, "wrangler.jsonc"),
          "--name",
          "diamond-alibi-preview",
          "--keep-vars",
          "--no-autoconfig",
          "--message",
          `Validated main ${sha}`,
        ],
        {
          cwd: root,
          stdio: "inherit",
          env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
        },
      );
      if (result.error) throw result.error;
      if (result.status !== 0)
        throw new Error(
          "Worker deployment failed; inspect the build receipt before retrying.",
        );
    },
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { release };
