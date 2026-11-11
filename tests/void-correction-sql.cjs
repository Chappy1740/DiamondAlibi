// Characterizes the audited correction RPC in disposable PostgreSQL.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const team = id(10), season = id(11), alex = id(101), morgan = id(102);
const creator = id(1), otherMember = id(2), member = id(3), outsider = id(4), captain = id(5);
const board = { strikeout: 1, solo: 1, bandSolo: -1, grandSlam: -1, overLimit: 1, insidePark: -1, multiRun: 0 };

function readSource(path) {
  return readFileSync(join(__dirname, "..", path), "utf8").replaceAll("\r\n", "\n");
}

async function setup(db) {
  const source = readSource("tests/optional-lineups-sql.cjs");
  const fixture = source.match(/await db\.exec\(`(create role anon;[\s\S]*?)`\);/);
  assert.ok(fixture, "optional-lineup scoring fixture is available");
  await db.exec(fixture[1].replaceAll(/\$\{id\((\d+)\)\}/g, (_, n) => id(Number(n))));
  // Mirror the account linkage and Beverage rules setup in team-beverage-sql.cjs.
  await db.exec(`
    alter table public.teams add column name text, add column created_by uuid references auth.users(id);
    alter table public.team_memberships add column is_captain boolean not null default false;
    alter table public.team_players add column user_id uuid references auth.users(id);
    insert into auth.users values ('${member}'), ('${outsider}'), ('${captain}');
    update public.teams set created_by='${creator}' where id='${team}';
    update public.team_players set user_id='${creator}' where id='${alex}';
    update public.team_players set user_id='${member}' where id='${morgan}';
    insert into public.team_memberships values ('${team}', '${member}', true, false),
      ('${team}', '${captain}', true, true);
  `);
  const apply = (file) => db.exec(readSource(`supabase/migrations/${file}`));
  for (const file of [
    "20261009192021_m43_tournament_season_scoring.sql",
    "20261009210007_tournament_games_guaranteed.sql",
    "20261009203125_tournament_only_bands.sql",
    "20261009224553_game_scoreboard_tournament_numbers.sql",
    "20261009234045_competition_hr_limits.sql",
  ]) await apply(file);
  const baseline = await db.query(`select proname, md5(pg_get_functiondef(oid)) hash
    from pg_proc where pronamespace='private'::regnamespace
    and proname in ('apply_scoring_game_change','start_scoring_game','read_scoring_season') order by proname`);
  assert.deepEqual(baseline.rows.map(({ hash }) => hash), [
    "d6f883359209cb7b1bb7b73e094ff549", "d84cfeb15f9422dd5555a9e8cd78da0b", "4756d36b59d1c47df7c7ebabba59de8b",
  ], "matches the reviewed optional-lineup baseline");
  // Continue in the order used by hit-types-sql.cjs to reach the current scoring definitions.
  for (const file of [
    "20261013235234_optional_lineups.sql",
    "20261014022554_team_beverage_rules.sql",
    "20261014115637_manager_beverage_rules.sql",
    "20261026175817_strikeout_types_double_play.sql",
    "20261026183312_season_tournament_archive.sql",
    "20261027012821_tournament_first_game_time.sql",
    "20261028004103_slow_pitch_hit_types.sql",
  ]) await apply(file);
}

const statKeys = ["PA", "H", "runs", "RBI"];
const batting = (...totals) => statKeys.map((key) => totals.reduce((sum, player) => sum + (player?.[key] ?? 0), 0));
const last = (game) => game.evaluation.rows.at(-1);
const correction = (row, voided = true, reason = "Synthetic void characterization") => ({
  type: "correct", playId: row.id, outcome: row.outcome, runs: row.runs, rbi: row.rbi, voided, reason,
});

