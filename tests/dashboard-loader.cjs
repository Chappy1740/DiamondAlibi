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
    // Games-only picker: active memberships, cross-team/season metadata and fail-closed reads.
    const reads=[];
    let directoryError=false;
    const records={teams:[{id:'team',name:'Synthetic'},{id:'other',name:'Other team'},{id:'foreign',name:'Foreign team'},{id:'inactive',name:'Inactive team'}],
      team_memberships:[{team_id:'team',user_id:'member',active:true},{team_id:'other',user_id:'member',active:true},{team_id:'inactive',user_id:'member',active:false}],
      team_seasons:[{id:'season',team_id:'team',name:'Season',archived:false},{id:'other-season',team_id:'other',name:'Other season',archived:false},{id:'foreign-season',team_id:'foreign',name:'Forbidden',archived:false}],
      scoring_leagues:[{id:'league',team_id:'team',season_id:'season',name:'Thursday'},{id:'other-league',team_id:'other',season_id:'other-season',name:'Other league'},{id:'foreign-league',team_id:'foreign',season_id:'foreign-season',name:'Forbidden'},{id:'wrong-season-league',team_id:'team',season_id:'other-season',name:'Wrong season'}]};
    global.__dashboardTest.from=table=>{
      const filters=[];let start,end;
      const builder={select(columns){reads.push({table,columns});return builder},order(){return builder},eq(column,value){filters.push([column,value]);return builder},
        in(column,values){reads.push({table,column,values});return builder},range(first,last){start=first;end=last;return builder},
        then(resolve,reject){let rows=records[table].filter(row=>filters.every(([key,value])=>row[key]===value));if(start!==undefined)rows=rows.slice(start,end+1);return Promise.resolve({data:directoryError&&table==='scoring_leagues'?null:rows,error:directoryError&&table==='scoring_leagues'?{code:'unavailable'}:null}).then(resolve,reject)}};
      return builder;
    };
    const load=global.__dashboardLoad;
    global.__dashboardLoad=async(...args)=>{const result=await load(...args);result.data.snapshot.leagues=[{id:'league',name:'Thursday',fenceLimit:2}];return result};
    const games=await loader('games',{team:'team',season:'season',league:'league'});
    assert.equal(games.leagueId,'league');
    assert.deepEqual(games.gameContexts.map(team=>team.id),['team','other']);
    assert.deepEqual(games.gameContexts[0].seasons[0].leagues.map(league=>league.id),['league'],'foreign teams and mismatched seasons excluded');
    assert.deepEqual(games.gameContexts[1].seasons[0].leagues.map(league=>league.id),['other-league']);
    for(const query of reads.filter(read=>read.values))assert.deepEqual(query.values,['team','other'],'reads restricted to active memberships');
    reads.length=0;await loader('stats',{team:'team'});assert.equal(reads.some(read=>read.table==='scoring_leagues'),false,'other screens avoid picker reads');
    assert.equal((await loader('games',{team:'team',league:'other-league'})).loaded,null,'another team league cannot select Games context');
    const earlierLoads=loads;assert.equal((await loader('games',{team:'foreign'})).loaded,null);assert.equal(loads,earlierLoads,'foreign team cannot load a scorebook');
    directoryError=true;
    const unavailable=await loader('games',{team:'team'});assert.deepEqual(unavailable.gameContexts,[]);assert.ok(unavailable.gameContextError);assert.ok(unavailable.loaded,'directory failure does not replace confirmed scorebook');
    const fixture=await loader('games',{sample:'1'});assert.equal(fixture.gameContexts.length,1);assert.equal(fixture.gameContexts[0].seasons.length,4);
    assert.equal((await loader('games',{sample:'1',league:'foreign'})).loaded,null);
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
