// Real server-action adapter with isolated auth/RPC/cache/cookie transports.
const esbuild = require("esbuild"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
(async () => {
  let state;
  const reset = () =>
    (state = {
      user: { id: "synthetic-account" },
      rpcCalls: [],
      result: { data: [{ code: "a".repeat(36) }], error: null },
      revalidations: [],
      cookies: [],
    });
  reset();
  const built = await esbuild.build({
    entryPoints: ["src/app/club/actions.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [
      {
        name: "isolated",
        setup(b) {
          b.onResolve(
            { filter: /^(next\/(headers|cache)|@\/lib\/supabase\/server)$/ },
            (a) => ({ path: a.path, namespace: "mock" }),
          );
          b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
            contents:
              a.path === "next/headers"
                ? "exports.cookies=async()=>global.__cookies()"
                : a.path === "next/cache"
                  ? "exports.revalidatePath=(...args)=>global.__revalidate(...args)"
                  : "exports.supabaseServer=async()=>global.__supabase()",
          }));
        },
      },
    ],
  });
  const context = {
    module: { exports: {} },
    exports: {},
    require,
    FormData,
    global: {
      __cookies: () => ({
        set: (...x) => state.cookies.push(x),
        get: () => undefined,
        delete() {},
      }),
      __revalidate: (...x) => state.revalidations.push(x),
      __supabase: () => ({
        auth: {
          getUser: async () => ({ data: { user: state.user }, error: null }),
        },
        rpc: async (name, args) => {
          state.rpcCalls.push({ name, args });
          return state.result;
        },
      }),
    },
  };
  context.exports = context.module.exports;
  vm.runInNewContext(built.outputFiles[0].text, context);
  const action = context.module.exports.clubAction;
  const team = "00000000-0000-4000-8000-000000000010",
    player = "00000000-0000-4000-8000-000000000101";
  const call = async (fields = {}) => {
    const form = new FormData();
    for (const [k, v] of Object.entries({
      operation: "create-player-invite",
      team,
      player,
      ...fields,
    }))
      form.set(k, v);
    return action({}, form);
  };
  state.user = null;
  assert.match((await call()).error, /Sign in/);
  assert.equal(state.rpcCalls.length, 0);
  reset();
  assert.match((await call({ team: "invalid" })).error, /valid team/);
  assert.equal(state.rpcCalls.length, 0);
  assert.match(
    (await call({ player: "invalid" })).error,
    /valid roster player/,
  );
  assert.equal(state.rpcCalls.length, 0);
  const result = await call();
  assert.equal(result.code, "a".repeat(36));
  assert.match(result.message, /One account/);
  assert.equal(state.rpcCalls.length, 1);
  assert.equal(state.rpcCalls[0].name, "da_create_player_invite");
  assert.equal(state.rpcCalls[0].args.p_team, team);
  assert.equal(state.rpcCalls[0].args.p_player, player);
  assert.equal(
    Object.keys(state.rpcCalls[0].args).length,
    2,
    "no client-supplied recipient account or claimed authority",
  );
  assert.equal(state.cookies.length, 0);
  reset();
  state.result = { data: null, error: { message: "Internal private error" } };
  const failed = await call();
  assert.match(failed.error, /Could not create/);
  assert.equal(
    JSON.stringify(failed).includes("Internal private error"),
    false,
  );
  assert.equal(failed.code, undefined);
  reset();
  state.result = { data: [], error: null };
  assert.match((await call()).error, /Could not create/);
  reset();
  const general = await call({ operation: "create-invite", maxUses: "2" });
  assert.equal(state.rpcCalls[0].name, "da_create_invite");
  assert.equal(state.rpcCalls[0].args.p_max_uses, 2);
  assert.equal(general.code, "a".repeat(36));
  console.log(
    "PASS roster action: fresh auth, team/player validation, exact scoped RPC, no recipient impersonation, truthful failure/no raw error, and existing general invites. Synthetic transports only.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
