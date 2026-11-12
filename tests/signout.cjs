const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");

function load(error, { auth = {}, rpc, phoneEnabled = false } = {}) {
  let calls = 0;
  const context = vm.createContext({
    process: { env: { DA_PHONE_SIGN_IN_ENABLED: String(phoneEnabled) } },
    supabaseServer: async () => ({ rpc, auth: { ...auth, signOut: async () => {
      calls++;
      return { error };
    } } }),
    redirect: (destination) => { throw Object.assign(new Error("redirect"), { destination }); },
  });
  for (const file of ["lib/player-profile.ts", "lib/complete-player-signup.ts", "lib/phone-sign-in.ts", "app/login/actions.ts", "app/login/phone-actions.ts"]) {
    const source = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"))
      .replace(/^import .*;$/gm, "")
      .replace(/export /g, "");
    vm.runInContext(source, context);
  }
  return {
    run: () => context.signout(), calls: () => calls, signup: context.signup, login: context.login,
    requestPhoneCode: context.requestPhoneCode, verifyPhoneCode: context.verifyPhoneCode,
  };
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
  const details = requests[0].options.data.da_signup_profile;
  assert.equal(details.nickname, "River");
  assert.equal(details.play_level, "Not sure");
  assert.equal(details.fielding_position, null);
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

test("phone sign-in is opt-in, validates the number and creates accounts only in registration mode", async () => {
  const calls = [];
  const auth = { signInWithOtp: async (input) => {
    calls.push(JSON.parse(JSON.stringify(input)));
    return { error: input.options.shouldCreateUser ? null : { code: "signup_disabled" } };
  } };
  const fields = { phone: "(312) 555-0100", intent: "sign-in" };
  const disabled = load(null, { auth });
  assert.match((await disabled.requestPhoneCode({}, credentials(fields))).error, /unavailable/);
  assert.match((await disabled.verifyPhoneCode({}, credentials(fields))).error, /unavailable/);
  const enabled = load(null, { auth, phoneEnabled: true });
  assert.ok((await enabled.requestPhoneCode({}, credentials({ ...fields, phone: "not a phone" }))).error);
  assert.ok((await enabled.requestPhoneCode({}, credentials({ ...fields, intent: "register" }))).error);
  assert.equal(calls.length, 0);

  assert.equal((await enabled.requestPhoneCode({}, credentials(fields))).phone, "+13125550100");
  assert.deepEqual(calls[0], { phone: "+13125550100", options: { channel: "sms", shouldCreateUser: false } });
  const result = await enabled.requestPhoneCode({}, credentials({
    intent: "register", phone: "+44 7700 900123", nickname: "River", play_level: "Class E",
  }));
  assert.equal(result.phone, "+447700900123");
  assert.equal(calls[1].options.shouldCreateUser, true);
  assert.deepEqual(calls[1].options.data.da_signup_profile, { nickname: "River", play_level: "Class E", fielding_position: null });
});

test("only a verified SMS session initializes a phone-only player profile", async () => {
  const calls = [];
  const writes = [];
  const user = {
    phone_confirmed_at: "2026-11-12T00:00:00Z",
    user_metadata: { da_signup_profile: { nickname: "River" } },
  };
  const actions = load(null, {
    phoneEnabled: true,
    auth: { verifyOtp: async (input) => {
      calls.push(JSON.parse(JSON.stringify(input)));
      return input.token === "012345"
        ? { data: { user, session: {} }, error: null }
        : { data: { user: null, session: null }, error: { message: "Invalid code" } };
    } },
    rpc: async (name, args) => {
      writes.push([name, args]);
      return { data: true, error: null };
    },
  });
  const fields = { phone: "+13125550100", code: "012345" };
  assert.ok((await actions.verifyPhoneCode({}, credentials({ ...fields, code: "2345" }))).error);
  assert.equal(calls.length, 0);
  assert.ok((await actions.verifyPhoneCode({}, credentials({ ...fields, code: "999999" }))).error);
  assert.equal(writes.length, 0);
  await assert.rejects(actions.verifyPhoneCode({}, credentials(fields)), (error) => error.destination === "/more/profile?finish=1");
  assert.deepEqual(calls[1], { phone: "+13125550100", token: "012345", type: "sms" });
  assert.equal(writes[0][0], "da_save_player_details");
  assert.equal(writes[0][1].p_initialize, true);
  user.phone_confirmed_at = null;
  assert.ok((await actions.verifyPhoneCode({}, credentials(fields))).error);
  assert.equal(actions.calls(), 1);
  assert.equal(writes.length, 1);
});