test("audited void characterization", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await setup(db);
  const { evaluateGame } = await import("../src/lib/scoring.ts");
  const { tournamentStats } = await import("../src/lib/tournament-leaderboard.ts");

  let serial = 1000;
  let nextDay = 0;
  const uuid = () => id(++serial);
  const rpc = async (name, args) => (await db.query(
    `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) result`, args,
  )).rows[0].result;
  async function as(user) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.exec("set role authenticated");
  }
  const read = (scope = "Overall") => rpc("da_read_scoring_season", [team, season, scope]);
  const latest = async (gameId) => (await read()).games.find(({ game }) => game.id === gameId);
  const revisions = async (game) => (await db.query(
    "select * from public.scoring_play_revisions where game_id=$1 order by revision", [game.game.id],
  )).rows;
  const change = (g, body, { command = uuid(), day = g.dayRevision, tournament = g.tournamentRevision } = {}) => rpc(
    "da_apply_scoring_game_change", [team, season, g.game.day_id, g.game.id, command, day, tournament,
      JSON.stringify({ ...body, gameId: g.game.id })],
  );
  async function apply(g, body) {
    assert.equal((await change(g, body)).status, "accepted");
    return latest(g.game.id);
  }
  const score = (g, outcome, fields = {}) => apply(g, {
    type: "score", playId: uuid(), playerId: alex, outcome, runs: 0, rbi: 0, ...fields,
  });
  async function createCup(fenceLimit) {
    const cup = uuid();
    await rpc("da_create_scoring_competition", [team, season, cup, "Tournament", `Synthetic cup ${serial}`, fenceLimit, 2]);
    return cup;
  }
  async function start({ cup = null, fenceLimit = 2, lineup = [] } = {}) {
    const gameId = uuid();
    const date = `2026-11-${String(++nextDay).padStart(2, "0")}`;
    const tournament = (await read()).tournaments.find(({ id }) => id === cup);
    const bands = Object.fromEntries(lineup.map((player) => [player, false]));
    const result = await rpc("da_start_scoring_game", [team, season, uuid(), date, cup, uuid(), 0, tournament?.revision ?? null,
      JSON.stringify({ type: "start", gameId, opponent: "Synthetic opponent", kind: cup ? "Tournament" : "League",
        battingMode: lineup.length ? "ordered" : "manual", lineup, rules: { version: `Synthetic ${gameId}`, fenceLimit, board }, bands }),
    ]);
    assert.equal(result.status, "accepted");
    return latest(gameId);
  }
  const participation = async (participating) => {
    const { revision } = await rpc("da_read_team_beverage", [team]);
    const result = await rpc("da_change_team_beverage", [team, uuid(), revision, JSON.stringify({ type: "participation", participating })]);
    assert.equal(result.status, "accepted");
  };
  function assertPureReplay(g, bands = []) {
    const { totals, rows, fenceUsed } = g.evaluation;
    const stripParticipation = ({ id, playerId, outcome, runs, rbi, voided, official, delta }) =>
      ({ id, playerId, outcome, runs, rbi, voided, official, delta });
    const pure = evaluateGame({
      id: g.game.id, opponent: g.game.opponent, kind: g.game.kind, lineup: g.lineup,
      next: g.game.next_batter_position, complete: g.game.completed,
      rules: { version: g.rules.version_label, fenceLimit: g.rules.fence_limit, board },
      plays: rows.map(({ id, playerId, outcome, runs, rbi, voided }) => ({ id, playerId, outcome, runs, rbi, voided })),
    }, bands);
    assert.equal(pure.fenceUsed, fenceUsed);
    assert.deepEqual(pure.rows, rows.map(stripParticipation));
    assert.deepEqual({ ...pure.totals }, totals);
  }

  await as(creator);
  assert.equal((await rpc("da_change_team_beverage", [team, uuid(), 0, JSON.stringify({ type: "finalize", rules: board })])).status, "accepted");
  assert.equal((await read()).capabilities.hitTypes, true);

  await t.test("1. ordered and manual batting positions survive void and unvoid", async () => {
    for (const [lineup, expected] of [[[alex, morgan], 1], [[], 0]]) {
      let g = await start({ lineup });
      assert.equal(g.game.next_batter_position, 0);
      g = await score(g, "1B");
      const row = last(g);
      assert.equal(g.game.next_batter_position, expected);
      g = await apply(g, correction(row));
      assert.equal(g.game.next_batter_position, expected);
      g = await apply(g, correction(row, false));
      assert.equal(g.game.next_batter_position, expected);
    }
  });

  await t.test("2. player and team PA, hits, runs and RBI replay and round-trip", async () => {
    let g = await score(await start(), "1B", { playerId: morgan, runs: 1, rbi: 1 });
    g = await score(g, "1B", { runs: 2, rbi: 2 });
    const before = g.evaluation, row = last(g);
    assertPureReplay(g);
    assert.deepEqual(batting(before.totals[alex]), [1, 1, 2, 2]);
    assert.deepEqual(batting(...Object.values(before.totals)), [2, 2, 3, 3]);
    g = await apply(g, correction(row));
    assertPureReplay(g);
    assert.deepEqual(batting(g.evaluation.totals[alex]), [0, 0, 0, 0]);
    assert.deepEqual(batting(...Object.values(g.evaluation.totals)), [1, 1, 1, 1]);
    g = await apply(g, correction(row, false));
    assertPureReplay(g);
    assert.deepEqual(g.evaluation, before);
  });

  await t.test("3. voiding the legal fence HR promotes the later OLHR and preserves ITP HR", async () => {
    const cup = await createCup(1);
    let g = await start({ cup, fenceLimit: 1 });
    g = await score(g, "Fence HR", { runs: 1, rbi: 1, firstGameBand: false });
    g = await score(g, "ITP HR", { runs: 1, rbi: 1 });
    g = await score(g, "Fence HR", { playerId: morgan, runs: 1, rbi: 1, firstGameBand: true });
    const before = g.evaluation, [first, , later] = before.rows;
    const results = () => g.evaluation.rows.map(({ official, delta }) => [official, delta]);
    assertPureReplay(g, [morgan]);
    assert.deepEqual(results(), [["Fence HR", 1], ["ITP HR", -1], ["OLHR", 1]]);
    assert.equal(before.fenceUsed, 1);
    g = await apply(g, correction(first));
    assertPureReplay(g, [morgan]);
    assert.deepEqual(results(), [["Voided", 0], ["ITP HR", -1], ["Fence HR", -1]]);
    assert.equal(g.evaluation.fenceUsed, 1);
    assert.equal(g.evaluation.totals[morgan].HR, 1);
    g = await apply(g, correction(later));
    assertPureReplay(g, [morgan]);
    assert.deepEqual(results(), [["Voided", 0], ["ITP HR", -1], ["Voided", 0]]);
    assert.equal(g.evaluation.fenceUsed, 0);
    assert.equal(g.evaluation.totals[alex].HR, 1);
    g = await apply(g, correction(later, false));
    g = await apply(g, correction(first, false));
    assert.deepEqual(g.evaluation, before);
  });

  await t.test("4a. zero-RBI ROE and two-RBI single keep their RBI on unvoid", async () => {
    let g = await score(await start(), "ROE", { runs: 1 });
    const roe = last(g);
    g = await score(g, "1B", { runs: 2, rbi: 2 });
    const single = last(g);
    assert.equal(g.evaluation.totals[alex].RBI, 2);
    for (const [row, remaining] of [[roe, 2], [single, 0]]) {
      g = await apply(g, correction(row));
      assert.equal(g.evaluation.totals[alex].RBI, remaining);
      g = await apply(g, correction(row, false));
      assert.equal(g.evaluation.totals[alex].RBI, 2);
    }
  });

  await t.test("4b. an audited correction must never credit RBI on ROE", async () => {
    let g = await score(await start(), "ROE", { runs: 1 });
    const row = last(g);
    const credited = () => g.evaluation.totals[alex]?.RBI ?? 0;
    const before = credited();
    // The history form sends numeric RBI with its correction. Check the authoritative result.
    await change(g, { ...correction(row, false), rbi: 1 }).catch((error) => {
      if (error.code !== "22023") throw error;
    });
    g = await latest(g.game.id);
    const corrected = credited();
    const revised = last(g);
    g = await apply(g, correction(revised));
    const voided = credited();
    g = await apply(g, correction(revised, false));
    assert.deepEqual([before, corrected, voided, credited()], [0, 0, 0, 0],
      "ROE RBI before correction, after correction, after void and after unvoid");
  });

  await t.test("5. voids remove K, HR and Band deltas and exclude opted-out plays from totals", async () => {
    const cup = await createCup(2);
    let g = await start({ cup });
    g = await score(g, "K", { firstGameBand: false });
    g = await score(g, "Fence HR", { runs: 1, rbi: 1 });
    g = await score(g, "Fence HR", { playerId: morgan, runs: 1, rbi: 1, firstGameBand: true });
    await participation(false);
    g = await score(g, "K");
    await participation(true);
    const before = g.evaluation;
    assert.deepEqual(before.rows.map(({ delta }) => delta), [1, 1, -1, 0]);
    assert.equal(last(g).beverageParticipating, false);
    const cupTotals = (snapshot) => tournamentStats({ snapshot, roster: [] }, team, season, cup).totals;
    const seasonBefore = await read(), scopeBefore = await read("Tournament");
    assert.equal(cupTotals(seasonBefore).board, 1);
    assert.equal(cupTotals(seasonBefore).PA, 4);
    for (const row of before.rows) g = await apply(g, correction(row));
    assert.deepEqual(g.evaluation.rows.map(({ official, delta }) => [official, delta]), Array(4).fill(["Voided", 0]));
    assert.deepEqual(g.evaluation.totals, {});
    const seasonVoided = await read(), scopeVoided = await read("Tournament");
    assert.equal(cupTotals(seasonVoided).board, 0);
    assert.equal(cupTotals(seasonVoided).PA, 0);
    for (const [original, voided] of [[seasonBefore, seasonVoided], [scopeBefore, scopeVoided]]) {
      assert.equal(original.totals[alex].board - (voided.totals[alex]?.board ?? 0), 2);
      assert.equal(original.totals[morgan].board - (voided.totals[morgan]?.board ?? 0), -1);
      assert.equal(original.totals[alex].PA - (voided.totals[alex]?.PA ?? 0), 3);
      assert.equal(original.totals[morgan].PA - (voided.totals[morgan]?.PA ?? 0), 1);
    }
    for (const row of before.rows) g = await apply(g, correction(row, false));
    assert.deepEqual(g.evaluation, before);
    const restored = await read();
    assert.deepEqual(restored.totals, seasonBefore.totals);
    assert.deepEqual(restored.board, seasonBefore.board);
    assert.deepEqual((await read("Tournament")).totals, scopeBefore.totals);
    assert.deepEqual(cupTotals(restored), cupTotals(seasonBefore));
  });

  await t.test("6. active noncaptain and captain can correct completed games; others are denied", async () => {
    let g = await score(await start(), "1B");
    const row = last(g);
    g = await apply(g, { type: "complete" });
    try {
      await as(member);
      g = await apply(g, correction(row));
      assert.equal(g.game.completed, true);
      assert.equal(last(g).voided, true);
      await as(captain);
      g = await apply(g, correction(row, false));
      assert.equal(last(g).voided, false);
      const before = await revisions(g);
      await db.exec("reset role");
      await db.query("update public.team_memberships set active=false where team_id=$1 and user_id=$2", [team, member]);
      for (const denied of [otherMember, outsider, member]) {
        await as(denied);
        await assert.rejects(() => change(g, correction(row)), { code: "42501", message: /Team access denied/ });
      }
      await db.exec("reset role");
      await db.query("update public.team_memberships set is_captain=true where team_id=$1 and user_id=$2", [id(20), otherMember]);
      await as(otherMember);
      await assert.rejects(() => change(g, correction(row)), { code: "42501", message: /Team access denied/ });
      await as(creator);
      assert.deepEqual(await revisions(g), before);
    } finally {
      await as(creator);
    }
  });

  await t.test("7. stale day and tournament revisions conflict without writing history", async () => {
    const cup = await createCup(2);
    const g = await score(await start({ cup }), "K", { firstGameBand: false });
    const before = await revisions(g), body = correction(last(g));
    const conflict = { status: "conflict", revision: g.dayRevision, tournamentRevision: g.tournamentRevision };
    assert.deepEqual(await change(g, body, { day: g.dayRevision - 1 }), conflict);
    assert.deepEqual(await revisions(g), before);
    assert.deepEqual(await change(g, body, { tournament: g.tournamentRevision - 1 }), conflict);
    assert.deepEqual(await revisions(g), before);
  });

  await t.test("8. retries, changed payload, fresh repeat void and rapid submissions", async () => {
    const g = await score(await start(), "K");
    const body = correction(last(g)), command = uuid(), before = await revisions(g);
    const first = await change(g, body, { command });
    assert.equal(first.status, "accepted");
    assert.equal(first.duplicate, false);
    const retry = await change(g, body, { command });
    assert.equal(retry.status, "accepted");
    assert.equal(retry.duplicate, true);
    assert.equal(retry.revision, first.revision);
    await assert.rejects(() => change(g, { ...body, reason: "Different reason" }, { command }), { code: "22023", message: /Command ID reused/ });
    assert.equal((await revisions(g)).length, before.length + 1);
    const alreadyVoided = await latest(g.game.id);
    const repeat = await change(alreadyVoided, body);
    assert.equal(repeat.status, "accepted");
    assert.equal(repeat.duplicate, false);
    assert.equal((await revisions(g)).length, before.length + 2);
    assert.deepEqual((await latest(g.game.id)).evaluation, alreadyVoided.evaluation);

    // PGlite queues one connection. Both requests use the same revision snapshot.
    const restored = await apply(await latest(g.game.id), correction(last(g), false));
    const rapidBefore = await revisions(g);
    const rapid = await Promise.all([change(restored, body), change(restored, body)]);
    assert.deepEqual(rapid.map(({ status }) => status).sort(), ["accepted", "conflict"]);
    assert.equal((await revisions(g)).length, rapidBefore.length + 1);
  });

  await t.test("9. a void appends one immutable revision and its reason is visible in the audit RPC", async () => {
    const g = await score(await start(), "1B", { runs: 2, rbi: 2 });
    const earlier = await revisions(g), row = last(g), command = uuid();
    const reason = "Synthetic wrong plate appearance";
    const result = await change(g, correction(row, true, reason), { command });
    assert.equal(result.status, "accepted");
    const after = await revisions(g);
    assert.equal(after.length, earlier.length + 1);
    assert.deepEqual(after.slice(0, -1), earlier);
    const added = after.at(-1);
    assert.deepEqual([added.play_id, added.command_id, added.voided, added.reason], [row.id, command, true, reason]);
    const { events } = await rpc("da_read_scoring_audit", [team, season, 100, null, null]);
    const matches = events.filter(({ commandId }) => commandId === command);
    assert.equal(matches.length, 1);
    const [event] = matches;
    assert.deepEqual([event.action, event.actorId, event.reason], ["correct", creator, reason]);
    assert.equal(event.before.play.play_id, row.id);
    assert.equal(event.before.play.voided, false);
    assert.equal(event.after.playId, row.id);
    assert.equal(event.after.voided, true);
    await assert.rejects(() => db.query("update public.scoring_play_revisions set reason='changed' where command_id=$1", [command]), { code: "42501" });
    await assert.rejects(() => db.query("delete from public.scoring_play_revisions where command_id=$1", [command]), { code: "42501" });
    assert.deepEqual(await revisions(g), after);
  });

  await t.test("10. invalid reasons, void flags and play targets are rejected atomically", async () => {
    const g = await score(await start(), "K");
    const foreign = await score(await start(), "K");
    const body = correction(last(g)), before = await revisions(g), foreignBefore = await revisions(foreign);
    for (const fields of [{ reason: "" }, { reason: "a".repeat(201) }, { voided: "true" }]) {
      await assert.rejects(() => change(g, { ...body, ...fields }), { code: "22023", message: /Explicit void status and correction reason required/ });
    }
    for (const playId of [uuid(), last(foreign).id]) {
      await assert.rejects(() => change(g, { ...body, playId }), { code: "22023", message: /Play context unavailable/ });
    }
    assert.deepEqual(await revisions(g), before);
    assert.deepEqual(await revisions(foreign), foreignBefore);
    assert.equal((await latest(g.game.id)).dayRevision, g.dayRevision);
  });
});
