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
    await page.goto(base + "/more?sample=1");
    await page
      .getByRole("link", { name: "Project status", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Project status", exact: true })
      .waitFor();
    const response = await page.request.get(base + "/api/project-status");
    assert.equal(response.status(), 200);
    assert.ok(response.headers()["cache-control"].includes("no-store"));
    const tracker = await response.json();
    const tasks = tracker.milestones.flatMap((m) => m.tasks);
    const done = tasks.filter(
      (t) => t.status === "done" && t.evidence.trim(),
    ).length;
    await page
      .getByRole("heading", {
        name: `Overall completion: ${Math.floor((done / tasks.length) * 100)}%`,
        exact: true,
      })
      .waitFor();
    for (const detail of await page
      .locator(".status-milestone details")
      .all()) {
      if (!(await detail.evaluate((el) => el.open)))
        await detail.locator("summary").click();
    }
    assert.equal(await page.locator(".status-tasks li").count(), tasks.length);
    await page
      .getByLabel("Show tasks", { exact: true })
      .selectOption("remaining");
    assert.equal(
      await page.locator(".status-tasks li").count(),
      tasks.length - done,
    );
    await page
      .getByLabel("Show tasks", { exact: true })
      .selectOption("complete");
    assert.equal(await page.locator(".status-tasks li").count(), done);
    await page.getByLabel("Show tasks", { exact: true }).selectOption("all");
    await page
      .getByRole("button", { name: "Refresh status", exact: true })
      .click();
    await page
      .getByRole("status")
      .getByText(/Latest published status checked/)
      .waitFor();
    assert.equal(
      await page.locator(".status-tasks li:visible").count(),
      tasks.length,
    );
    await page.route("**/api/project-status", (route) =>
      route.fulfill({ status: 503, body: "Unavailable" }),
    );
    await page
      .getByRole("button", { name: "Refresh status", exact: true })
      .click();
    await page
      .getByRole("status")
      .getByText(/Showing the last loaded snapshot/)
      .waitFor();
    assert.equal(await page.locator(".status-tasks li").count(), tasks.length);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow at ${width}`,
      );
      const result = await page.evaluate(async () =>
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
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `Accessibility at ${width}`,
      );
    }
    await page.unroute("**/api/project-status");
    await page
      .getByRole("button", { name: "Refresh status", exact: true })
      .click();
    await page
      .getByRole("status")
      .getByText(/Latest published status checked/)
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    fs.mkdirSync(".cache/status", { recursive: true });
    await page.screenshot({
      path: ".cache/status/status-390.png",
      fullPage: false,
    });
    assert.deepEqual(errors, []);
    console.log(
      `PASS status: ${tasks.length} required items, percentages, filters, More link, refresh/fallback, preserved disclosures, mobile overflow and WCAG checks.`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
