// Actual client components; local synthetic server, no provider or hosted writes.
const { chromium, webkit } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
(async () => {
  let browser;
  const engine = process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
  const port = engine === webkit ? 3143 : 3142;
  const base = `http://127.0.0.1:${port}`;
  let output = "";
  const server = spawn(process.execPath, ["tests/feedback-ui-fixture.cjs"], {
    env: { ...process.env, FEEDBACK_FIXTURE_PORT: String(port) },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => (output = (output + chunk).slice(-4000)));
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw Error(output);
      try {
        if ((await fetch(base)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(ready, output);
    browser = await engine.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) =>
      new URL(route.request().url()).origin === base
        ? route.continue()
        : route.abort(),
    );
    await page.goto(base);
    await page
      .getByRole("textbox", { name: "Your message", exact: true })
      .fill("Synthetic pilot feedback <img src=x onerror=alert(1)>");
    await page
      .getByRole("button", { name: "Send to the owner", exact: true })
      .click();
    await page
      .getByText("Synthetic failure. Your message is still here.", {
        exact: true,
      })
      .waitFor();
    assert.match(
      await page
        .getByRole("textbox", { name: "Your message", exact: true })
        .inputValue(),
      /Synthetic pilot/,
    );
    await page
      .getByRole("button", { name: "Send to the owner", exact: true })
      .click();
    await page
      .getByText(
        "Saved to the owner's inbox. Thanks for helping improve Diamond Alibi!",
        { exact: true },
      )
      .waitFor();
    const state = await (await fetch(base + "/synthetic-state")).json();
    assert.equal(state.attempts.length, 2);
    assert.equal(state.attempts[0].id, state.attempts[1].id);
    assert.equal(state.records.length, 1);
    await page.goto(base + "/inbox");
    await page.getByRole("button", { name: "Open inbox", exact: true }).click();
    await page
      .getByText("Email alert queued. This feedback is safely saved here.", {
        exact: true,
      })
      .waitFor();
    assert.equal(await page.locator(".feedback-message img").count(), 0);
    await page
      .getByRole("button", { name: "Mark reviewed", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Mark as new", exact: true })
      .waitFor();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () =>
      (
        await window.axe.run(document.querySelector("main"), {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => v.id),
    );
    assert.deepEqual(violations, []);
    await page.route("**/api/feedback**", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({
            json: {
              items: state.records,
              more: false,
              alertsConfigured: false,
            },
          })
        : route.continue(),
    );
    await page
      .getByRole("button", { name: "Refresh inbox", exact: true })
      .click();
    await page
      .getByText(
        "Email alerts are not configured. Feedback is still saved in this inbox.",
        { exact: true },
      )
      .waitFor();
    assert.deepEqual(errors, []);
    if (process.env.FEEDBACK_SCREENSHOT) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: process.env.FEEDBACK_SCREENSHOT,
        fullPage: true,
      });
    }
    console.log(
      `PASS ${engine.name()}: saved receipt, retained retry identity, notification/config status, owner controls, safe text, phone layout and accessibility. No live sends.`,
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
