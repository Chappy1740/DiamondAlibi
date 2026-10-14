const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
        external.push(url.hostname);
        return route.abort();
      }
      return route.continue();
    });
    const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
    await page.goto(base + "/review");
    await page.evaluate(() =>
      localStorage.setItem(
        "diamond-alibi.practice.v2",
        "preserve-normal-practice",
      ),
    );
    const frame = page.frameLocator("iframe");
    await frame
      .getByRole("heading", { name: "Live now", exact: true })
      .waitFor();
    assert.equal(
      await frame
        .getByLabel("Sample player", { exact: true })
        .locator("option")
        .count(),
      12,
    );
    assert.equal(
      await frame
        .getByLabel("Season", { exact: true })
        .locator("option")
        .count(),
      4,
    );
    assert.equal(
      await frame
        .getByRole("link", { name: "Use my account", exact: true })
        .count(),
      0,
    );
    // Bring the embedded phone's footer above the outer page's shared menu.
    await page.locator("iframe").evaluate(el => el.scrollIntoView({ block: "end" }));
    await frame
      .getByRole("navigation", { name: "Mobile primary" })
      .getByRole("link", { name: "Stats", exact: true })
      .click();
    await frame
      .getByRole("heading", { name: "Team leaders", exact: true })
      .waitFor();
    await frame.getByRole('region',{name:'Team player leaderboard',exact:true}).getByRole('button',{name:'View Hits rankings',exact:true}).click();
    assert.equal(await frame.locator('.leaderboard-players li').count(), 12);
    const forged = await page.request.get(
      base + "/review/history?team=forged-real-team&sample=0",
    );
    assert.equal(forged.status(), 200);
    assert.ok((await forged.text()).includes("Sample history"));
    await page
      .getByRole("button", { name: "Test scoring", exact: true })
      .click();
    await frame
      .getByRole("heading", { name: "Practice scorebook", exact: true })
      .waitFor();
    await frame
      .getByLabel("Season name", { exact: true })
      .fill("Reviewer sample");
    await frame.getByLabel("League fence HR limit", { exact: true }).fill("0");
    await frame
      .getByRole("button", { name: "Create practice season", exact: true })
      .click();
    assert.equal(
      await frame
        .getByRole("group", { name: "Lineup selection", exact: true })
        .getByRole("checkbox")
        .count(),
      12,
    );
    await frame.getByLabel("Opponent", { exact: true }).fill("Review opponent");
    await frame.getByLabel("Game date", { exact: true }).fill("2026-10-10");
    await frame
      .getByRole("button", { name: "Start game", exact: true })
      .click();
    await frame
      .getByRole("heading", { name: "Score vs Review opponent", exact: true })
      .waitFor();
    await frame
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("Fence HR");
    await frame
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    const journal = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("diamond-alibi.team-review.practice.v1")),
    );
    assert.equal(journal.initial.players.length, 12);
    assert.equal(journal.initial.teamId, "review-practice-team");
    assert.ok(journal.requests.length >= 3);
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("diamond-alibi.practice.v2"),
      ),
      "preserve-normal-practice",
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Test scoring", exact: true })
      .click();
    await frame
      .getByRole("heading", { name: "Score vs Review opponent", exact: true })
      .waitFor();
    const other = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const otherPage = await other.newPage();
    await otherPage.goto(base + "/review/scoring");
    await otherPage
      .getByRole("heading", { name: "Set up a practice season", exact: true })
      .waitFor();
    await other.close();
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const scoringFrame = page
      .frames()
      .find((f) => f.url().includes("/review/scoring"));
    await scoringFrame.addScriptTag({
      path: require.resolve("axe-core/axe.min.js"),
    });
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await scoringFrame.evaluate(
          () =>
            innerWidth <= 440 &&
            document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      for (const target of [page, scoringFrame]) {
        const result = await target.evaluate(async () =>
          axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
            },
          }),
        );
        assert.deepEqual(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
          [],
          `Accessibility at ${width}`,
        );
      }
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS review hub: phone frame, 12-player/four-season samples, forced synthetic context, scoring/restoration, independent browser journals, untouched normal practice, no external writes, mobile/WCAG.",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
