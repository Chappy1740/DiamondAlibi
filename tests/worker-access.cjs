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
    const page = await browser.newPage();
    const base = process.env.PREVIEW_URL || "http://127.0.0.1:3002";
    await page.goto(`${base}/club`);
    await page.waitForURL(`${base}/login`);
    await page
      .getByRole("heading", { name: "Good stats start here.", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Sign in", exact: true })
        .isVisible(),
      true,
    );
    console.log(
      "PASS Worker access: anonymous clubhouse redirects to sign-in; no account created or email sent.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
