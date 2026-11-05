// Clubhouse "Announcer setup" in a real browser with a stubbed speech engine. No external writes.
// Checks: test button speaks one line and shows the readout, volume is saved, and the setup NEVER
// designates a game or turns announcing on (that stays a per-game choice). CI: Chromium and WebKit.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild"), http = require("node:http"), fs = require("node:fs"), assert = require("node:assert/strict");
(async () => {
  let browser, server;
  try {
    const build = await esbuild.build({
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
import React from 'react';import{createRoot}from'react-dom/client';
import{AnnouncerSetup}from'./src/components/announcer-setup';
createRoot(document.getElementById('app')).render(<main><AnnouncerSetup/></main>);
` },
      bundle: true, write: false, jsx: "automatic", platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
      plugins: [{ name: "synthetic", setup(b) {
        b.onResolve({ filter: /club\/roast-club-actions$/ }, () => ({ path: "a", namespace: "synthetic" }));
        b.onLoad({ filter: /.*/, namespace: "synthetic" }, () => ({ contents: "export const roastClubAction=async()=>({status:'unsupported'})", loader: "js" }));
      } }],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((q, s) => { s.setHeader("Content-Type", "text/html"); s.end('<html><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '</style><body><div id="app"></div><script>' + build.outputFiles[0].text.replace(/<\/script/g, "<\\/script") + '</script></body></html>'); });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    browser = await (process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium).launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}), args: process.env.BROWSER_ENGINE === "webkit" ? [] : ["--no-sandbox"] });
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.__spoken = [];
      window.SpeechSynthesisUtterance = function (text) { this.text = text; };
      const synth = { speaking: false, pending: false, paused: false, getVoices: () => [{ name: "Daniel", lang: "en-GB", voiceURI: "d" }],
        speak(u) { window.__spoken.push({ text: u.text, volume: u.volume }); setTimeout(() => { u.onstart && u.onstart({}); setTimeout(() => u.onend && u.onend({}), 20); }, 5); },
        cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {} };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    });
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.getByTestId("announcer-setup").waitFor();
    // Nothing is spoken and nothing is saved just by opening the setup.
    assert.equal(await page.evaluate(() => window.__spoken.length), 0);
    await page.getByLabel("Announcer volume").fill("0.5");
    await page.getByRole("button", { name: "Test announcer sound" }).click();
    await page.getByTestId("announcer-setup-diag").waitFor();
    const diag = await page.getByTestId("announcer-setup-diag").innerText();
    assert.match(diag, /Voices: 1\./); assert.match(diag, /finished/);
    const spoken = await page.evaluate(() => window.__spoken);
    assert.equal(spoken.length, 1); assert.ok(spoken[0].volume <= 0.5 + 1e-9, "test line uses the chosen volume");
    // Setup must never designate a game or unmute announcing.
    const saved = JSON.parse(await page.evaluate(() => Object.entries(localStorage).map(([, v]) => v)[0] || "{}"));
    assert.equal(saved.gameId ?? null, null); assert.equal(saved.muted, true); assert.equal(saved.volume, 0.5);
    assert.deepEqual(errors, []);
    console.log("announcer setup browser checks passed");
  } finally { await browser?.close(); server?.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
