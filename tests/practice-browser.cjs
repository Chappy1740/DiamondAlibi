const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      }),
      page = await context.newPage(),
      errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (!["127.0.0.1", "localhost"].includes(u.hostname)) {
        external.push(u.hostname);
        return route.abort();
      }
      return route.continue();
    });
    const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
    await page.goto(`${base}/practice`);
    await page.getByLabel("Fence HR limit for this practice day").fill("1");
    await page
      .getByRole("button", { name: "Create practice day", exact: true })
      .click();
    await page.getByLabel("Opponent", { exact: true }).fill("Sample Opponent");
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("Fence HR");
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await page.getByText("Fence HRs 1/1", { exact: false }).waitFor();
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await page.getByText("Morgan (sample): OLHR", { exact: false }).waitFor();
    await page
      .getByLabel("Next batter / manual override")
      .selectOption("demo-a");
    await page
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("ITP HR");
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await page.getByText("Fence HRs 1/1", { exact: false }).waitFor();
    await page
      .getByRole("button", { name: "Complete game", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Record outcome", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Correct play 1", exact: true })
      .click();
    await page.getByLabel("Corrected outcome").selectOption("Out");
    await page.getByLabel("Corrected runs").fill("0");
    await page.getByLabel("Corrected RBI").fill("0");
    await page
      .getByLabel("Correction reason", { exact: true })
      .fill("Wrong sample outcome");
    await page
      .getByRole("button", { name: "Save correction", exact: true })
      .click();
    await page
      .getByText("Morgan (sample): Fence HR", { exact: false })
      .waitFor();
    await page.getByText("Wrong sample outcome", { exact: false }).waitFor();
    const revision = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("diamond-alibi.practice.v1")).requests
          .length,
    );
    await page.reload();
    await page
      .getByText("Morgan (sample): Fence HR", { exact: false })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("diamond-alibi.practice.v1")).requests
            .length,
      ),
      revision,
    );
    await page.getByLabel("Future fence HR limit").fill("0");
    await page
      .getByRole("button", { name: "Save new rule version", exact: true })
      .click();
    await page.getByText("Fence HRs 1/1", { exact: false }).waitFor();
    await page
      .getByLabel("Opponent", { exact: true })
      .fill("Tournament sample");
    await page.getByLabel("Game classification").selectOption("Tournament");
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page.getByText("Fence HRs 0/0", { exact: false }).waitFor();
    await page.getByLabel("Batting outcome", { exact: true }).selectOption("K");
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await page.getByLabel("Practice statistics scope").selectOption("League");
    assert.equal(
      await page
        .getByRole("region", { name: "Practice statistics" })
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .first()
        .textContent(),
      "2",
    );
    await page
      .getByLabel("Practice statistics scope")
      .selectOption("Tournament");
    assert.equal(
      await page
        .getByRole("region", { name: "Practice statistics" })
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .first()
        .textContent(),
      "1",
    );
    await context.setOffline(true);
    await page
      .getByText("Offline: changes are paused", { exact: false })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Record outcome", exact: true })
        .isDisabled(),
      true,
    );
    await context.setOffline(false);
    // An already stale second tab is blocked; this is not a server atomicity claim.
    const stale = await context.newPage();
    await stale.goto(`${base}/practice`);
    await stale
      .getByRole("button", { name: "Record outcome", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await stale
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await stale
      .getByRole("alert")
      .filter({ hasText: "Another tab changed" })
      .waitFor();
    await stale.close();
    await page.addScriptTag({ path: require.resolve("axe-core") });
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
    assert.deepEqual(violations, []);
    for (const width of [320, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `overflow ${width}`,
      );
    }
    await page.evaluate(() =>
      localStorage.setItem("diamond-alibi.practice.v1", "broken"),
    );
    await page.reload();
    await page
      .getByRole("alert")
      .filter({ hasText: "could not be read" })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Create practice day", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("diamond-alibi.practice.v1"),
      ),
      "broken",
    );
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Clear practice scorebook", exact: true })
      .click();
    await page.getByLabel("Fence HR limit for this practice day").waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS local practice: outcomes, next batter, completed-game corrections/recalculation, rule versions, scope filters, saved recovery, offline guard, stale-tab guard, corrupt-data preservation, mobile and accessibility. No backend writes.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
