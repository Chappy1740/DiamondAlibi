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
    const context = await browser.newContext(),
      page = await context.newPage();
    await page.addInitScript(() => {
      window.testCopies = [];
      window.testShares = [];
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (text) => window.testCopies.push(text) },
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data) => window.testShares.push(data),
      });
    });
    const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
    await page.goto(`${base}/more/alibi`);
    const generate = page.getByRole("button", {
      name: "Plead the Fifth? Nah. Generate an Alibi.",
      exact: true,
    });
    for (const category of [
      "New Gear",
      "At Home",
      "Bad Plays",
      "Team Shenanigans",
    ]) {
      await page.getByLabel("Category", { exact: true }).selectOption(category);
      await generate.click();
      const first = await page.locator("blockquote").innerText();
      await generate.click();
      assert.notEqual(await page.locator("blockquote").innerText(), first);
    }
    assert.deepEqual(await page.evaluate(() => window.testCopies), []);
    assert.deepEqual(await page.evaluate(() => window.testShares), []);
    await page.getByRole("button", { name: "Copy alibi", exact: true }).click();
    await page.getByText("Alibi copied.", { exact: false }).waitFor();
    assert.equal((await page.evaluate(() => window.testCopies)).length, 1);
    await page
      .getByRole("button", { name: "Share alibi", exact: true })
      .click();
    assert.equal((await page.evaluate(() => window.testShares)).length, 1);
    await page.evaluate(() =>
      Object.defineProperty(navigator, "share", {
        value: async () => {
          throw new DOMException("Canceled", "AbortError");
        },
      }),
    );
    await page
      .getByRole("button", { name: "Share alibi", exact: true })
      .click();
    await page.getByText("Sharing canceled.", { exact: false }).waitFor();
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async () => {
            throw new Error("Denied");
          },
        },
      }),
    );
    await page.getByRole("button", { name: "Copy alibi", exact: true }).click();
    await page.getByText("Clipboard unavailable.", { exact: false }).waitFor();
    const unsupported = await context.newPage();
    await unsupported.addInitScript(() =>
      Object.defineProperty(navigator, "share", { value: undefined }),
    );
    await unsupported.goto(`${base}/more/alibi`);
    await unsupported
      .getByRole("button", {
        name: "Plead the Fifth? Nah. Generate an Alibi.",
        exact: true,
      })
      .click();
    assert.equal(
      await unsupported
        .getByRole("button", { name: "Share alibi", exact: true })
        .isDisabled(),
      true,
    );
    console.log(
      "PASS local alibis: exact categories/button, no immediate repetition, explicit copy/share only, cancellation and unavailable-device handling. Clipboard/share mocked; nothing externally shared.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
