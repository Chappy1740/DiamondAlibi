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
    await db.exec(
      "reset role;" +
        fs.readFileSync(
          "supabase/migrations/20261009210007_tournament_games_guaranteed.sql",
          "utf8",
        ) +
        "set role authenticated;",
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
      da_create_scoring_tournament: [
        "p_team",
        "p_season",
        "p_id",
        "p_name",
        "p_guaranteed_games",
      ],
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
    const bandPatch = fs.readFileSync(
      "supabase/migrations/20261009203125_tournament_only_bands.sql",
      "utf8",
    );
    // Simulate a pre-fix league Band, then prove the migration ignores it without deleting history.
    await db.exec("begin;");
    const leagueSetup = {
      type: "start",
      gameId: id(501),
      opponent: "Synthetic legacy league",
      kind: "League",
      lineup: [id(101)],
      rules: {
        version: "Synthetic band regression",
        fenceLimit: 5,
        board: {
          strikeout: 1,
          solo: 1,
          bandSolo: -1,
          grandSlam: -1,
          overLimit: 1,
          insidePark: -1,
          multiRun: 0,
        },
      },
      bands: { [id(101)]: true },
    };
    const startArgs = {
      p_team: id(10),
      p_season: id(11),
      p_day: id(500),
      p_date: "2026-10-01",
      p_tournament: null,
      p_command: id(502),
      p_expected: 0,
      p_tournament_expected: null,
      p_setup: leagueSetup,
    };
    assert.equal(
      (await client.rpc("da_start_scoring_game", startArgs)).error,
      null,
    );
    const changeArgs = {
      p_team: id(10),
      p_season: id(11),
      p_day: id(500),
      p_game: id(501),
      p_command: id(503),
      p_expected: 1,
      p_tournament_expected: null,
      p_change: {
        type: "score",
        gameId: id(501),
        playId: id(504),
        playerId: id(101),
        outcome: "Fence HR",
        runs: 1,
        rbi: 1,
      },
    };
    assert.equal(
      (await client.rpc("da_apply_scoring_game_change", changeArgs)).error,
      null,
    );
    const leagueBoard = async () =>
      (
        await client.rpc("da_read_scoring_season", {
          p_team: id(10),
          p_season: id(11),
          p_scope: "Overall",
        })
      ).data.board[id(101)];
    assert.equal(await leagueBoard(), -1);
    await db.exec("reset role;" + bandPatch + "set role authenticated;");
    assert.equal(await leagueBoard(), 1);
    assert.equal(
      (await db.query("select count(*)::int as n from public.scoring_bands"))
        .rows[0].n,
      1,
    );
    await db.exec("savepoint rejected_start;");
    assert.equal(
      (
        await client.rpc("da_start_scoring_game", {
          ...startArgs,
          p_day: id(510),
          p_command: id(511),
          p_date: "2026-10-02",
          p_setup: { ...leagueSetup, gameId: id(512) },
        })
      ).error?.code,
      "22023",
    );
    await db.exec(
      "rollback to savepoint rejected_start; savepoint rejected_lineup;",
    );
    assert.equal(
      (
        await client.rpc("da_apply_scoring_game_change", {
          ...changeArgs,
          p_command: id(513),
          p_expected: 2,
          p_change: {
            type: "lineup",
            gameId: id(501),
            lineup: [id(101), id(103)],
            leagueBands: { [id(103)]: true },
          },
        })
      ).error?.code,
      "22023",
    );
    await db.exec("rollback to savepoint rejected_lineup;");
    assert.equal(
      (
        await client.rpc("da_apply_scoring_game_change", {
          ...changeArgs,
          p_command: id(514),
          p_expected: 2,
          p_change: {
            ...changeArgs.p_change,
            playId: id(515),
            outcome: "K",
            runs: 0,
            rbi: 0,
          },
        })
      ).error,
      null,
    );
    assert.equal(await leagueBoard(), 2);
    await db.exec(
      "rollback;reset role;" + bandPatch + "set role authenticated;",
    );
    await db.exec(
      "reset role;" +
        fs.readFileSync(
          "supabase/migrations/20261009224553_game_scoreboard_tournament_numbers.sql",
          "utf8",
        ) +
        "set role authenticated;",
    );
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
    await db.exec("begin;");
    const tournamentArgs = {
      p_team: id(10),
      p_season: id(11),
      p_id: id(700),
      p_name: "Synthetic guarantee",
      p_guaranteed_games: 2,
    };
    assert.equal(
      (await client.rpc("da_create_scoring_tournament", tournamentArgs)).error,
      null,
    );
    assert.equal(
      (await load()).data.snapshot.tournaments[0].guaranteedGames,
      2,
    );
    assert.equal(
      (await client.rpc("da_create_scoring_tournament", tournamentArgs)).data
        .duplicate,
      true,
    );
    await db.exec("savepoint changed_guarantee;");
    assert.equal(
      (
        await client.rpc("da_create_scoring_tournament", {
          ...tournamentArgs,
          p_guaranteed_games: 3,
        })
      ).error?.code,
      "22023",
    );
    await db.exec(
      "rollback to savepoint changed_guarantee; savepoint invalid_guarantee;",
    );
    assert.equal(
      (
        await client.rpc("da_create_scoring_tournament", {
          ...tournamentArgs,
          p_id: id(701),
          p_guaranteed_games: 4,
        })
      ).error?.code,
      "22023",
    );
    await db.exec(
      "rollback to savepoint invalid_guarantee;savepoint missing_guarantee;",
    );
    assert.equal(
      (
        await client.rpc("da_create_scoring_tournament", {
          ...tournamentArgs,
          p_id: id(702),
          p_guaranteed_games: null,
        })
      ).error?.code,
      "22023",
    );
    await db.exec("rollback to savepoint missing_guarantee;");
    await db.query("select public.da_create_scoring_tournament($1,$2,$3,$4)", [
      id(10),
      id(11),
      id(703),
      "Synthetic older client",
    ]);
    assert.equal(
      (await load()).data.snapshot.tournaments.find((t) => t.id === id(703))
        .guaranteedGames,
      null,
    );
    for (let n = 0; n < 4; n++) {
      const setup = {
        ...leagueSetup,
        gameId: id(720 + n),
        kind: "Tournament",
        bands: n === 0 ? { [id(101)]: false } : {},
        rules: { ...leagueSetup.rules, version: `Synthetic numbered ${n}` },
      };
      const numbered = await client.rpc("da_start_scoring_game", {
        ...startArgs,
        p_day: id(710 + n),
        p_date: `2026-10-${String(n + 2).padStart(2, "0")}`,
        p_tournament: id(700),
        p_tournament_expected: n,
        p_command: id(730 + n),
        p_setup: setup,
      });
      assert.equal(numbered.error, null);
    }
    const beforeScoreboard = (await load()).data.snapshot;
    assert.deepEqual(
      beforeScoreboard.games.map((g) => g.game.tournament_game_number),
      [1, 2, 3, 4],
    );
    const scoreboardArgs = {
      p_team: id(10),
      p_season: id(11),
      p_day: id(713),
      p_game: id(723),
      p_command: id(750),
      p_expected: 1,
      p_tournament_expected: 4,
      p_change: {
        type: "scoreboard",
        gameId: id(723),
        teamRuns: 0,
        opponentRuns: 7,
        inning: 3,
        half: "Top",
        reason: "Synthetic confirmation",
      },
    };
    assert.equal(
      (await client.rpc("da_apply_scoring_game_change", scoreboardArgs)).error,
      null,
    );
    assert.equal(
      (await client.rpc("da_apply_scoring_game_change", scoreboardArgs)).data
        .duplicate,
      true,
    );
    const afterScoreboard = (await load()).data.snapshot;
    assert.equal(afterScoreboard.games[3].game.team_runs, 0);
    assert.deepEqual(afterScoreboard.totals, beforeScoreboard.totals);
    assert.deepEqual(afterScoreboard.board, beforeScoreboard.board);
    assert.equal(
      (
        await client.rpc("da_apply_scoring_game_change", {
          ...scoreboardArgs,
          p_command: id(751),
          p_tournament_expected: 5,
        })
      ).data.status,
      "conflict",
    );
    await db.exec("savepoint invalid_scoreboard;");
    assert.equal(
      (
        await client.rpc("da_apply_scoring_game_change", {
          ...scoreboardArgs,
          p_command: id(752),
          p_expected: 2,
          p_tournament_expected: 5,
          p_change: { ...scoreboardArgs.p_change, teamRuns: -1 },
        })
      ).error?.code,
      "22023",
    );
    await db.exec("rollback to savepoint invalid_scoreboard;rollback;");
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
    const setup = page.locator("section").filter({
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
    assert.equal(await setup.getByLabel(/HR Band for/).count(), 0);
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await saved();
    assert.deepEqual(errors, []);
    assert.equal((await load("Overall")).data.snapshot.games.length, 1);
    await page.getByText("Update score and inning", { exact: true }).click();
    await page.getByLabel("Our team runs", { exact: true }).fill("8");
    await page.getByLabel("Opponent runs", { exact: true }).fill("6");
    await page.getByLabel("Inning", { exact: true }).fill("3");
    await page
      .getByLabel("Inning half", { exact: true })
      .selectOption("Bottom");
    await page
      .getByLabel("Scoreboard update reason", { exact: true })
      .fill("Synthetic scoreboard confirmation");
    await page
      .getByRole("button", { name: "Save scoreboard", exact: true })
      .click();
    await saved();
    assert.equal((await load()).data.snapshot.games[0].game.team_runs, 8);
    assert.equal((await load()).data.snapshot.games[0].game.inning, 3);
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
    await page.getByText("Update score and inning", { exact: true }).click();
    await page.getByLabel("Our team runs", { exact: true }).fill("9");
    await page
      .getByLabel("Scoreboard update reason", { exact: true })
      .fill("Synthetic final-score correction");
    await page
      .getByRole("button", { name: "Save scoreboard", exact: true })
      .click();
    await saved();
    assert.equal((await load()).data.snapshot.games[0].game.team_runs, 9);
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
    await setup
      .getByLabel("Games guaranteed", { exact: true })
      .selectOption("3");
    await page
      .getByRole("button", { name: "Create tournament", exact: true })
      .click();
    await saved();
    assert.equal(
      (await load()).data.snapshot.tournaments[0].guaranteedGames,
      3,
    );
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
    const bandSection = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Tournament games and Band corrections",
        exact: true,
      }),
    });
    await bandSection
      .getByText("Synthetic Cup · 3-game guaranteed", { exact: true })
      .click();
    const nextTournamentGame =
      (await load()).data.snapshot.games.filter((g) => g.game.tournament_id)
        .length + 1;
    await bandSection
      .getByRole("button", {
        name: `Create Game ${nextTournamentGame}`,
        exact: true,
      })
      .click();
    assert.equal(
      await setup.getByLabel("Game kind", { exact: true }).inputValue(),
      "Tournament",
    );
    const correction = bandSection.locator("form").filter({
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
