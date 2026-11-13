const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");

function load(error, { auth = {}, rpc, origin = "https://diamondalibi.eydrenworks.com", nodeEnv = "test", localWorker, phoneEnabled = false, siteKey = "", pilot = "", clock = { ms: 0 } } = {}) {
  let calls = 0;
  const context = vm.createContext({
    headers: async () => new Headers(origin ? { origin } : {}),
    performance: { now: () => clock.ms },
    setTimeout: (fn, ms) => { clock.ms += ms; queueMicrotask(fn); },
    process: { env: { NODE_ENV: nodeEnv, DA_LOCAL_WORKER_PREVIEW: localWorker,
      DA_PHONE_SIGN_IN_ENABLED: String(phoneEnabled), DA_AUTH_TURNSTILE_SITE_KEY: siteKey, DA_PHONE_PILOT_NUMBER: pilot } },
    supabaseServer: async () => ({ rpc, auth: { ...auth, signOut: async () => {
      calls++;
      return { error };
    } } }),
    redirect: (destination) => { throw Object.assign(new Error("redirect"), { destination }); },
  });
  for (const file of ["lib/player-profile.ts", "lib/complete-player-signup.ts", "lib/trusted-auth-origin.ts", "lib/auth-captcha.ts", "lib/phone-sign-in.ts", "app/login/actions.ts", "app/login/phone-actions.ts"]) {
    const source = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"))
      .replace(/^import .*;$/gm, "")
      .replace(/export /g, "");
    vm.runInContext(source, context);
  }
  return { run: () => context.signout(), calls: () => calls, signup: context.signup, login: context.login, requestPhoneCode: context.requestPhoneCode, verifyPhoneCode: context.verifyPhoneCode };
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

test("the built Worker trusts the documented loopback signup origin only in the local emulator", async () => {
  const requests = [];
  const auth = { signUp: async (input) => {
    requests.push(input);
    return { data: { session: null }, error: null };
  } };
  const form = credentials({ nickname: "River" });
  const origin = "http://127.0.0.1:3002";
  const production = { auth, origin, nodeEnv: "production" };
  assert.ok((await load(null, production).signup({}, form)).error);
  const result = await load(null, { ...production, localWorker: "1" }).signup({}, form);
  assert.match(result.message, /confirmation email/);
  assert.equal(requests[0].options.emailRedirectTo, `${origin}/auth/callback?next=/login`);
  const lookalike = { ...production, localWorker: "1", origin: "http://127.0.0.1.example.invalid:3002" };
  assert.ok((await load(null, lookalike).signup({}, form)).error);
  assert.equal(requests.length, 1);
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

function phoneFields(overrides = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    phone: "(312) 555-0100", intent: "sign-in", captchaToken: "synthetic-captcha", ...overrides,
  })) form.set(name, value);
  return form;
}

test("pilot gates keep disabled, untrusted, other numbers, and missing CAPTCHA away from Supabase", async () => {
  const sent = [];
  const auth = { signInWithOtp: async (input) => { sent.push(input); return { error: null }; } };
  const args = { auth, phoneEnabled: true, siteKey: "test-key", pilot: "+13125550100" };
  for (const override of [
    { phoneEnabled: false }, { pilot: "" }, { pilot: "3125550100" }, { siteKey: "" },
    { origin: "https://example.invalid" },
  ]) {
    const result = await load(null, { ...args, ...override }).requestPhoneCode({}, phoneFields());
    assert.match(result.error, /unavailable/);
  }
  const action = load(null, args);
  assert.match((await action.requestPhoneCode({}, phoneFields({ captchaToken: "" }))).error, /security check/);
  assert.ok((await action.requestPhoneCode({}, phoneFields({ phone: "123" }))).error);
  assert.equal((await action.requestPhoneCode({}, phoneFields({ phone: "+13125550101" }))).requested, true);
  assert.equal(sent.length, 0);
  await action.requestPhoneCode({}, phoneFields());
  await action.requestPhoneCode({}, phoneFields({ intent: "register" }));
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), [
    { phone: "+13125550100", options: { channel: "sms", shouldCreateUser: false, captchaToken: "synthetic-captcha" } },
    { phone: "+13125550100", options: { channel: "sms", shouldCreateUser: true, captchaToken: "synthetic-captcha" } },
  ]);
});

