// loadScorebook must ask only for the chosen season's games. Synthetic client only.
const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const Module = require("node:module");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
(async () => {
  const bundle = await esbuild.build({
    entryPoints: ["src/app/club/scoring-actions.ts"],
    bundle: true, write: false, platform: "node", format: "cjs",
    plugins: [{ name: "synthetic-client", setup(build) {
      build.onResolve({ filter: /^@\/lib\/supabase\/server$/ }, (args) => ({ path: args.path, namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export async function supabaseServer(){return global.__scorebookClient}" }));
    } }],
  });
  const compiled = new Module(__filename, module);
  compiled.filename = __filename; compiled.paths = module.paths;
  compiled._compile(bundle.outputFiles[0].text, __filename);
  const load = (seasonGames) => {
    const filters = {};
    // The fake ignores the filter on purpose: other-season rows must still be dropped.
    const rows = { scoring_game_players: [{ game_id: id(1), player_id: "p" }, { game_id: id(999), player_id: "old" }], scoring_bands: [{ game_id: id(999), player_id: "old" }] };
    global.__scorebookClient = {
      auth: { getUser: async () => ({ data: { user: { id: "member" } }, error: null }) },
      rpc: async () => ({ data: { games: seasonGames.map((game) => ({ game: { id: game } })) }, error: null }),
      from(table) {
        let first = 0;
        const builder = { select: () => builder, eq: () => builder, order: () => builder,
          in(column, values) { filters[table] = [column, values]; return builder; },
          range(start) { first = start; return builder; },
          maybeSingle: async () => ({ data: { archived: false }, error: null }),
          then: (resolve, reject) => Promise.resolve({ data: first ? [] : (rows[table] ?? []), error: null }).then(resolve, reject) };
        return builder;
      },
    };
    return compiled.exports.loadScorebook(id(10), id(11), "Overall").then((result) => ({ result, filters }));
  };
  const season = await load([id(1), id(2)]);
  assert.equal(season.result.status, "ok");
  for (const table of ["scoring_game_players", "scoring_bands"])
    assert.deepEqual(season.filters[table], ["game_id", [id(1), id(2)]], `${table} is limited to this season's games`);
  assert.deepEqual(season.result.data.participation, [{ game_id: id(1), player_id: "p" }]);
  assert.deepEqual(season.result.data.leagueBands, []);
  const huge = await load(Array.from({ length: 151 }, (_, n) => id(n + 1)));
  assert.equal(huge.result.status, "ok");
  assert.deepEqual(huge.filters, {}, "a very large season falls back to the unfiltered read");
  console.log("PASS: scorebook metadata reads are limited to the selected season's games. Synthetic client only.");
})().catch((error) => { console.error(error); process.exit(1); });
