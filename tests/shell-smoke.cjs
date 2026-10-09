const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      external.push(url.hostname);
      return route.abort();
    }
    return route.continue();
  });
  const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
  const nav = page.getByRole("navigation", { name: "Mobile primary" });
  async function expectText(text) {
    await page.getByText(text, { exact: false }).first().waitFor();
  }
  async function choose(label, value) {
    await page.getByRole("button", { name: "Sample data" }).click();
    await page.getByLabel(label, { exact: true }).selectOption(value);
    await page.getByRole("button", { name: "Apply & return" }).click();
  }
  async function noOverflow() {
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Horizontal overflow at ${(await page.viewportSize()).width}px`,
    );
  }
  try {
    await page.goto(base);
    await expectText("Good evening, Player");
    assert.equal(
      await page
        .getByRole("link", { name: "Open scoring", exact: true })
        .count(),
      1,
    );
    await page.getByRole("link", { name: "Open scoring", exact: true }).click();
    await expectText("Scoring preview");
    assert.equal(
      await page
        .getByRole("button", { name: "Record outcome · available in M4.3" })
        .isDisabled(),
      true,
    );
    await page.getByRole("link", { name: "Back to games" }).click();
    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await page.waitForURL(base + "/");
    await expectText("Good evening, Player");
    await choose("Dashboard scenario", "Multiple live games");
    assert.equal(
      await page
        .getByRole("link", { name: "Open scoring", exact: true })
        .count(),
      2,
    );
    await page
      .getByRole("link", { name: "Open scoring", exact: true })
      .nth(1)
      .click();
    await expectText("Weekend Warriors vs. Base Runners");
    await expectText("6 : 4");
    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await page.waitForURL(base + "/");
    await expectText("Good evening, Player");
    await choose("Connection state", "Offline");
    await expectText("Offline preview");
    assert.equal(
      await page
        .getByRole("link", { name: "Open scoring", exact: true })
        .count(),
      0,
    );
    await choose("Connection state", "Conflict");
    await expectText("Another scorer updated");
    await page
      .getByRole("button", { name: "Review latest", exact: true })
      .click();
    await choose("Dashboard scenario", "Upcoming only");
    assert.equal(
      await page
        .getByRole("link", { name: "Open scoring", exact: true })
        .count(),
      0,
    );
    await choose("Dashboard scenario", "No team");
    await expectText("Your next team starts here.");
    await choose("Dashboard scenario", "Empty season");
    await expectText("A clean scorebook.");
    await choose("Dashboard scenario", "Guest");
    await expectText("Guest player preview");
    await choose("Dashboard scenario", "Completed");
    await expectText("Last time out");
    assert.equal(
      await page.getByText("Next on the schedule", { exact: true }).count(),
      0,
    );
    await choose("Dashboard scenario", "Game day");
    await page
      .getByLabel("Team", { exact: true })
      .selectOption("Weekend Warriors");
    await page
      .getByLabel("Season", { exact: true })
      .selectOption("Summer 2026");
    await nav.getByRole("link", { name: "Stats", exact: true }).click();
    assert.equal(
      await page.getByLabel("Team", { exact: true }).inputValue(),
      "Weekend Warriors",
    );
    assert.equal(
      await page.getByLabel("Season", { exact: true }).inputValue(),
      "Summer 2026",
    );
    await page.getByRole("button", { name: "Tournament", exact: true }).click();
    await expectText(".500");
    assert.equal(await page.getByText("AVG", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Overall", exact: true }).click();
    await expectText(".571");
    await nav.getByRole("link", { name: "Beverages", exact: true }).click();
    await expectText("2 beverages in credit");
    await page
      .getByRole("button", { name: "Most credited", exact: true })
      .click();
    await expectText("Morgan T.");
    await nav.getByRole("link", { name: "More", exact: true }).click();
    await page
      .getByRole("link", {
        name: "Team & roster Invite codes and captain designation",
      })
      .click();
    await page
      .getByLabel("Tag myself as Team Captain", { exact: false })
      .check();
    await page.getByLabel("Team invite code").fill("NOT-A-REAL-CODE");
    await page.getByRole("button", { name: "Preview joining" }).click();
    await expectText("No team was joined.");
    await page.getByRole("link", { name: "Back to More" }).click();
    await page
      .getByRole("link", {
        name: "Alibi Generator A little help with your side of the story",
      })
      .click();
    await page
      .getByRole("button", { name: "Plead the Fifth? Nah. Generate an Alibi." })
      .click();
    assert.equal(await page.locator("blockquote").count(), 1);
    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await expectText("Self-tagged captain");
    await page
      .getByLabel("Team", { exact: true })
      .selectOption("Northwest Alibis");
    assert.equal(
      await page.getByText("Self-tagged captain", { exact: true }).count(),
      0,
      "Captain designation must stay with its team",
    );
    await page.getByLabel("Season", { exact: true }).selectOption("Fall 2026");
    await choose("Connection state", "Loading");
    await page.getByLabel("Loading sample dashboard").waitFor();
    await choose("Connection state", "Error");
    await expectText("Could not load");
    await page
      .getByRole("button", { name: "Retry preview", exact: true })
      .click();
    for (const state of [
      "Reconnecting",
      "Save pending",
      "Save failed",
      "Success",
    ]) {
      await choose("Connection state", state);
      await page.getByRole("status").first().waitFor();
    }
    await choose("Connection state", "Connected");
    fs.mkdirSync("docs/previews", { recursive: true });
    for (const width of [320, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
      await noOverflow();
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `docs/previews/dashboard-${width}.png`,
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 320, height: 844 });
    for (const route of [
      "/",
      "/games",
      "/games/live",
      "/stats",
      "/beverages",
      "/more",
      "/more/team",
      "/more/seasons",
      "/more/alibi",
      "/more/profile",
      "/more/settings",
    ]) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      await page.locator("h1").waitFor();
      await noOverflow();
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(violations, [], `Accessibility violations on ${route}`);
    }
    await page.goto(base);
    await page.keyboard.press("Tab");
    assert.equal(
      await page
        .getByRole("link", { name: "Skip to content" })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.getByRole("button", { name: "Sample data" }).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("dialog").count(), 0);
    assert.deepEqual(errors, [], "Browser errors");
    assert.deepEqual(external, [], "External browser requests");
    console.log(
      "PASS: routes, member/guest/captain access, live priority, scope/context, all sample states, invite/alibi previews, mobile overflow, WCAG automated checks, keyboard/modal, no external requests.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