test("OTP requests return one result and minimum response window across provider outcomes and retries", async () => {
  const outcomes = [
    [900, null], [20, "otp_disabled"], [10, "phone_exists"], [18, "user_banned"],
    [12, "over_sms_send_rate_limit"], [24, "over_request_rate_limit"],
    [1400, "sms_send_failed"], [85, "captcha_failed"], [2000, "throw"], [1, "phone_provider_disabled"],
  ];
  for (const intent of ["sign-in", "register"]) {
    const clock = { ms: 0 };
    let count = 0;
    const auth = { signInWithOtp: async () => {
      const [elapsed, code] = outcomes[count++];
      clock.ms += elapsed;
      if (code === "throw") throw new Error("synthetic transport failure");
      return { error: code ? { code } : null };
    } };
    const action = load(null, { auth, clock, phoneEnabled: true, siteKey: "test-key", pilot: "+13125550100" });
    for (const _ of outcomes) {
      const start = clock.ms;
      const reply = await action.requestPhoneCode({}, phoneFields({ intent }));
      assert.equal(JSON.stringify(reply), '{"requested":true}');
      assert.equal(clock.ms - start, 2500);
    }
    const start = clock.ms;
    assert.equal(JSON.stringify(await action.requestPhoneCode({}, phoneFields({ intent, phone: "+13125550101" }))), '{"requested":true}');
    assert.equal(clock.ms - start, 2500);
    assert.equal(count, outcomes.length);
  }
});

test("corrected profile details initialize only after a verified pilot OTP; subsequent sign-in leaves them alone", async () => {
  const calls = [];
  const writes = [];
  const user = {
    phone: "13125550100", phone_confirmed_at: "2026-11-13T00:00:00Z",
    user_metadata: { da_signup_profile: { nickname: "Stale draft" } },
  };
  const action = load(null, {
    phoneEnabled: true, siteKey: "test-key", pilot: "+13125550100",
    auth: { verifyOtp: async (input) => {
      calls.push(input);
      if (input.token === "888888") throw new Error("synthetic failure");
      return input.token === "012345"
        ? { data: { user, session: {} }, error: null }
        : { data: { user: null, session: null }, error: { code: "otp_expired" } };
    } },
    rpc: async (name, args) => { writes.push([name, args]); return { data: true, error: null }; },
  });
  const first = { intent: "register", nickname: "Wrong draft", code: "999999" };
  const failure = await action.verifyPhoneCode({}, phoneFields(first));
  assert.match(failure.error, /could not be verified/);
  for (const fields of [{ code: "888888" }, { phone: "+13125550101", code: "012345" }]) {
    assert.equal((await action.verifyPhoneCode({}, phoneFields({ ...first, ...fields }))).error, failure.error);
  }
  assert.equal(writes.length, 0);
  assert.equal(calls.length, 2);
  await assert.rejects(action.verifyPhoneCode({}, phoneFields({
    ...first, nickname: "Corrected player", fielding_position: "Left Center", code: "012345",
  })), (e) => e.destination === "/more/profile?finish=1");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2])), { phone: "+13125550100", token: "012345", type: "sms" });
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0])), [
    "da_save_player_details", { p_nickname: "Corrected player", p_play_level: null, p_fielding_position: "Left Center", p_initialize: true },
  ]);
  await assert.rejects(action.verifyPhoneCode({}, phoneFields({ code: "012345" })), (e) => e.destination === "/");
  user.phone_confirmed_at = null;
  assert.equal((await action.verifyPhoneCode({}, phoneFields({ code: "012345" }))).error, failure.error);
  assert.equal(action.calls(), 1);
  assert.equal(writes.length, 1);
});

test("with project CAPTCHA configured, email sign-in and signup send the token and reject a missing token", async () => {
  const requests = [];
  const auth = {
    signInWithPassword: async (input) => { requests.push(input); return { data: { user: {} }, error: null }; },
    signUp: async (input) => { requests.push(input); return { data: { session: null }, error: null }; },
  };
  const action = load(null, { auth, siteKey: "test-key" });
  const fields = { nickname: "River" };
  assert.match((await action.login({}, credentials(fields))).error, /security check/);
  assert.match((await action.signup({}, credentials(fields))).error, /security check/);
  assert.equal(requests.length, 0);
  const form = credentials({ ...fields, captchaToken: "test-token" });
  await assert.rejects(action.login({}, form), (e) => e.destination === "/");
  assert.match((await action.signup({}, form)).message, /confirmation email/);
  assert.deepEqual(requests.map((x) => x.options.captchaToken), ["test-token", "test-token"]);
});
