// Disposable local PostgreSQL. Never connects to a hosted project.
const { PGlite } = require("@electric-sql/pglite");
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
(async () => {
  const db = new PGlite();
  try {
    const source = fs.readFileSync("tests/optional-lineups-sql.cjs", "utf8");
    const fixture = source.slice(
      source.indexOf("await db.exec(`") + 15,
      source.indexOf("`);\n for(const name"),
    );
    await db.exec(
      fixture.replaceAll(/\$\{id\((\d+)\)\}/g, (_, n) => id(Number(n))),
    );
    await db.exec(
      `alter table public.teams add column name text,add column created_by uuid references auth.users(id);update public.teams set created_by='${id(1)}';alter table public.team_players add column user_id uuid references auth.users(id);update public.team_players set user_id='${id(1)}' where id='${id(101)}';`,
    );
    for (const name of [
      "20261009192021_m43_tournament_season_scoring.sql",
      "20261009210007_tournament_games_guaranteed.sql",
      "20261009203125_tournament_only_bands.sql",
      "20261009224553_game_scoreboard_tournament_numbers.sql",
      "20261009234045_competition_hr_limits.sql",
      "20261013235234_optional_lineups.sql",
      "20261014022554_team_beverage_rules.sql",
      "20261014115637_manager_beverage_rules.sql",
      "20261026175817_strikeout_types_double_play.sql",
      "20261026183312_season_tournament_archive.sql",
    ])
      await db.exec(fs.readFileSync("supabase/migrations/" + name, "utf8"));
    const beforeHash = (
      await db.query(
        "select md5(pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure)) hash",
      )
    ).rows[0].hash;
    console.log("Start-time snapshot baseline:", beforeHash);
    const migration = fs.readFileSync(
      "supabase/migrations/20261027012821_tournament_first_game_time.sql",
      "utf8",
    );
    const original = (
      await db.query(
        "select pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure) definition",
      )
    ).rows[0].definition;
    await db.exec(
      "alter function private.read_scoring_season(uuid,uuid,text) cost 101",
    );
    await assert.rejects(() => db.exec(migration), /definition changed/);
    await db.exec("rollback");
    assert.equal(
      (
        await db.query(
          "select count(*)::integer n from information_schema.columns where table_schema='public' and table_name='scoring_tournaments' and column_name='first_game_time'",
        )
      ).rows[0].n,
      0,
    );
    // Hosted function bodies may retain CRLF. Ignore only carriage returns;
    // any substantive source drift still rejects the migration above.
    await db.exec(original.replace(/\r?\n/g, "\r\n"));
    await db.exec(migration);
    let seq = 3000;
    const uuid = () => id(++seq);
    const rpc = async (name, args) =>
      (
        await db.query(
          `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) result`,
          args,
        )
      ).rows[0].result;
    const read = () =>
      rpc("da_read_scoring_season", [id(10), id(11), "Overall"]);
    const cup = async () =>
      (await read()).tournaments.find((t) => t.id === id(13));
    const save = async (
      time,
      zone = "America/Chicago",
      command = uuid(),
      revision,
    ) =>
      rpc("da_set_tournament_start_time", [
        id(10),
        id(11),
        id(13),
        command,
        revision === undefined ? (await cup()).revision : revision,
        time,
        zone,
      ]);
    await db.exec(
      `select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated;`,
    );
    const board = {
      strikeout: 1,
      solo: 1,
      bandSolo: -1,
      grandSlam: -1,
      overLimit: 1,
      insidePark: -1,
      multiRun: 0,
      strikeoutLooking: 2,
      strikeoutSwinging: 2,
      strikeoutFoul: 1,
      doublePlay: 1,
    };
    // Reuse valid server defaults rather than synthesizing a scoring calculation.
    await rpc("da_change_team_beverage", [
      id(10),
      uuid(),
      0,
      JSON.stringify({ type: "finalize", rules: board }),
    ]);
    await rpc("da_create_scoring_competition", [
      id(10),
      id(11),
      id(13),
      "Tournament",
      "Synthetic Start Time Cup",
      3,
      3,
    ]);
    assert.equal((await cup()).firstGameTime, null);
    assert.equal((await read()).capabilities.tournamentStartTime, true);
    const start = async () => {
      const snapshot = await read(),
        day = snapshot.games[0],
        game = uuid();
      return rpc("da_start_scoring_game", [
        id(10),
        id(11),
        day?.game.day_id ?? uuid(),
        "2026-11-07",
        id(13),
        uuid(),
        day?.dayRevision ?? 0,
        (await cup()).revision,
        JSON.stringify({
          type: "start",
          gameId: game,
          opponent: "Synthetic Opponent",
          kind: "Tournament",
          battingMode: "manual",
          lineup: [],
          rules: { version: "Synthetic", fenceLimit: 3, board },
          bands: {},
        }),
      ]);
    };
    assert.equal((await start()).status, "accepted");
    assert.equal((await start()).status, "accepted");
    const snapshot = await read(),
      games = structuredClone(snapshot.games),
      balances = structuredClone(snapshot.board);
    const command = uuid(),
      revision = (await cup()).revision;
    assert.equal(
      (await save("08:00", "America/Chicago", command, revision)).status,
      "accepted",
    );
    assert.equal(
      (await save("08:00", "America/Chicago", command, revision)).duplicate,
      true,
    );
    assert.equal((await cup()).firstGameTime, "08:00");
    await assert.rejects(
      () => save("09:00", "America/Chicago", command, revision),
      /reused/,
    );
    assert.equal(
      (await save("09:00", "America/Chicago", uuid(), revision)).status,
      "conflict",
    );
    for (const bad of ["8:00", "24:00", "08:60", "08:00:00", ""])
      await assert.rejects(() => save(bad), /Valid start time/);
    await assert.rejects(() => save("08:00", "CST"), /Valid start time/);
    await assert.rejects(
      () => save("08:00", "America/Chicago", uuid(), null),
      /Valid start time/,
    );
    const after = await read();
    assert.deepEqual(after.board, balances);
    assert.deepEqual(
      after.games.map(({ tournamentRevision, ...g }) => g),
      games.map(({ tournamentRevision, ...g }) => g),
      "time edit preserves every game, date, rule, play and day revision",
    );
    assert.equal((await save(null)).status, "accepted");
    assert.equal((await cup()).firstGameTime, null);
    await save("00:00", "UTC");
    assert.equal((await cup()).firstGameTime, "00:00");
    await rpc("da_archive_scoring_tournament", [
      id(10),
      id(11),
      id(13),
      uuid(),
      (await cup()).revision,
      true,
    ]);
    await assert.rejects(() => save("08:00"), /Restore the tournament/);
    await rpc("da_archive_scoring_tournament", [
      id(10),
      id(11),
      id(13),
      uuid(),
      (await cup()).revision,
      false,
    ]);
    await db.exec(
      `reset role;update public.team_seasons set archived=true where id='${id(11)}';set role authenticated`,
    );
    await assert.rejects(() => save("08:00"), /Restore the season/);
    await db.exec(
      `reset role;update public.team_seasons set archived=false where id='${id(11)}';set role authenticated`,
    );
    await assert.rejects(
      () =>
        rpc("da_set_tournament_start_time", [
          id(10),
          id(21),
          id(13),
          uuid(),
          0,
          "08:00",
          "UTC",
        ]),
      /Season context/,
    );
    await assert.rejects(
      () =>
        rpc("da_set_tournament_start_time", [
          id(10),
          id(11),
          id(999),
          uuid(),
          0,
          "08:00",
          "UTC",
        ]),
      /Tournament context/,
    );
    await assert.rejects(
      () =>
        db.exec(
          "update public.scoring_tournaments set first_game_time='09:00'",
        ),
      /permission denied/,
    );
    await db.exec(
      `select set_config('request.jwt.claim.sub','${id(2)}',false)`,
    );
    await assert.rejects(
      () => save("08:00", "UTC", uuid(), 0),
      /access denied/,
    );
    await db.exec(
      `reset role;insert into public.team_memberships values('${id(10)}','${id(2)}',true);set role authenticated`,
    );
    assert.equal(
      (await save("08:00")).status,
      "accepted",
      "ordinary members can manage the start time",
    );
    await assert.rejects(
      () => save("08:00", "America/Chicago", command, revision),
      /reused/,
    );
    await db.exec(
      `reset role;update public.team_memberships set active=false where team_id='${id(10)}' and user_id='${id(2)}';set role authenticated`,
    );
    await assert.rejects(
      () => save("08:00", "UTC", uuid(), 0),
      /access denied/,
    );
    await db.exec(
      `reset role;select set_config('request.jwt.claim.sub','${id(1)}',false);update public.team_memberships set active=false where team_id='${id(10)}';set role authenticated`,
    );
    await assert.rejects(
      () => save("08:00", "UTC", uuid(), 0),
      /access denied/,
    );
    await db.exec("reset role;set role anon");
    await assert.rejects(
      () => save("08:00", "UTC", uuid(), 0),
      /permission denied/,
    );
    await db.exec("reset role");
    assert.equal(
      (
        await db.query(
          "select has_function_privilege('anon','public.da_set_tournament_start_time(uuid,uuid,uuid,uuid,bigint,text,text)','execute') allowed",
        )
      ).rows[0].allowed,
      false,
    );
    console.log(
      "PASS local start-time SQL: persistence, clear/midnight, same-ID retry, conflicts, invalid times/zones, archive, isolation, revoked/anonymous/direct-write denial, unchanged games/rules/BEVs.",
    );
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
