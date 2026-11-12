const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");

function load(error, { auth = {}, rpc, origin = "https://diamondalibi.eydrenworks.com", nodeEnv = "test" } = {}) {
  let calls = 0;
  const context = vm.createContext({
    headers: async () => new Headers(origin ? { origin } : {}),
    process: { env: { NODE_ENV: nodeEnv } },
    supabaseServer: async () => ({ rpc, auth: { ...auth, signOut: async () => {
      calls++;
      return { error };
    } } }),
    redirect: (destination) => { throw Object.assign(new Error("redirect"), { destination }); },
  });
  for (const file of ["lib/player-profile.ts", "lib/complete-player-signup.ts", "lib/trusted-auth-origin.ts", "app/login/actions.ts"]) {
    const source = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"))
      .replace(/^import .*;$/gm, "")
      .replace(/export /g, "");
    vm.runInContext(source, context);
  }
  return { run: () => context.signout(), calls: () => calls, signup: context.signup, login: context.login };
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

function credentials(fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    email: "profile@example.invalid", password: "synthetic-password", ...fields,
  })) form.set(key, value);
  return form;
}

test("signup requires a name and carries validated optional details through email confirmation", async () => {
  const requests = [];
  const actions = load(null, { auth: { signUp: async (input) => {
    requests.push(input);
    return { data: { session: null }, error: null };
  } } });
  assert.ok((await actions.signup({}, credentials({ nickname: "  " }))).error);
  assert.ok((await actions.signup({}, credentials({ nickname: "River", fielding_position: "Manager" }))).error);
  assert.equal(requests.length, 0);
  const result = await actions.signup({}, credentials({ nickname: " River ", play_level: "Not sure" }));
  assert.match(result.message, /confirmation email/);
  assert.equal(requests[0].options.emailRedirectTo, "https://diamondalibi.eydrenworks.com/auth/callback?next=/login");
  const details = requests[0].options.data.da_signup_profile;
  assert.equal(details.nickname, "River");
  assert.equal(details.play_level, "Not sure");
  assert.equal(details.fielding_position, null);
});

test("signup uses the test origin locally and rejects untrusted email redirect origins", async () => {
  const requests = [];
  const auth = { signUp: async (input) => {
    requests.push(input);
    return { data: { session: null }, error: null };
  } };
  const form = credentials({ nickname: "River" });
  const localOrigin = "http://127.0.0.1:3087";
  assert.ok((await load(null, { auth, origin: localOrigin }).signup({}, form)).message);
  assert.equal(requests[0].options.emailRedirectTo, `${localOrigin}/auth/callback?next=/login`);
  assert.ok((await load(null, { auth, origin: "http://localhost:3000" }).signup({}, form)).message);
  assert.equal(requests[1].options.emailRedirectTo, "http://127.0.0.1:3000/auth/callback?next=/login");
  const workerOrigin = "https://diamond-alibi-preview.lanternmere-wow.workers.dev";
  assert.ok((await load(null, { auth, origin: workerOrigin }).signup({}, form)).message);
  assert.equal(requests[2].options.emailRedirectTo, "https://diamondalibi.eydrenworks.com/auth/callback?next=/login");
  assert.ok((await load(null, { auth, origin: localOrigin, nodeEnv: "production" }).signup({}, form)).error);
  assert.ok((await load(null, { auth, origin: "https://diamondalibi.eydrenworks.com.example.invalid" }).signup({}, form)).error);
  assert.equal(requests.length, 3);
});

test("first verified login initializes the profile and offers a photo, with a normal return on later sign-ins", async () => {
  const user = {
    email_confirmed_at: "2026-11-06T00:00:00Z",
    user_metadata: { da_signup_profile: { nickname: "River", play_level: "Class E", fielding_position: "Left Center" } },
  };
  const writes = [];
  const actions = load(null, {
    auth: { signInWithPassword: async () => ({ data: { user }, error: null }) },
    rpc: async (name, args) => {
      writes.push([name, args]);
      return { data: writes.length === 1, error: null };
    },
  });
  await assert.rejects(actions.login({}, credentials()), (error) => error.destination === "/more/profile?finish=1");
  await assert.rejects(actions.login({}, credentials()), (error) => error.destination === "/");
  assert.equal(writes[0][0], "da_save_player_details");
  assert.equal(writes[0][1].p_fielding_position, "Left Center");
  assert.equal(writes[0][1].p_initialize, true);
  user.email_confirmed_at = null;
  await assert.rejects(actions.login({}, credentials()), (error) => error.destination === "/");
  assert.equal(writes.length, 2);
});
