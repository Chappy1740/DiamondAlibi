const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
    await page.goto(base + "/?sample=1");
    await page
      .getByRole("heading", { name: "Live now", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByLabel("Sample player", { exact: true })
        .locator("option")
        .count(),
      12,
    );
    assert.equal(
      await page
        .getByLabel("Season", { exact: true })
        .locator("option")
        .count(),
      4,
    );
    await page
      .getByRole("link", { name: "View sample scorebook", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Plate appearances", exact: true })
      .waitFor();
    assert.equal(await page.locator("details").count(), 48);
    await page
      .getByRole("navigation", { name: "Mobile primary" })
      .getByRole("link", { name: "Home", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Live now", exact: true })
      .waitFor();
    await page
      .getByLabel("Sample player", { exact: true })
      .selectOption("sample-user-12");
    await page.getByRole("button", { name: "Apply context" }).click();
    await page
      .getByRole("heading", { name: "Your game, Lane.", exact: true })
      .waitFor();
    const nav = page.getByRole("navigation", { name: "Mobile primary" });
    await nav.getByRole("link", { name: "Stats", exact: true }).click();
    await page
      .getByRole("heading", { name: "Team summary", exact: true })
      .waitFor();
    assert.equal(await page.locator("tbody tr").count(), 12);
    assert.equal(
      await page
        .getByRole("columnheader", { name: "AVG", exact: true })
        .count(),
      0,
    );
    await page
      .getByLabel("Statistics view", { exact: true })
      .selectOption("League");
    await page.getByRole("button", { name: "Apply context" }).click();
    await page
      .getByText("16 league games in Season 2026", { exact: true })
      .waitFor();
    await nav.getByRole("link", { name: "Beverage", exact: true }).click();
    await page
      .getByRole("heading", { name: "Season Beverage Board", exact: true })
      .waitFor();
    const leagueBoard = await page.locator(".leaderboard").innerText();
    await page
      .getByLabel("Statistics view", { exact: true })
      .selectOption("Tournament");
    await page.getByRole("button", { name: "Apply context" }).click();
    await page
      .getByText("Season 2026 · Tournament", { exact: false })
      .first()
      .waitFor();
    assert.equal(await page.locator(".leaderboard").innerText(), leagueBoard);
    await page
      .getByLabel("Season", { exact: true })
      .selectOption("sample-season-2023");
    await page.getByRole("button", { name: "Apply context" }).click();
    await page
      .locator(".page-heading .eyebrow")
      .filter({ hasText: "Season 2023" })
      .waitFor();
    assert.notEqual(
      await page.locator(".leaderboard").innerText(),
      leagueBoard,
    );
    await nav.getByRole("link", { name: "Games", exact: true }).click();
    await page
      .getByRole("heading", { name: "Tournaments", exact: true })
      .waitFor();
    assert.equal(
      await page.getByText(/3-game guaranteed · \d+ games recorded/).count(),
      2,
    );
    for (const width of [320, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await nav.getByRole("link", { name: "Stats", exact: true }).click();
    await page
      .getByRole("heading", { name: "Team summary", exact: true })
      .waitFor();
    await page.addScriptTag({
      content: fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"),
    });
    const audit = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    assert.deepEqual(audit, []);
    fs.mkdirSync(".cache", { recursive: true });
    await page.screenshot({
      path: ".cache/dashboard-sample-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: sample main tabs, 12 players, four seasons, guarantee/game history, shared scopes/Board, phone widths and accessibility. No live records written.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
