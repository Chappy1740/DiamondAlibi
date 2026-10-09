// Actual UI + reviewed SQL in disposable PostgreSQL. Auth identity is synthetic.
const { chromium } = require("playwright");
const { PGlite } = require("@electric-sql/pglite");
const esbuild = require("esbuild"),
  fs = require("node:fs"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
(async () => {
  const db = new PGlite();
  let browser,
    server,
    fault = "",
    sequence = Promise.resolve();
  const errors = [],
    external = [];
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
      create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,private to authenticated;
      create table public.teams(id uuid primary key);
      create table public.team_seasons(team_id uuid references public.teams(id),id uuid primary key,archived boolean default false,unique(team_id,id));
      create table public.team_players(team_id uuid references public.teams(id),id uuid primary key,display_name text,is_guest boolean,unique(team_id,id));
      create table public.team_memberships(team_id uuid,user_id uuid,active boolean,primary key(team_id,user_id));
      create table private.audit_events(id bigint generated always as identity primary key,team_id uuid,actor_id uuid references auth.users(id),operation text,entity_id uuid,created_at timestamptz default now());
      create function private.is_member(p_team uuid) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.team_memberships m where m.team_id=p_team and m.user_id=auth.uid() and m.active)$$;
      revoke all on function private.is_member(uuid) from public,anon;grant execute on function private.is_member(uuid) to authenticated;
      grant select on public.team_players,public.team_seasons to authenticated;
      insert into auth.users values('${id(1)}');insert into public.teams values('${id(10)}');insert into public.team_seasons values('${id(10)}','${id(11)}',false);
      insert into public.team_memberships values('${id(10)}','${id(1)}',true);
      insert into public.team_players values('${id(10)}','${id(101)}','Synthetic Alex',false),('${id(10)}','${id(102)}','Synthetic Morgan',false),('${id(10)}','${id(103)}','Synthetic Guest',true);`);
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/20261009192021_m43_tournament_season_scoring.sql",
        "utf8",
      ),
    );
    await db.exec(
      `select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated;`,
    );
    const { connectedScoring } =
      await import("../src/lib/connected-scoring.ts");
    const args = {
      da_read_scoring_season: ["p_team", "p_season", "p_scope"],
      da_read_scoring_audit: [
        "p_team",
        "p_season",
        "p_limit",
        "p_cursor_at",
        "p_cursor_key",
      ],
      da_create_scoring_tournament: ["p_team", "p_season", "p_id", "p_name"],
      da_start_scoring_game: [
        "p_team",
        "p_season",
        "p_day",
        "p_date",
        "p_tournament",
        "p_command",
        "p_expected",
        "p_tournament_expected",
        "p_setup",
      ],
      da_apply_scoring_game_change: [
        "p_team",
        "p_season",
        "p_day",
        "p_game",
        "p_command",
        "p_expected",
        "p_tournament_expected",
        "p_change",
      ],
      da_correct_tournament_band: [
        "p_team",
        "p_season",
        "p_tournament",
        "p_command",
        "p_expected",
        "p_player",
        "p_has_band",
        "p_reason",
      ],
    };
    const client = {
      auth: {
        getUser: async () => ({ data: { user: { id: id(1) } }, error: null }),
      },
      rpc: async (name, input) => {
        try {
          return {
            data: (
              await db.query(
                `select public.${name}(${args[name].map((_, i) => `$${i + 1}`).join(",")}) as result`,
                args[name].map((k) => input[k]),
              )
            ).rows[0].result,
            error: null,
          };
        } catch (e) {
          return { data: null, error: { code: e.code } };
        }
      },
    };
    const load = async (scope) => {
      const response = await connectedScoring(client, {
        type: "snapshot",
        teamId: id(10),
        seasonId: id(11),
        scope: scope || "Overall",
      });
      assert.equal(response.status, "ok");
      return {
        status: "ok",
        data: {
          snapshot: response.data,
          archived: false,
          roster: (
            await db.query(
              "select id,display_name,is_guest from public.team_players order by id",
            )
          ).rows,
          bands: (
            await db.query(
              "select tournament_id,player_id,has_band from public.scoring_tournament_bands",
            )
          ).rows,
          participation: (
            await db.query(
              "select game_id,player_id from public.scoring_game_players",
            )
          ).rows,
          leagueBands: (
            await db.query("select game_id,player_id from public.scoring_bands")
          ).rows,
        },
      };
    };
    const bundle = await esbuild.build({
      stdin: {
        contents: `import React from 'react';import{createRoot}from'react-dom/client';import{ConnectedScorebook}from'./src/components/connected-scorebook';const post=async(path,body)=>{const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return r.json()};post('/load',{scope:'Overall'}).then(initial=>createRoot(document.getElementById('app')).render(<main className="connected-wrap"><h1>Synthetic team scorebook</h1><ConnectedScorebook storageKey="synthetic.pending" teamId="${id(10)}" seasonId="${id(11)}" initial={initial} submitAction={input=>post('/action',input)} reloadAction={(team,season,scope)=>post('/load',{scope})}/></main>));`,
        resolveDir: process.cwd(),
        loader: "tsx",
      },
      bundle: true,
      write: false,
      platform: "browser",
      jsx: "automatic",
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((req, res) => {
      if (req.method === "GET") {
        res.setHeader(
          "content-type",
          req.url === "/bundle.js" ? "text/javascript" : "text/html",
        );
        res.end(
          req.url === "/bundle.js"
            ? bundle.outputFiles[0].text
            : `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Disposable scorebook validation</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`,
        );
        return;
      }
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        sequence = sequence
          .then(async () => {
            const input = JSON.parse(raw);
            let result;
            if (req.url === "/load") result = await load(input.scope);
            else if (fault === "conflict") {
              fault = "";
              result = {
                status: "ok",
                data: { status: "conflict", revision: 999 },
              };
            } else {
              result = await connectedScoring(client, input);
              if (fault === "uncertain") {
                fault = "";
                result = { status: "uncertain", commandId: input.commandId };
              }
            }
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(result));
          })
          .catch((e) => {
            errors.push(e.message);
            res.statusCode = 500;
            res.end("{}");
          });
      });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.BROWSER_EXECUTABLE ||
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== base) {
        external.push(route.request().url());
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(base);
    await page
      .getByRole("heading", { name: "Set up a game", exact: true })
      .waitFor();
    const setup = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Set up a game", exact: true }),
      });
    const saved = async () => {
      await page
        .getByText("Saved to the team scorebook.", { exact: true })
        .waitFor();
      await assertDisabled(false);
    };
    const assertDisabled = async (value) => {
      const b = page.getByRole("button", { name: "Start game", exact: true });
      if (value)
        await b.evaluate((el) => {
          if (!el.matches(":disabled")) throw Error("Expected paused writes");
        });
      else
        await b.evaluate((el) => {
          if (el.matches(":disabled")) throw Error("Expected enabled writes");
        });
    };
    await setup
      .getByLabel("Opponent", { exact: true })
      .fill("Synthetic zero league");
    await setup.getByLabel("Game date", { exact: true }).fill("2026-10-09");
    await setup
      .getByLabel("Fence HR limit for this game", { exact: true })
      .fill("0");
    await setup.locator('input[name="player"]').nth(2).uncheck();
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await saved();
    assert.deepEqual(errors, []);
    assert.equal((await load("Overall")).data.snapshot.games.length, 1);
    await page
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("Fence HR");
    await page
      .getByRole("button", { name: "Record plate appearance", exact: true })
      .click();
    await saved();
    await page.getByText(/Synthetic Alex · OLHR/).waitFor();
    await page
      .getByRole("button", { name: "Mark game complete", exact: true })
      .click();
    await saved();
    await page.getByText(/Synthetic Alex · OLHR/).click();
    await page
      .getByLabel("Correct outcome", { exact: true })
      .selectOption("Hit");
    await page.getByLabel("Correct runs", { exact: true }).fill("0");
    await page.getByLabel("Correct RBI", { exact: true }).fill("0");
    await page
      .getByLabel("Correction reason", { exact: true })
      .fill("Synthetic league correction");
    await page
      .getByRole("button", { name: "Save correction", exact: true })
      .click();
    await saved();
    await setup.getByText("Create a tournament", { exact: true }).click();
    await setup
      .getByLabel("Tournament name", { exact: true })
      .fill("Synthetic Cup");
    await page
      .getByRole("button", { name: "Create tournament", exact: true })
      .click();
    await saved();
    await setup
      .getByLabel("Game kind", { exact: true })
      .selectOption("Tournament");
    await setup
      .getByLabel("Opponent", { exact: true })
      .fill("Synthetic Cup first");
    await setup
      .getByLabel("Fence HR limit for this game", { exact: true })
      .fill("1");
    await setup
      .getByLabel("HR Band for Synthetic Alex", { exact: false })
      .check();
    await setup.locator('input[name="player"]').nth(2).uncheck();
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await saved();
    await page
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("Fence HR");
    await page
      .getByRole("button", { name: "Record plate appearance", exact: true })
      .click();
    await saved();
    await setup.getByLabel("Game date", { exact: true }).fill("2026-10-10");
    await setup
      .getByLabel("Opponent", { exact: true })
      .fill("Synthetic Cup later");
    assert.equal(
      await setup
        .getByLabel("HR Band for Synthetic Alex", { exact: false })
        .isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await saved();
    await page
      .getByRole("button", { name: "Record plate appearance", exact: true })
      .click();
    await saved();
    const bandSection = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", {
          name: "Tournament Band corrections",
          exact: true,
        }),
      });
    await bandSection.getByText("Synthetic Cup", { exact: true }).click();
    const correction = bandSection
      .locator("form")
      .filter({
        has: page.getByLabel("HR Band for Synthetic Alex", { exact: false }),
      });
    await correction
      .getByLabel("HR Band for Synthetic Alex", { exact: false })
      .uncheck();
    await correction
      .getByLabel("Band correction reason", { exact: true })
      .fill("Synthetic whole-tournament correction");
    await correction
      .getByRole("button", { name: "Correct tournament Band", exact: true })
      .click();
    await saved();
    const row = page
      .getByRole("region", { name: "Season statistics" })
      .getByRole("row")
      .filter({
        has: page.getByRole("rowheader", {
          name: "Synthetic Alex",
          exact: true,
        }),
      });
    assert.equal(await row.getByRole("cell").last().innerText(), "2");
    await page.getByRole("button", { name: "League", exact: true }).click();
    await page
      .getByRole("button", { name: "League", exact: true })
      .evaluate((el) => {
        if (el.getAttribute("aria-pressed") !== "true")
          throw Error("Scope not selected");
      });
    assert.equal(await row.getByRole("cell").last().innerText(), "2");
    assert.equal(await page.getByText("AVG", { exact: true }).count(), 0);
    fault = "conflict";
    await page
      .getByRole("button", { name: "Record plate appearance", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "I reviewed the latest scorebook",
        exact: true,
      })
      .waitFor();
    await assertDisabled(true);
    await page
      .getByRole("button", {
        name: "I reviewed the latest scorebook",
        exact: true,
      })
      .click();
    fault = "uncertain";
    await page.getByLabel("Batting outcome", { exact: true }).selectOption("K");
    await page
      .getByRole("button", { name: "Record plate appearance", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Retry the same change", exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: "Retry the same change", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Retry the same change", exact: true })
      .click();
    await page
      .getByText("Previous save confirmed. The change was recorded once.", {
        exact: true,
      })
      .waitFor();
    assert.equal(await page.locator(".scorebook-play").count(), 2);
    await page.getByText("Edit batting order", { exact: true }).click();
    const lineupEditor = page
      .locator("details")
      .filter({ has: page.getByText("Edit batting order", { exact: true }) });
    await lineupEditor.locator('input[name="player"]').nth(2).check();
    await lineupEditor
      .getByRole("button", { name: "Save lineup", exact: true })
      .click();
    await saved();
    assert.equal(
      await lineupEditor
        .getByLabel("HR Band for Synthetic Guest", { exact: false })
        .isDisabled(),
      true,
    );
    await page.getByText("Change next batter", { exact: true }).click();
    await page
      .getByLabel("Next batter override", { exact: true })
      .selectOption(id(103));
    await page
      .getByRole("button", { name: "Apply next batter", exact: true })
      .click();
    await saved();
    await page
      .getByRole("heading", {
        name: "Next batter: Synthetic Guest",
        exact: true,
      })
      .waitFor();
    await page
      .getByLabel("Batting outcome", { exact: true })
      .selectOption("BB");
    await page
      .getByRole("button", { name: "Record plate appearance", exact: true })
      .click();
    await saved();
    await page
      .getByRole("heading", {
        name: "Next batter: Synthetic Alex",
        exact: true,
      })
      .waitFor();
    await context.setOffline(true);
    await page.getByText(/Offline. Scoring is paused/).waitFor();
    await assertDisabled(true);
    await context.setOffline(false);
    await page
      .getByRole("button", { name: "Refresh scorebook", exact: true })
      .click();
    await page
      .getByText(
        "Scorebook refreshed. Review the latest numbers before scoring.",
        { exact: true },
      )
      .waitFor();
    await assertDisabled(false);
    await page
      .getByRole("button", { name: "Load audit history", exact: true })
      .click();
    await page.getByText(/history entries loaded/).waitFor();
    await page.addScriptTag({ path: require.resolve("axe-core") });
    for (const width of [320, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        console.log(
          await page.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
              .slice(0, 12)
              .map((el) => ({
                tag: el.tagName,
                cls: el.className,
                right: el.getBoundingClientRect().right,
                text: el.textContent.slice(0, 45),
              })),
          ),
        );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Overflow at ${width}`,
      );
      const violations = await page.evaluate(
        async () =>
          (
            await axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            })
          ).violations,
      );
      assert.deepEqual(
        violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        [],
        `Accessibility at ${width}`,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: ".cache/connected-scorebook-mobile.png",
      fullPage: true,
    });
    await page.screenshot({ path: ".cache/connected-scorebook-viewport.png" });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS: connected UI + reviewed SQL: zero HR, completed correction, cross-date Bands, whole-tournament replay, season Board/scope, conflict review, committed-but-unconfirmed retry across reload, offline pause, audit, mobile overflow/accessibility. Disposable database; synthetic auth, not real Supabase session evidence.",
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
