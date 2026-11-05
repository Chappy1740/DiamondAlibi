// Real Join/Leave control in a browser with a synthetic per-team consent action. No external writes.
// Checks that each team shows its own name and opt-in state, that a change goes only to the team clicked,
// and that switching the team on one control swaps to that team's state. CI: Chromium and WebKit.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild"), http = require("node:http"), fs = require("node:fs"), assert = require("node:assert/strict");
(async () => {
  let browser, server;
  try {
    const build = await esbuild.build({
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
import React from 'react';import{createRoot}from'react-dom/client';
import{RoastClubControls}from'./src/components/roast-club-controls';
const A='00000000-0000-4000-8000-00000000000a',B='00000000-0000-4000-8000-00000000000b';
window.__in={[A]:true,[B]:false};window.__changes=[];
window.__action=async(i)=>{
  if(i.type==='read')return{status:'ok',data:{teamId:i.teamId,canToggle:true,optedIn:window.__in[i.teamId],optedInPlayerIds:[]}};
  window.__changes.push({teamId:i.teamId,optedIn:i.optedIn});window.__in[i.teamId]=i.optedIn;return{status:'accepted',duplicate:false,optedIn:i.optedIn};
};
function Both(){return <main><RoastClubControls teamId={A} teamName="Alpha Aces"/><RoastClubControls teamId={B} teamName="Beta Bombers"/></main>}
function Switch(){const[t,setT]=React.useState(A);window.__switch=setT;return <main><RoastClubControls teamId={t} teamName={t===A?'Alpha Aces':'Beta Bombers'}/></main>}
const root=createRoot(document.getElementById('app'));
window.__show=(which)=>root.render(which==='both'?<Both/>:<Switch/>);
` },
      bundle: true, write: false, jsx: "automatic", platform: "browser",
      plugins: [{ name: "synthetic", setup(b) {
        b.onResolve({ filter: /club\/roast-club-actions$/ }, () => ({ path: "a", namespace: "synthetic" }));
        b.onLoad({ filter: /.*/, namespace: "synthetic" }, () => ({ contents: "export const roastClubAction=i=>window.__action(i)", loader: "js" }));
      } }],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((q, s) => { s.setHeader("Content-Type", "text/html"); s.end('<html><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '</style><body><div id="app"></div><script>' + build.outputFiles[0].text.replaceAll("</script", "<\\/script") + "</script>"); });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    browser = await (process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium).launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}), args: process.env.BROWSER_ENGINE === "webkit" ? [] : ["--no-sandbox"] });
    const page = await browser.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.waitForFunction(() => typeof window.__show === "function");

    // 1. Two teams at once: each shows its own name and its own state.
    await page.evaluate(() => window.__show("both"));
    const alpha = page.getByRole("group", { name: "Roast Club for Alpha Aces" });
    const beta = page.getByRole("group", { name: "Roast Club for Beta Bombers" });
    await alpha.waitFor(); await beta.waitFor();
    assert.match(await alpha.innerText(), /Alpha Aces/);
    assert.match(await alpha.innerText(), /You're in Roast Club on Alpha Aces/);
    assert.match(await alpha.innerText(), /Leave Roast Club/);
    assert.match(await beta.innerText(), /Roast Club is off for you on Beta Bombers/);
    assert.match(await beta.innerText(), /Join Roast Club/);

    // 2. Joining Beta changes only Beta.
    await beta.getByRole("button", { name: "Join Roast Club" }).click();
    await beta.getByText("You're in Roast Club on Beta Bombers").waitFor();
    assert.deepEqual(await page.evaluate(() => window.__changes), [{ teamId: "00000000-0000-4000-8000-00000000000b", optedIn: true }]);
    assert.match(await alpha.innerText(), /You're in Roast Club on Alpha Aces/);
    await beta.getByRole("button", { name: "Leave Roast Club" }).click();
    await beta.getByText("Roast Club is off for you on Beta Bombers").waitFor();

    // 3. Switching the team on one control swaps in that team's own state (never the other team's).
    await page.evaluate(() => window.__show("switch"));
    const one = page.getByRole("group", { name: "Roast Club for Alpha Aces" });
    await one.getByText("You're in Roast Club on Alpha Aces").waitFor();
    await page.evaluate(() => window.__switch("00000000-0000-4000-8000-00000000000b"));
    const two = page.getByRole("group", { name: "Roast Club for Beta Bombers" });
    await two.getByText("Roast Club is off for you on Beta Bombers").waitFor();
    assert.equal(await page.getByText("You're in Roast Club on Alpha Aces").count(), 0);
    await page.evaluate(() => window.__switch("00000000-0000-4000-8000-00000000000a"));
    await page.getByRole("group", { name: "Roast Club for Alpha Aces" }).getByText("You're in Roast Club on Alpha Aces").waitFor();

    // 4. Phone width: no horizontal overflow.
    await page.evaluate(() => window.__show("both"));
    for (const w of [320, 375]) { await page.setViewportSize({ width: w, height: 800 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "overflow at " + w); }
    assert.deepEqual(errors, []);
    console.log("roast club controls browser checks passed");
  } finally { await browser?.close(); await new Promise((r) => (server ? server.close(r) : r())); }
})().catch((e) => { console.error(e); process.exit(1); });
