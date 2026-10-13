const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");

function load(error) {
  let calls = 0;
  let source = fs.readFileSync(path.join(__dirname, "../src/app/login/actions.ts"), "utf8");
  source = stripTypeScriptTypes(source)
    .replace(/^import .*;$/gm, "")
    .replace(/export /g, "");
  const context = vm.createContext({
    supabaseServer: async () => ({ auth: { signOut: async () => {
      calls++;
      return { error };
    } } }),
    redirect: (destination) => { throw Object.assign(new Error("redirect"), { destination }); },
  });
  vm.runInContext(source, context);
  return { run: () => context.signout(), calls: () => calls };
}

test("successful sign-out clears the Auth session before redirecting to login", async () => {
  const action = load(null);
  await assert.rejects(action.run(), (e) => e.destination === "/login");
  assert.equal(action.calls(), 1);
});

test("failed sign-out reports failure without claiming the user is signed out", async () => {
  const action = load({ message: "synthetic failure" });
  await assert.rejects(action.run(), (e) => e.destination === "/club?notice=signout-failed");
  assert.equal(action.calls(), 1);
});
