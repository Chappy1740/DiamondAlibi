// Local Next.js + real Supabase SDK, isolated HTTP provider and synthetic Turnstile.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const { chromium, webkit } = require("playwright");

const sandbox = process.argv.includes("--sandbox");
const base = "http://127.0.0.1:3087";
const pilot = "13125550100";
const id = "1f806ed6-e1dc-42a5-b835-f63a28b4fcd1";
const phoneUser = { id, aud: "authenticated", role: "authenticated", phone: pilot,
  phone_confirmed_at: "2026-11-13T00:00:00Z", app_metadata: { provider: "phone" },
  user_metadata: { da_signup_profile: { nickname: "Stale signup metadata" } } };
const emailUser = { id, aud: "authenticated", role: "authenticated", email: "player@example.invalid",
  email_confirmed_at: "2026-11-13T00:00:00Z", app_metadata: { provider: "email" }, user_metadata: {} };
function session(user) {
  const jwt = ["e30", Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url"), "c2ln"].join(".");
  return { user, access_token: jwt, refresh_token: "synthetic-refresh", expires_in: 3600, token_type: "bearer" };
}

(async () => {
  const calls = [];
  const used = new Set();
  const errors = [];
  let browser, app, active, saved, output = "";
  let otpOutcome = null;
  const provider = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const { pathname } = url;
    const parts = [];
    for await (const chunk of req) parts.push(chunk);
    const input = parts.length ? JSON.parse(Buffer.concat(parts).toString()) : {};
    const json = (status, value) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    };
    calls.push({ path: pathname, input });
    if (!sandbox && ["/auth/v1/otp", "/auth/v1/token", "/auth/v1/signup", "/auth/v1/recover"].includes(pathname)) {
      const token = input.gotrue_meta_security?.captcha_token;
      if (!token || used.has(token)) return json(400, { code: "captcha_failed", msg: "Synthetic security check failed" });
      used.add(token);
    }
    if (pathname === "/auth/v1/otp") {
      if (otpOutcome) return json(otpOutcome[0], { code: otpOutcome[1], msg: "Provider-only diagnostic" });
      return json(200, {});
    }
    if (pathname === "/auth/v1/verify") {
      if (input.token !== "012345") return json(403, { code: "otp_expired", msg: "Provider-only diagnostic" });
      active = phoneUser;
      return json(200, session(active));
    }
    if (pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
      active = emailUser;
      return json(200, session(active));
    }
    if (pathname === "/auth/v1/signup") return json(200, emailUser);
    if (pathname === "/auth/v1/recover") return json(200, {});
    if (pathname === "/auth/v1/user") return active ? json(200, active) : json(401, {});
    if (pathname === "/auth/v1/logout") { active = null; return json(200, {}); }
    if (pathname === "/rest/v1/rpc/da_save_player_details") {
      if (saved) return json(200, false);
      saved = { nickname: input.p_nickname, play_level: input.p_play_level, fielding_position: input.p_fielding_position };
      return json(200, true);
    }
    if (pathname === "/rest/v1/player_profiles") return json(200, saved ? [saved] : []);
    if (pathname.startsWith("/storage/")) return json(404, {});
    return json(200, []);
  });
  try {
    await new Promise((resolve, reject) => provider.listen(0, "127.0.0.1", resolve).once("error", reject));
    app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3087"], {
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + provider.address().port,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-local-key",
        DA_SANDBOX_ORIGIN: sandbox ? "https://diamondalibi-sandbox.eydrenworks.com" : "",
        DA_PHONE_SIGN_IN_ENABLED: "true", DA_PHONE_PILOT_NUMBER: "+" + pilot, DA_AUTH_TURNSTILE_SITE_KEY: "synthetic-site-key" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    for (const stream of [app.stdout, app.stderr]) stream.on("data", (chunk) => output = (output + chunk).slice(-6000));
    let ready = false;
    for (let i = 0; i < 90 && app.exitCode === null; i++) {
      try { if ((await fetch(base + "/login", { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert(ready, "Local Next.js readiness: " + output);
    const engine = process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
    browser = await engine.launch(engine === chromium && process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE } : {});
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on("pageerror", (error) => errors.push(error.message));
    // All non-loopback browser traffic is rejected. The widget has no remote side effects.
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1") return route.continue();
      if (url.href === "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit") {
        return route.fulfill({ contentType: "text/javascript", body: `
          let n=0; window.turnstile={
            render(container, options) { const id=String(++n); container.dataset.widget=id;
              options.callback("synthetic-" + id + "-" + crypto.randomUUID()); return id; },
            remove(id) { const node=document.querySelector('[data-widget="'+id+'"]'); if(node) delete node.dataset.widget; }
          };` });
      }
      return route.abort();
    });
    const button = (name) => page.getByRole("button", { name, exact: true });
    const signInWithPassword = async () => {
      await page.getByLabel("Sign-in email").fill("player@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
      await button("Sign in").click();
      await page.waitForURL(base + "/");
    };
    const signOut = async () => {
      const signedInCookie = (await page.context().cookies()).find(({ name }) => name.endsWith("-auth-token"));
      assert.ok(signedInCookie, "Expected a session cookie before sign-out");
      await page.getByLabel("Open profile menu").click();
      await button("Sign out").click();
      await page.waitForURL(base + "/login");
      assert.equal((await page.context().cookies()).some(({ name }) => name === signedInCookie.name), false);
    };

    if (sandbox) {
      await page.goto(base + "/login");
      await button("Sign in").waitFor();
      assert.equal(await button("Use a mobile number").count(), 0);
      assert.equal(await button("New here? Create an account").count(), 0);
      assert.equal(await page.getByRole("link", { name: "Forgot password?" }).count(), 0);
      assert.equal(await page.locator("[name=captchaToken]").count(), 0);
      await signInWithPassword();
      await signOut();
      assert.deepEqual(calls.filter(({ path }) => /^\/auth\/v1\/(otp|verify|signup|recover)$/.test(path)), []);
      assert.equal(calls.filter(({ path }) => path === "/auth/v1/logout").length, 1);
      assert.deepEqual(errors, []);
      console.log(engine.name() + ": sandbox hid SMS, signup and recovery with the SMS pilot configured; password sign-in and sign-out passed against local synthetic Auth");
      return;
    }

    const waitChallenge = () => page.waitForFunction(() => document.querySelector("[name=captchaToken]")?.value);
    const go = async (pathname) => { await page.goto(base + pathname); await waitChallenge(); };
    const mobile = page.getByLabel("Mobile number", { exact: true });
    const code = page.getByLabel("Text message code");
    const sends = () => calls.filter((x) => x.path === "/auth/v1/otp");

    await go("/login");
    await button("Use a mobile number").click();
    await button("Create a pilot phone account").click();
    await waitChallenge();
    await mobile.fill("3125550101");
    await button("Text me a code").click();
    await code.waitFor();
    const message = await page.getByRole("status").innerText();
    assert.equal(sends().length, 0, "a non-pilot number must not reach Auth");
    await button("Change number or request a new code").click();
    for (const outcome of [[429, "over_sms_send_rate_limit"], [422, "sms_send_failed"], null]) {
      otpOutcome = outcome;
      await waitChallenge();
      await mobile.fill("3125550100");
      await button("Text me a code").click();
      await code.waitFor();
      assert.equal(await page.getByRole("status").innerText(), message);
      if (outcome) await button("Change number or request a new code").click();
    }
    assert.equal(sends().length, 3);
    assert(sends().every(({ input }) => input.create_user === true && !input.data?.da_signup_profile));
    assert.equal(new Set(sends().map(({ input }) => input.gotrue_meta_security.captcha_token)).size, 3);
    await page.getByLabel("What name do you go by?").fill("Draft Player");
    await code.fill("999999");
    await button("Verify code").click();
    await page.getByRole("alert").filter({ hasText: "That code could not be verified" }).waitFor();
    assert.equal(saved, undefined);
    await page.getByLabel("What name do you go by?").fill("Corrected Player");
    await code.fill("012345");
    await button("Verify code").click();
    await page.waitForURL("**/more/profile?finish=1");
    await page.getByText("Corrected Player", { exact: true }).waitFor();
    assert.equal(saved.nickname, "Corrected Player");
    // Clear only this synthetic session before re-entry; sign-out action is tested separately.
    await page.context().clearCookies();
    await go("/login");
    await button("Use a mobile number").click();
    await waitChallenge();
    await mobile.fill("3125550100");
    await button("Text me a code").click();
    await code.fill("012345");
    await button("Verify code").click();
    await page.waitForURL(base + "/");
    assert.equal(sends().at(-1).input.create_user, false);
    assert.equal(calls.filter((x) => x.path.endsWith("da_save_player_details")).length, 1);

    await page.context().clearCookies();
    await go("/login");
    await signInWithPassword();
    await signOut();
    await go("/login");
    await button("New here? Create an account").click();
    await waitChallenge();
    await page.getByLabel("Sign-in email").fill("player@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
    await page.getByLabel("What name do you go by?").fill("Email Player");
    await button("Create account").click();
    await page.getByRole("status").filter({ hasText: "check your confirmation email" }).waitFor();
    await go("/forgot-password");
    await page.getByLabel("Account email").fill("player@example.invalid");
    await button("Send reset email").click();
    await page.getByRole("status").filter({ hasText: "receive a password reset link" }).waitFor();
    assert.deepEqual(errors, []);
    console.log(engine.name() + ": pilot OTP gating, retry, corrected profile, repeat sign-in and email authentication passed against local synthetic Auth");
  } catch (error) {
    console.error(output);
    throw error;
  } finally {
    await browser?.close();
    app?.kill();
    provider.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
