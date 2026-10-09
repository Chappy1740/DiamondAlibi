const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const accounts = JSON.parse(
  fs.readFileSync(".cache/m42-auth.json", "utf8").replace(/^\uFEFF/, ""),
);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
function client() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
async function rpc(c, name, args) {
  const r = await c.rpc(name, args);
  assert.equal(r.error, null, `RPC ${name} failed`);
  return r.data;
}
(async () => {
  const clients = accounts.map(client);
  for (let i = 0; i < clients.length; i++) {
    const r = await clients[i].auth.signInWithPassword({
      email: accounts[i].email,
      password: accounts[i].password,
    });
    assert.equal(r.error, null, "Synthetic sign-in failed");
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const formFor = (label) =>
    page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: label, exact: true }) });
  try {
    await page.goto(base + "/club");
    await page.waitForURL(base + "/login");
    await page
      .getByLabel("Sign-in email", { exact: true })
      .fill(accounts[0].email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(accounts[0].password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(base + "/club");
    await page.getByText("No teams yet.", { exact: false }).waitFor();
    const teamForm = formFor("Create team");
    await teamForm.getByLabel("Team name").fill("M42 Browser Team");
    await teamForm
      .getByLabel("Your roster nickname")
      .fill("Synthetic Browser Player");
    await teamForm
      .getByRole("button", { name: "Create team", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "M42 Browser Team", exact: true })
      .waitFor();
    const teams = await clients[0].from("teams").select("id,name");
    assert.equal(teams.error, null);
    const team = teams.data.find((t) => t.name === "M42 Browser Team");
    assert.ok(team);
    const teamB = await rpc(clients[1], "da_create_team", {
      p_name: "M42 Other Team",
      p_nickname: "Synthetic Other Player",
    });
    const foreignRead = await clients[0]
      .from("teams")
      .select("id")
      .eq("id", teamB);
    assert.deepEqual(foreignRead.data, [], "Foreign team leaked");
    const forbidden = await clients[1].rpc("da_set_captain", {
      p_team: team.id,
      p_captain: true,
    });
    assert.ok(forbidden.error, "Foreign team captain mutation allowed");
    const seasonForm = formFor("Create season");
    await seasonForm.getByLabel("Season name").fill("Synthetic Fall");
    await seasonForm
      .getByRole("button", { name: "Create season", exact: true })
      .click();
    await page
      .getByText("Selected: Synthetic Fall.", { exact: false })
      .waitFor();
    await page
      .getByRole("button", { name: "Tag myself as captain", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove my captain tag", exact: true })
      .waitFor();
    const guestForm = formFor("Add guest player");
    await guestForm.getByLabel("Guest roster nickname").fill("Synthetic Guest");
    await guestForm
      .getByRole("button", { name: "Add guest player", exact: true })
      .click();
    await page.getByText("Synthetic Guest", { exact: false }).first().waitFor();
    const inviteForm = formFor("Create invite code");
    await inviteForm.getByLabel("Maximum joins").fill("2");
    await inviteForm
      .getByRole("button", { name: "Create invite code", exact: true })
      .click();
    const inviteOutput = page.getByLabel("New invite code");
    await inviteOutput.waitFor();
    const code = (await inviteOutput.textContent()).trim();
    assert.match(code, /^[0-9a-f]{36}$/);
    const join = await rpc(clients[1], "da_redeem_invite", {
      p_code: code,
      p_nickname: "Synthetic Joined Player",
    });
    assert.equal(join.ok, true);
    const repeated = await rpc(clients[1], "da_redeem_invite", {
      p_code: code,
      p_nickname: "Synthetic Joined Player",
    });
    assert.equal(repeated.ok, true);
    const metadata = await rpc(clients[0], "da_list_invites", {
      p_team: team.id,
    });
    assert.equal(
      metadata.find((i) => i.max_uses === 2).uses,
      1,
      "Repeat join consumed an additional use",
    );
    const isolatedTeam = await rpc(clients[0], "da_create_team", {
      p_name: "M42 Concurrency Team",
      p_nickname: "Synthetic Host",
    });
    const raceInvite = (
      await rpc(clients[0], "da_create_invite", {
        p_team: isolatedTeam,
        p_max_uses: 1,
      })
    )[0];
    const race = await Promise.all([
      rpc(clients[1], "da_redeem_invite", {
        p_code: raceInvite.code,
        p_nickname: "Synthetic Racer B",
      }),
      rpc(clients[2], "da_redeem_invite", {
        p_code: raceInvite.code,
        p_nickname: "Synthetic Racer C",
      }),
    ]);
    assert.equal(
      race.filter((r) => r.ok).length,
      1,
      "Single-use invite allowed concurrent overuse",
    );
    const raceMetadata = await rpc(clients[0], "da_list_invites", {
      p_team: isolatedTeam,
    });
    assert.equal(raceMetadata[0].uses, 1);
    await page
      .getByRole("button", { name: "Archive season", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Restore season", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Restore season", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Archive season", exact: true })
      .waitFor();
    const seasons = await clients[0]
      .from("team_seasons")
      .select("id,archived")
      .eq("team_id", team.id);
    assert.equal(seasons.data.length, 1);
    assert.equal(seasons.data[0].archived, false);
    for (const width of [320, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Connected overflow at ${width}`,
      );
    }
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => v.id),
    );
    assert.deepEqual(violations, [], "Connected accessibility violations");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL(base + "/login");
    await page.goto(base + "/club");
    await page.waitForURL(base + "/login");
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const loginViolations = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => v.id),
    );
    assert.deepEqual(loginViolations, [], "Login accessibility violations");
    assert.deepEqual(errors, [], "Browser errors");
    console.log(
      "PASS M4.2: real synthetic sign-in/out, protected routes, team/guest/captain/season UI, RLS isolation, invitation idempotency and concurrent single-use protection, retained history, mobile and accessibility checks. No emails sent.",
    );
  } finally {
    for (const c of clients) await c.auth.signOut();
    await context.close();
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
