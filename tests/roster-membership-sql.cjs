// Disposable PostgreSQL only. No hosted accounts, invitations or roster changes.
const { PGlite } = require("@electric-sql/pglite");
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 insert into auth.users select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,12) n;
 -- Test doubles for unavailable pgcrypto extension only. Production uses unchanged pgcrypto.
 create function extensions.digest(value text,algorithm text) returns bytea language sql immutable as $$select decode(md5(value),'hex')$$;
 create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$select decode(substr(md5(random()::text)||md5(random()::text),1,n*2),'hex')$$;`);
    await db.exec(
      fs
        .readFileSync(
          "supabase/migrations/20261009053237_m42_membership_seasons.sql",
          "utf8",
        )
        .replace(
          "create extension if not exists pgcrypto with schema extensions;",
          "",
        ),
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
    const migration = fs.readFileSync(
      "supabase/migrations/20261026214921_roster_player_membership.sql",
      "utf8",
    );
    const original = (
      await db.query(
        "select pg_get_functiondef('private.redeem_invite(text,text)'::regprocedure) definition",
      )
    ).rows[0].definition;
    await db.exec("alter function private.redeem_invite(text,text) cost 101");
    await assert.rejects(db.exec(migration), /Invitation definitions changed/);
    await db.exec("rollback");
    assert.equal(
      (
        await db.query(
          "select count(*)::int count from information_schema.columns where table_schema='private' and table_name='team_invites' and column_name='player_id'",
        )
      ).rows[0].count,
      0,
    );
    await db.exec(original);
    await db.exec(migration);
    const actor = async (n) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        n ? id(n) : "",
      ]);
      await db.exec("set role authenticated");
    };
    const rpc = async (name, args) =>
      (
        await db.query(
          "select public." +
            name +
            "(" +
            args.map((_, i) => "$" + (i + 1)).join(",") +
            ") result",
          args,
        )
      ).rows[0].result;
    const create = async (team, player) =>
      (
        await db.query("select * from public.da_create_player_invite($1,$2)", [
          team,
          player,
        ])
      ).rows[0];
    const redeem = (code, nickname = "Unrelated profile nickname") =>
      rpc("da_redeem_invite", [code, nickname]);
    await actor(1);
    const team = await rpc("da_create_team", [
      "Synthetic Roster Team",
      "Synthetic Owner",
    ]);
    const season = await rpc("da_create_season", [team, "Synthetic season"]);
    const player = await rpc("da_add_guest", [team, "Synthetic Alex"]);
    const sameName = await rpc("da_add_guest", [team, "Synthetic Alex"]);
    const board = {
      strikeout: 1,
      solo: 1,
      bandSolo: -1,
      grandSlam: -1,
      overLimit: 1,
      insidePark: -1,
      multiRun: 0,
    };
    await rpc("da_change_team_beverage", [
      team,
      id(800),
      0,
      JSON.stringify({ type: "finalize", rules: board }),
    ]);
    await rpc("da_start_scoring_game", [
      team,
      season,
      id(801),
      "2026-11-07",
      null,
      id(802),
      0,
      null,
      JSON.stringify({
        type: "start",
        gameId: id(803),
        opponent: "Synthetic opponent",
        kind: "League",
        battingMode: "manual",
        lineup: [],
        rules: { version: "Synthetic rules", fenceLimit: 3, board },
        bands: {},
      }),
    ]);
    await rpc("da_apply_scoring_game_change", [
      team,
      season,
      id(801),
      id(803),
      id(804),
      1,
      null,
      JSON.stringify({
        type: "score",
        gameId: id(803),
        playId: id(805),
        playerId: player,
        outcome: "K",
        runs: 0,
        rbi: 0,
      }),
    ]);
    const before = await rpc("da_read_scoring_season", [
      team,
      season,
      "Overall",
    ]);
    assert.equal(before.totals[player].K, 1);
    assert.equal(before.board[player], 1);
    const invite = await create(team, player);
    assert.match(invite.code, /^[a-f0-9]{36}$/);
    const metadata = (
      await db.query("select * from public.da_list_invites($1)", [team])
    ).rows;
    assert.equal(metadata.find((i) => i.id === invite.invite_id).max_uses, 1);
    assert.equal(JSON.stringify(metadata).includes(invite.code), false);
    assert.deepEqual(
      (
        await db.query("select * from public.da_list_player_invites($1)", [
          team,
        ])
      ).rows,
      [{ invite_id: invite.invite_id, player_id: player }],
    );
    await actor(3);
    await assert.rejects(create(team, player), /Team access denied/);
    await assert.rejects(
      db.query("select * from public.da_list_player_invites($1)", [team]),
      /Team access denied/,
    );
    await db.exec("reset role;set role anon");
    await assert.rejects(create(team, player), /permission denied/);
    await assert.rejects(redeem(invite.code), /permission denied/);
    await actor(0);
    await assert.rejects(create(team, player), /Sign in required/);
    await actor(2);
    const linked = await redeem(invite.code);
    assert.equal(linked.ok, true);
    assert.equal(linked.player_id, player);
    const after = await rpc("da_read_scoring_season", [
      team,
      season,
      "Overall",
    ]);
    assert.deepEqual(after.games, before.games);
    assert.deepEqual(after.totals, before.totals);
    assert.deepEqual(after.board, before.board);
    const roster = (
      await db.query(
        "select id,user_id,display_name,is_guest from public.team_players where team_id=$1 order by id",
        [team],
      )
    ).rows;
    assert.equal(
      roster.length,
      3,
      "account linking does not append a duplicate player",
    );
    assert.equal(roster.find((p) => p.id === player).user_id, id(2));
    assert.equal(
      roster.find((p) => p.id === player).display_name,
      "Synthetic Alex",
    );
    assert.equal(
      roster.find((p) => p.id === sameName).user_id,
      null,
      "names never select a player",
    );
    const duplicate = await redeem(invite.code);
    assert.equal(duplicate.duplicate, true);
    await actor(3);
    assert.equal(
      (await redeem(invite.code)).ok,
      false,
      "another account cannot reuse a consumed player invite",
    );
    await actor(1);
    const history = (
      await db.query("select * from public.da_list_invites($1)", [team])
    ).rows.find((i) => i.id === invite.invite_id);
    assert.equal(history.uses, 1);
    const invite2 = await create(team, sameName);
    assert.equal(
      (await redeem(invite2.code)).ok,
      false,
      "existing member cannot claim a second roster entry",
    );
    await assert.rejects(create(team, player), /unlinked roster player/);
    await actor(3);
    const other = await rpc("da_create_team", [
      "Other synthetic team",
      "Other owner",
    ]);
    const otherPlayer = await rpc("da_add_guest", [other, "Other player"]);
    await actor(1);
    await assert.rejects(create(team, otherPlayer), /unlinked roster player/);
    const revokePlayer = await rpc("da_add_guest", [
      team,
      "Revoked invite player",
    ]);
    const revoked = await create(team, revokePlayer);
    await rpc("da_revoke_invite", [team, revoked.invite_id]);
    await actor(4);
    assert.equal((await redeem(revoked.code)).ok, false);
    await actor(1);
    const expPlayer = await rpc("da_add_guest", [
      team,
      "Expired invite player",
    ]);
    const expired = await create(team, expPlayer);
    await db.exec("reset role");
    await db.query(
      "update private.team_invites set expires_at=now()-interval '1 second' where id=$1",
      [expired.invite_id],
    );
    await actor(4);
    assert.equal((await redeem(expired.code)).ok, false);
    await actor(1);
    const issuerPlayer = await rpc("da_add_guest", [
      team,
      "Inactive issuer player",
    ]);
    const issued = await create(team, issuerPlayer);
    await db.exec("reset role");
    await db.query(
      "update public.team_memberships set active=false where team_id=$1 and user_id=$2",
      [team, id(1)],
    );
    await actor(5);
    assert.equal((await redeem(issued.code)).ok, false);
    await db.exec("reset role");
    await db.query(
      "update public.team_memberships set active=true where team_id=$1 and user_id=$2",
      [team, id(1)],
    );
    await actor(1);
    const inactivePlayer = await rpc("da_add_guest", [
      team,
      "Inactive recipient player",
    ]);
    const inactiveInvite = await create(team, inactivePlayer);
    await db.exec("reset role");
    await db.query(
      "insert into public.team_memberships(team_id,user_id,active) values($1,$2,false)",
      [team, id(6)],
    );
    await actor(6);
    assert.equal(
      (await redeem(inactiveInvite.code)).ok,
      false,
      "does not reactivate removed membership",
    );
    await actor(7);
    for (let n = 0; n < 9; n++)
      assert.equal((await redeem("0".repeat(36))).ok, false);
    assert.match((await redeem(issued.code)).error, /Too many attempts/);
    await actor(1);
    const general = (
      await db.query("select * from public.da_create_invite($1,2)", [team])
    ).rows[0];
    await actor(8);
    assert.equal((await redeem(general.code, "Synthetic Alex")).ok, true);
    assert.equal(
      (
        await db.query("select user_id from public.team_players where id=$1", [
          sameName,
        ])
      ).rows[0].user_id,
      null,
      "general invite never claims matching name",
    );
    await assert.rejects(
      db.query(
        "update public.team_players set user_id=$1,is_guest=false where id=$2",
        [id(8), sameName],
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from private.team_invites"),
      /permission denied/,
    );
    await actor(1);
    await db.exec("reset role");
    const audit = (
      await db.query(
        "select count(*)::int count from private.audit_events where operation='roster.account_link' and entity_id=$1",
        [player],
      )
    ).rows[0].count;
    assert.equal(audit, 1, "same-code retry does not duplicate linking audit");
    await db.query(
      "update public.team_memberships set active=false where team_id=$1 and user_id=$2",
      [team, id(2)],
    );
    await actor(2);
    assert.equal((await redeem(invite.code)).ok, false);
    await assert.rejects(
      rpc("da_read_scoring_season", [team, season, "Overall"]),
      /Team access denied/,
    );
    console.log(
      "PASS roster membership SQL: explicit single-player invite, same player ID/name/stats/BEVs, no duplicate or name matching, stable retry, used/expired/revoked/issuer/inactive/anonymous/cross-team denial, throttling, direct-write denial, audit and legacy invite compatibility. Disposable PostgreSQL; pgcrypto functions are test doubles only.",
    );
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
