const esbuild = require("esbuild");
const Module = require("node:module");
const assert = require("node:assert/strict");
(async () => {
  let calls = 0,
    loads = 0;
  global.__dashboardTest = {
    auth: {
      getUser: async () => {
        calls++;
        return { data: { user: { id: "member" } }, error: null };
      },
    },
    from: (table) => {
      const result =
        table === "teams"
          ? { data: [{ id: "team", name: "Synthetic" }], error: null }
          : table === "team_memberships"
            ? { data: [{ team_id: "team" }], error: null }
            : {
                data: [
                  { id: "season", name: "Synthetic season", archived: false },
                ],
                error: null,
              };
      const builder = {
        select: () => builder,
        order: () => builder,
        eq: () => builder,
        then: (resolve, reject) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    },
  };
  global.__dashboardLoad = async (team, season, scope) => {
    loads++;
    return {
      status: "ok",
      data: {
        snapshot: {
          teamId: team,
          seasonId: season,
          scope,
          totals: {},
          board: {},
          games: [],
          tournaments: [],
        },
        roster: [],
        archived: false,
        bands: [],
        participation: [],
        leagueBands: [],
      },
    };
  };
  const bundle = await esbuild.build({
    entryPoints: ["src/app/dashboard-loader.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [
      {
        name: "synthetic-authorized-loader",
        setup(build) {
          build.onResolve(
            {
              filter:
                /^(next\/headers|@\/lib\/supabase\/server|@\/app\/club\/scoring-actions)$/,
            },
            (args) => ({ path: args.path, namespace: "mock" }),
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents:
              args.path === "next/headers"
                ? "export async function cookies(){return {get(){return undefined}}}"
                : args.path.includes("supabase")
                  ? "export async function supabaseServer(){return global.__dashboardTest}"
                  : "export async function loadScorebook(...args){return global.__dashboardLoad(...args)}",
          }));
        },
      },
    ],
  });
  const compiled = new Module(__filename, module);
  compiled.filename = __filename;
  compiled.paths = module.paths;
  compiled._compile(bundle.outputFiles[0].text, __filename);
  const loader = compiled.exports.dashboardProps;
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
    oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "synthetic-placeholder";
  try {
    const sample = await loader("stats", { sample: "1" });
    assert.equal(sample.loaded.roster.length, 12);
    assert.equal(calls, 0);
    const real = await loader("stats", { scope: "League" });
    assert.equal(real.sample, false);
    assert.equal(real.loaded.snapshot.scope, "League");
    const before = loads;
    const denied = await loader("", { team: "unauthorized" });
    assert.equal(denied.loaded, null);
    assert.equal(denied.sample, false);
    assert.equal(loads, before);
    global.__dashboardLoad = async () => ({ status: "access-denied" });
    assert.equal((await loader("", {})).loaded, null);
    global.__dashboardTest.auth.getUser = async () => ({
      data: { user: null },
      error: { name: "NetworkError" },
    });
    const failed = await loader("", {});
    assert.equal(failed.sample, false);
    assert.equal(failed.loaded, null);
    assert.ok(failed.error);
    global.__dashboardTest.auth.getUser = async () => ({
      data: { user: null },
      error: { name: "AuthSessionMissingError" },
    });
    assert.equal((await loader("", {})).sample, true);
    console.log(
      "PASS: dashboard loader authorizes real context, rejects inaccessible teams, does not substitute samples after failures; explicit sample path bypasses account reads. Synthetic clients only.",
    );
  } finally {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey;
    delete global.__dashboardTest;
    delete global.__dashboardLoad;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
