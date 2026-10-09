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
    await page.goto(
      `${process.env.PREVIEW_URL || "http://127.0.0.1:3000"}/practice`,
    );
    await page.getByLabel("Season name", { exact: true }).fill("Fall sample");
    await page.getByLabel("League fence HR limit", { exact: true }).fill("1");
    await page
      .getByRole("button", { name: "Create practice season", exact: true })
      .click();
    await page.getByText("Add a tournament", { exact: true }).click();
    await page
      .getByLabel("Tournament name", { exact: true })
      .fill("Weekend cup");
    await page
      .getByLabel("Games guaranteed", { exact: true })
      .selectOption("3");
    await page
      .getByLabel("Tournament fence HR limit", { exact: true })
      .fill("1");
    await page
      .getByRole("button", { name: "Add tournament", exact: true })
      .click();
    const start = async (opponent, date) => {
      await page.getByLabel("Opponent", { exact: true }).fill(opponent);
      await page.getByLabel("Game date", { exact: true }).fill(date);
      await page
        .getByRole("button", { name: "Start game", exact: true })
        .click();
      await page
        .getByRole("heading", { name: `Score vs ${opponent}`, exact: true })
        .waitFor();
    };
    const table = page.getByRole("region", { name: "Practice statistics" });
    const board = async () =>
      table.getByRole("row").nth(1).getByRole("cell").last().textContent();
    // First tournament game assigns Alex a Band, then both dates use it.
    await page
      .getByRole("group", {
        name: "First tournament game Bands (multiple or none)",
      })
      .getByLabel("Alex (sample)", { exact: true })
      .check();
    await start("Friday sample", "2026-10-09");
    await page
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("Fence HR");
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    assert.equal(await board(), "-1");
    await start("Sunday sample", "2026-10-11");
    const fixed = page
      .getByRole("group", {
        name: "First tournament game Bands (multiple or none)",
      })
      .getByRole("checkbox")
      .first();
    assert.equal(await fixed.isDisabled(), true);
    assert.equal(await fixed.isChecked(), true);
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    assert.equal(await board(), "-2");
    await page.getByLabel("Practice statistics scope").selectOption("League");
    assert.equal(
      await table
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .first()
        .textContent(),
      "0",
    );
    assert.equal(await board(), "-2"); // Board is season-wide even when stats are filtered.
    const option = await page
      .getByLabel("Tournament Band assignment")
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await page.getByLabel("Tournament Band assignment").selectOption(option);
    await page.getByLabel("Corrected Band status").selectOption("false");
    await page
      .getByLabel("Band correction reason", { exact: true })
      .fill("Correct the first designation");
    await page
      .getByRole("button", {
        name: "Save tournament Band correction",
        exact: true,
      })
      .click();
    assert.equal(await board(), "+2");
    await page.getByLabel("Game classification").selectOption("League");
    await page.getByLabel("Game fence HR limit override").fill("0");
    await start("Zero limit sample", "2026-10-12");
    await page
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await page.getByText("Alex (sample): OLHR", { exact: false }).waitFor();
    assert.equal(await board(), "+3");
    const fall = await page.getByLabel("Selected season").inputValue();
    await page
      .getByText("Start another practice season", { exact: true })
      .click();
    await page
      .getByLabel("New season name", { exact: true })
      .fill("Spring sample");
    await page
      .getByLabel("New season league fence HR limit", { exact: true })
      .fill("0");
    await page
      .getByRole("button", { name: "Create next season", exact: true })
      .click();
    assert.equal(await board(), "0");
    await page.getByLabel("Selected season").selectOption(fall);
    assert.equal(await board(), "+3");
    await page.reload();
    await page.getByLabel("Selected season").selectOption(fall);
    assert.equal(await board(), "+3");
    await page.addScriptTag({ path: require.resolve("axe-core") });
    assert.deepEqual(
      await page.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => v.id),
      ),
      [],
    );
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
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: ".cache/practice-season-validation.png",
      fullPage: true,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".cache/practice-season-mobile.png" });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS season practice: cross-date fixed Bands, whole-tournament correction, combined Board independent of stats filter, zero-HR override, fresh season/history, reload, mobile overflow and automated accessibility. Synthetic local data only.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
