// Self-contained acceptance test: real Next.js/SSR cookies, synthetic Auth server, no email.
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");
const axe = require("axe-core");

(async () => {
  let challenge,
    resetCalls = 0,
    updates = 0,
    mode = "ok";
  const usedCodes = new Set();
  const fixtureRequests = [];
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "synthetic@example.invalid",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const fixture = http.createServer(async (request, response) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    response.setHeader("Content-Type", "application/json");
    const reply = (status, data) => {
      response.statusCode = status;
      response.end(JSON.stringify(data));
    };
    const url = new URL(request.url, "http://127.0.0.1");
    fixtureRequests.push(request.method + " " + url.pathname);
    if (url.pathname === "/auth/v1/recover") {
      resetCalls++;
      challenge = body.code_challenge;
      assert.equal(
        url.searchParams.get("redirect_to"),
        base + "/auth/recovery",
      );
      return mode === "rate"
        ? reply(429, { message: "private synthetic provider error" })
        : reply(200, {});
    }
    if (url.pathname === "/auth/v1/token") {
      const actual = crypto
        .createHash("sha256")
        .update(body.code_verifier || "")
        .digest("base64url");
      if (
        !challenge ||
        challenge !== actual ||
        usedCodes.has(body.auth_code) ||
        body.auth_code !== "synthetic-recovery-code"
      )
        return reply(400, { message: "Expired synthetic link" });
      usedCodes.add(body.auth_code);
      const now = Math.floor(Date.now() / 1000);
      const jwt = [
        Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
          "base64url",
        ),
        Buffer.from(
          JSON.stringify({
            iss: authBase + "/auth/v1",
            sub: user.id,
            role: "authenticated",
            aud: "authenticated",
            exp: now + 3600,
            iat: now,
            session_id: "synthetic-session",
            amr: [{ method: "recovery", timestamp: now }],
          }),
        ).toString("base64url"),
        "synthetic-signature",
      ].join(".");
      return reply(200, {
        access_token: jwt,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "synthetic-refresh",
        user,
      });
    }
    if (url.pathname === "/auth/v1/user") {
      if (!request.headers.authorization?.startsWith("Bearer ey"))
        return reply(401, { message: "No synthetic session" });
      if (request.method === "PUT") {
        assert.equal(body.password, "Synthetic new password 123!");
        updates++;
      }
      return reply(200, user);
    }
    if (url.pathname === "/auth/v1/logout") return reply(200, {});
    return reply(404, { message: "Unknown synthetic route" });
  });
  await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
  const authBase = `http://127.0.0.1:${fixture.address().port}`;
  const base = "http://127.0.0.1:3010";
  const app = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3010",
    ],
    {
      env: {
        ...process.env,
        AUTH_SITE_URL: base,
        NEXT_PUBLIC_SUPABASE_URL: authBase,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_only",
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let appOutput = "";
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (data) => {
      appOutput = (appOutput + data).slice(-4000);
    });
  let browser;
  try {
    const deadline = Date.now() + 60000;
    while (true) {
      if (app.exitCode !== null)
        throw Error("Synthetic preview failed to start: " + appOutput);
      try {
        if ((await fetch(base + "/login")).ok) break;
      } catch {}
      if (Date.now() > deadline)
        throw Error("Synthetic preview startup timed out.");
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    browser = await chromium.launch({
      headless: true,
      ...(process.env.BROWSER_EXECUTABLE
        ? { executablePath: process.env.BROWSER_EXECUTABLE }
        : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    context.on("page", (page) =>
      page.on("pageerror", (error) => errors.push(error.message)),
    );
    await context.route("**/*", (route) =>
      ["127.0.0.1", "localhost"].includes(
        new URL(route.request().url()).hostname,
      )
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    async function accessible() {
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(
        async () =>
          (
            await axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            })
          ).violations,
      );
      assert.deepEqual(
        violations.map((violation) => violation.id),
        [],
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await page.goto(base + "/login");
    await page.getByRole("link", { name: "Forgot Password?" }).click();
    await page.waitForURL(base + "/forgot-password");
    await accessible();
    await page.getByLabel("Sign-in email").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await page.getByRole("status").waitFor();
    const expected = await page.getByRole("status").textContent();
    assert.match(expected, /If an account exists/);
    assert.equal(resetCalls, 1);
    await page.goto(
      base +
        "/auth/recovery?code=synthetic-recovery-code&next=https://attacker.invalid",
    );
    await page.waitForURL(base + "/update-password");
    await page.getByLabel("New password", { exact: true }).waitFor();
    await accessible();
    await page
      .getByLabel("New password", { exact: true })
      .fill("Synthetic new password 123!");
    await page
      .getByLabel("Confirm new password")
      .fill("Different synthetic password");
    await page.getByRole("button", { name: "Update password" }).click();
    await page.getByRole("alert").filter({ hasText: "do not match" }).waitFor();
    assert.equal(updates, 0);
    await page
      .getByLabel("New password", { exact: true })
      .fill("Synthetic new password 123!");
    await page
      .getByLabel("Confirm new password")
      .fill("Synthetic new password 123!");
    await page.getByRole("button", { name: "Update password" }).click();
    await page.waitForURL(base + "/login?notice=password-updated");
    await page
      .getByRole("status")
      .filter({ hasText: "Your password was updated. Sign in" })
      .waitFor({ timeout: 10000 })
      .catch(async () => {
        throw Error(
          "Update did not succeed: " +
            JSON.stringify({
              alerts: await page.getByRole("alert").allTextContents(),
              statuses: await page.getByRole("status").allTextContents(),
              updates,
              fixtureRequests,
            }),
        );
      });
    assert.equal(updates, 1);
    await page.goto(base + "/update-password");
    await page
      .getByRole("alert")
      .filter({ hasText: "invalid or expired" })
      .waitFor();
    assert.equal(
      await page.getByLabel("New password", { exact: true }).count(),
      0,
    );
    await page.goto(base + "/auth/recovery?code=synthetic-recovery-code");
    await page.waitForURL(base + "/forgot-password?notice=invalid-link");
    await page
      .getByRole("alert")
      .filter({ hasText: "invalid or expired" })
      .waitFor();
    for (const address of ["unknown@example.invalid", "rate@example.invalid"]) {
      mode = address.startsWith("rate") ? "rate" : "ok";
      await page.goto(base + "/forgot-password");
      await page.getByLabel("Sign-in email").fill(address);
      await page.getByRole("button", { name: "Send reset link" }).click();
      await page.getByRole("status").waitFor();
      assert.equal(await page.getByRole("status").textContent(), expected);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + "/login");
    await page.getByRole("link", { name: "Forgot Password?" }).waitFor();
    await accessible();
    assert.deepEqual(errors, []);
    console.log(
      "Password recovery browser acceptance passed: mobile/desktop, accessibility, real SSR cookies, PKCE, password update, sign-out, replay rejection and generic responses. Synthetic Auth only; no emails sent.",
    );
  } finally {
    if (browser) await browser.close();
    if (app.exitCode === null) {
      await new Promise((resolve) => {
        const killer = spawn(
          "taskkill",
          ["/PID", String(app.pid), "/T", "/F"],
          { windowsHide: true, stdio: "ignore" },
        );
        killer.on("exit", resolve);
      });
    }
    await new Promise((resolve) => fixture.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
