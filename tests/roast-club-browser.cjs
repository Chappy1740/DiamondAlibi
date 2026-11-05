// Real popup + announcer code in a browser with a synthetic consent action and a fake speech engine.
// No external writes. Written for CI (Chromium and WebKit); not run in the authoring sandbox.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild"), http = require("node:http"), fs = require("node:fs"), assert = require("node:assert/strict");
(async () => {
  let browser, server;
  try {
    const build = await esbuild.build({
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
import React from 'react';import{createRoot}from'react-dom/client';
import{useRoastClub}from'./src/components/roast-club-popup';import{AnnouncerControls}from'./src/components/announcer-controls';
const T='00000000-0000-4000-8000-000000000010',G='00000000-0000-4000-8000-000000000020',P1='00000000-0000-4000-8000-000000000101',P2='00000000-0000-4000-8000-000000000102';
window.__reads=0;window.__optedIn=[P1];window.__spoken=[];
window.__action=async()=>{window.__reads++;return{status:'ok',data:{teamId:T,canToggle:true,optedIn:false,optedInPlayerIds:[...window.__optedIn]}}};
const names={[P1]:'Synthetic Alex',[P2]:'Synthetic Sam'};
const games=(rows)=>[{game:{id:G},evaluation:{rows}}];
function App(){const r=useRoastClub(T);window.__announce=(commandId,playId,playerId,outcome,official,receipt)=>r.announce({request:{commandId,gameId:G,change:{type:'score',playId}},receipt:receipt||{status:'accepted',duplicate:false},games:games([{id:playId,playerId,outcome,official:official||outcome,voided:false}]),displayName:id=>names[id]});
return <div><button id="other">Other control</button>{r.popup}<AnnouncerControls gameId={G}/></div>}
createRoot(document.getElementById('app')).render(<App/>);` },
      bundle: true, write: false, jsx: "automatic", platform: "browser",
      plugins: [{ name: "synthetic", setup(b) {
        b.onResolve({ filter: /club\/roast-club-actions$/ }, () => ({ path: "a", namespace: "synthetic" }));
        b.onLoad({ filter: /.*/, namespace: "synthetic" }, () => ({ contents: "export const roastClubAction=i=>window.__action(i)", loader: "js" }));
      } }],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((q, s) => { s.setHeader("Content-Type", "text/html"); s.end('<html><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '</style><body><div id="app"></div><script>window.SpeechSynthesisUtterance=function(t){this.text=t};window.__spoken=[];Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{speak:u=>window.__spoken.push(u.text+"|"+u.volume),cancel(){}}});</script><script>' + build.outputFiles[0].text + "</script></body></html>"); });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    browser = await (process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium).launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}), args: process.env.BROWSER_ENGINE === "webkit" ? [] : ["--no-sandbox"] });
    const page = await browser.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.waitForFunction(() => typeof window.__announce === "function" && window.__reads >= 1);
    const A = "00000000-0000-4000-8000-0000000000";
    const call = (...a) => page.evaluate((x) => window.__announce(...x), a);
    // 1. opted-in player: popup shows, is dismissible, never blocks other controls.
    await call("c1", A + "50", "00000000-0000-4000-8000-000000000101", "2B");
    const popup = page.getByTestId("roast-popup"); await popup.waitFor();
    assert.match(await popup.innerText(), /Synthetic Alex/);
    await page.locator("#other").click(); // pointer-events pass through the popup body
    const close = page.getByRole("button", { name: "Dismiss roast" });
    const box = await close.boundingBox(); assert(box.width >= 43.9 && box.height >= 43.9, "close box " + JSON.stringify(box));
    await close.click(); assert.equal(await popup.count(), 0);
    // 1b. accessibility: polite live region, labeled dismiss button, keyboard-reachable and keyboard-dismissable, never steals focus.
    await call("c1b", A + "50b", "00000000-0000-4000-8000-000000000101", "2B");
    await popup.waitFor();
    assert.equal(await popup.getAttribute("role"), "status");
    assert.equal(await popup.getAttribute("aria-live"), "polite");
    assert.notEqual(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("aria-label")), "Dismiss roast");
    let reached = false;
    for (let i = 0; i < 8 && !reached; i++) { await page.keyboard.press("Tab"); reached = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("aria-label") === "Dismiss roast"); }
    assert(reached, "dismiss button reachable by Tab");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => !document.querySelector("[data-testid=roast-popup]"));
    // 2. duplicate command id and duplicate receipt show nothing.
    await call("c1", A + "50", "00000000-0000-4000-8000-000000000101", "2B");
    await call("c2", A + "51", "00000000-0000-4000-8000-000000000101", "2B", "2B", { status: "accepted", duplicate: true });
    await page.waitForTimeout(300); assert.equal(await popup.count(), 0);
    // 3. nonparticipant: nothing shown, no consent read.
    const before = await page.evaluate(() => window.__reads);
    await call("c3", A + "52", "00000000-0000-4000-8000-000000000102", "K");
    await page.waitForTimeout(300); assert.equal(await popup.count(), 0);
    assert.equal(await page.evaluate(() => window.__reads), before);
    // 4. immediate opt-out: cache still lists P1, fresh read does not.
    await page.evaluate(() => { window.__optedIn = []; });
    await call("c4", A + "53", "00000000-0000-4000-8000-000000000101", "1B");
    await page.waitForTimeout(300); assert.equal(await popup.count(), 0);
    await page.evaluate(() => { window.__optedIn = ["00000000-0000-4000-8000-000000000101"]; });
    // 5. over-limit HR gets the over-limit line, not a home-run line.
    await page.evaluate(() => { const n = Date.now() + 120000; Date.now = () => n; document.dispatchEvent(new Event("visibilitychange")); });
    await call("c5", A + "54", "00000000-0000-4000-8000-000000000101", "Fence HR", "OLHR");
    await popup.waitFor();
    assert.match(await popup.innerText(), /out/i);
    await close.click();
    // 6. announcer: silent until designated + unlocked; then only the roast (no plain result line), once.
    const P1 = "00000000-0000-4000-8000-000000000101", P2 = "00000000-0000-4000-8000-000000000102";
    await call("c6", A + "55", P1, "1B"); await page.waitForTimeout(200); await close.click().catch(() => {});
    assert.equal(await page.evaluate(() => window.__spoken.length), 0);
    await page.getByLabel("This device is the announcer for this game").check();
    await page.getByRole("button", { name: "Turn sound on and test" }).click();
    assert.equal(await page.evaluate(() => window.__spoken.at(-1).split("|")[0]), "Announcer on.");
    await call("c7", A + "56", P1, "Fence HR");
    await page.waitForFunction(() => window.__spoken.some((s) => s.includes("Synthetic Alex")));
    await close.click().catch(() => {});
    await call("c7", A + "56", P1, "Fence HR");
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__spoken.filter((s) => s.includes("Synthetic Alex")).length), 1, "same play spoken once");
    assert.equal(await page.evaluate(() => window.__spoken.some((s) => /^(Single|Home run|Double|Triple)\./.test(s))), false, "no plain result lines");
    // non-participant on the announcer phone: still silent.
    const afterAlex = await page.evaluate(() => window.__spoken.length);
    await call("c8", A + "57", P2, "Fence HR"); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__spoken.length), afterAlex);
    // over-limit roast for an opted-in player is spoken and says out.
    await call("c8b", A + "5b", P1, "Fence HR", "OLHR");
    await page.waitForFunction((n) => window.__spoken.length > n, afterAlex);
    assert.match(await page.evaluate(() => window.__spoken.at(-1)), /out/i);
    await close.click().catch(() => {});
    // 7. mute stops speech.
    await page.getByRole("button", { name: "Mute" }).click();
    const n = await page.evaluate(() => window.__spoken.length);
    await call("c9", A + "58", P1, "K"); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__spoken.length), n);
    // 8. mobile widths: no horizontal overflow with popup showing.
    await call("c10", A + "59", "00000000-0000-4000-8000-000000000101", "3B"); await popup.waitFor();
    for (const w of [320, 375, 768]) { await page.setViewportSize({ width: w, height: 800 }); await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); }
    assert.deepEqual(errors, []);
    console.log("roast club browser checks passed");
  } finally { await browser?.close(); server?.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
