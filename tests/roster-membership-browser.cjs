// Real roster/invitation components, isolated services and fictional players only.
const { chromium, webkit } = require("playwright"),
  esbuild = require("esbuild"),
  fs = require("node:fs"),
  http = require("node:http"),
  assert = require("node:assert/strict");
(async () => {
  let browser, server;
  const errors = [];
  try {
    const built = await esbuild.build({
      stdin: {
        resolveDir: process.cwd(),
        loader: "tsx",
        contents: `import React from 'react';import{createRoot}from'react-dom/client';import{TeamRoster,TeamInvitations}from'./src/components/team-roster';
 const q=new URLSearchParams(location.search);window.__writes=[];window.__failure=false;window.__players=[{id:'player-1',display_name:'Synthetic Alex',is_guest:true},{id:'member',display_name:'Synthetic Member',is_guest:false},{id:'long',display_name:'Synthetic player with a long roster name',is_guest:true}];
 window.__action=async(form)=>{const input=Object.fromEntries(form);window.__writes.push(input);if(window.__failure)return{error:'Could not create this player invitation. Refresh and check team access; the player may already have an account.'};if(input.operation==='create-player-invite')return{code:'a'.repeat(36),message:'Private player invitation created. One account can use it within seven days. Share it only with this player; nothing was sent.'};if(input.operation==='guest'){window.__players.push({id:'added',display_name:input.name,is_guest:true});window.__render();}return{message:'Saved to your clubhouse.'}};
 const root=createRoot(document.getElementById('app'));window.__render=()=>root.render(<main className="connected-wrap"><section className="card detail-card"><h1>Synthetic roster review</h1><TeamRoster team="synthetic-team" players={window.__players} playerInvitesAvailable={!q.has('unsupported')}/></section><TeamInvitations team="synthetic-team" players={window.__players} playerInvitesAvailable={!q.has('unsupported')} playerInvites={[{invite_id:'targeted',player_id:'player-1'}]} invites={[{id:'targeted',uses:0,max_uses:1,revoked_at:null,expires_at:'2099-01-01'},{id:'used',uses:1,max_uses:1,revoked_at:null,expires_at:'2099-01-01'},{id:'revoked',uses:0,max_uses:1,revoked_at:'2026-01-01',expires_at:'2099-01-01'},{id:'expired',uses:0,max_uses:1,revoked_at:null,expires_at:'2000-01-01'}]}/></main>);window.__render();`,
      },
      bundle: true,
      write: false,
      platform: "browser",
      jsx: "automatic",
      plugins: [
        {
          name: "mock",
          setup(b) {
            b.onResolve({ filter: /^@\/app\/club\/actions$/ }, (a) => ({
              path: a.path,
              namespace: "mock",
            }));
            b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
              contents:
                "export const clubAction=async(_,form)=>window.__action(form)",
            }));
          },
        },
      ],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((req, res) => {
      res.setHeader("content-type", "text/html");
      res.end(
        '<html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic roster review</title><style>' +
          css +
          '</style><body><div id="app"></div><script>' +
          built.outputFiles[0].text +
          "</script></body></html>",
      );
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = "http://127.0.0.1:" + server.address().port;
    const engine = process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
    browser = await engine.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.getByRole("heading", { name: "Roster", exact: true }).waitFor();
    assert.equal(
      await page.getByText("Guest", { exact: false }).count(),
      0,
      "roster uses regular-player wording",
    );
    assert.equal(
      await page.getByText("No account", { exact: true }).count(),
      2,
    );
    assert.equal(
      await page.getByText("Account linked", { exact: true }).count(),
      1,
    );
    assert.equal(
      await page
        .getByRole("button", {
          name: "Create membership invite for Synthetic Member",
          exact: true,
        })
        .count(),
      0,
    );
    const invite = page.getByRole("button", {
      name: "Create membership invite for Synthetic Alex",
      exact: true,
    });
    await invite.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => window.__writes.length), 0);
    await page.getByText(/gain team access, including scoring/).waitFor();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__writes.length), 0);
    assert.equal(
      await invite.evaluate((el) => document.activeElement === el),
      true,
    );
    await invite.click();
    await page
      .getByRole("button", {
        name: "Confirm create membership invite for synthetic alex",
        exact: true,
      })
      .click();
    await page.getByLabel("New invite code").waitFor();
    assert.equal(
      await page.getByLabel("New invite code").textContent(),
      "a".repeat(36),
    );
    const write = await page.evaluate(() => window.__writes[0]);
    assert.equal(write.operation, "create-player-invite");
    assert.equal(write.player, "player-1");
    assert.equal(write.team, "synthetic-team");
    assert.equal(
      write.maxUses,
      undefined,
      "player-specific invitations cannot request group access",
    );
    const roster = page.getByRole("region", {
      name: "Team roster",
      exact: true,
    });
    await roster
      .getByLabel("Player name", { exact: true })
      .fill("Synthetic New Player");
    await roster
      .getByRole("button", { name: "Add player", exact: true })
      .click();
    await roster.getByText("Synthetic New Player", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => window.__writes.at(-1).operation),
      "guest",
      "existing roster save RPC adapter is reused",
    );
    await page
      .getByText("Invite someone not on the roster", { exact: true })
      .click();
    await page.getByLabel("Maximum joins", { exact: true }).fill("2");
    await page
      .getByRole("button", { name: "Create invite code", exact: true })
      .click();
    assert.equal(
      await page.evaluate(() => window.__writes.at(-1).operation),
      "create-invite",
    );
    await page
      .getByText("Player membership invite: Synthetic Alex · 0/1 uses", {
        exact: false,
      })
      .waitFor();
    await page.getByText("1/1 uses · Used", { exact: false }).waitFor();
    await page.getByText("0/1 uses · Revoked", { exact: false }).waitFor();
    await page.getByText("0/1 uses · Expired", { exact: false }).waitFor();
    for (const width of [320, 390, 800, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "roster fits " + width,
      );
      for (const button of await page.getByRole("button").all()) {
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          assert(box.height >= 44, "44px touch target");
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "125%"),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "large-text containment",
    );
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    if (process.env.ROSTER_SCREENSHOT) {
      await page.goto(base);
      await page.setViewportSize({ width: 390, height: 844 });
      await page
        .getByRole("heading", { name: "Roster", exact: true })
        .waitFor();
      await page.screenshot({
        path: process.env.ROSTER_SCREENSHOT,
        fullPage: true,
      });
    }
    await page.goto(base);
    await page.evaluate(() => (window.__failure = true));
    await page
      .getByRole("button", {
        name: "Create membership invite for Synthetic Alex",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: "Confirm create membership invite for synthetic alex",
        exact: true,
      })
      .click();
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page.getByLabel("New invite code").count(),
      0,
      "failed invitation never displays success or code",
    );
    await page.goto(base + "?unsupported");
    await page
      .getByText("Player account linking is unavailable right now.", {
        exact: false,
      })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: /Create membership invite/ })
        .count(),
      0,
      "unapplied/unavailable RPC has no fake linking control",
    );
    await page
      .getByRole("button", { name: "Add player", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS " +
        (process.env.BROWSER_ENGINE || "chromium") +
        " regular roster/invites: no guest labels, account distinction, exact-player confirmation/cancel/keyboard, single-player payload, add player, general invite separation, statuses, truthful failure, unavailable capability, 320-1440px and large text. Synthetic services only.",
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
