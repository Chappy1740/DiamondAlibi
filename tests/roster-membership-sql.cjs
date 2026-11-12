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
    await db.exec(`
      create schema storage;
      create table storage.buckets(
        id text primary key, name text, public boolean, file_size_limit int, allowed_mime_types text[]
      );
      create table storage.objects(
        bucket_id text references storage.buckets(id), name text, version text, primary key(bucket_id,name)
      );
      -- Emulate the Storage API operation context in disposable PostgreSQL.
      create function storage.allow_any_operation(text[]) returns boolean
        language sql stable as $$select current_setting('storage.operation', true) = any($1)$$;
      create function storage.allow_only_operation(text) returns boolean
        language sql stable as $$select storage.allow_any_operation(array[$1])$$;
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated, anon;
      grant select, insert, update, delete on storage.objects to authenticated, anon;
      insert into public.player_profiles(user_id, nickname) values ('${id(10)}', 'Legacy name');
    `);
    await db.exec(fs.readFileSync("supabase/migrations/20261106164718_player_signup_profile.sql", "utf8"));
    await db.exec(fs.readFileSync("supabase/migrations/20261111011626_team_profile_photo_access.sql", "utf8"));
    await db.exec(fs.readFileSync("supabase/migrations/20261112191200_profile_photo_download_metadata.sql", "utf8"));
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
    await actor(9);
    assert.equal(await rpc("da_save_player_details", ["Account Name", "Class E", "Left Center", true]), true);
    assert.equal(await rpc("da_save_player_details", ["Replay", null, null, true]), false);
    const anotherTeam = await rpc("da_create_team", ["Profile test team", "Local Alias"]);
    assert.equal((await redeem(general.code, "Tournament Alias")).ok, true);
    assert.deepEqual((await db.query("select nickname,play_level,fielding_position from public.player_profiles")).rows,
      [{ nickname: "Account Name", play_level: "Class E", fielding_position: "Left Center" }]);
    assert.equal((await db.query("select display_name from public.team_players where team_id=$1", [anotherTeam])).rows[0].display_name,
      "Local Alias");
    await rpc("da_save_profile", ["Edited Name"]);
    assert.equal((await db.query("select play_level from public.player_profiles")).rows[0].play_level, "Class E");
    await assert.rejects(rpc("da_save_player_details", ["Edited Name", null, "Manager", false]), /check constraint/);
    assert.equal(await rpc("da_save_player_details", ["Edited Name", null, "No Preference", false]), true);
    const photo = `${id(9)}/avatar.jpg`;
    const operation = (name) => db.query("select set_config('storage.operation',$1,false)", [name]);
    const visible = () => db.query("select version from storage.objects where name=$1", [photo]);
    const remove = () => db.query("delete from storage.objects where name=$1 returning name", [photo]);
    const putPhoto = (name, version) => db.query(
      "insert into storage.objects values ('da-player-profile-photos',$1,$2) on conflict (bucket_id,name) do update set version=excluded.version",
      [name, version],
    );
    await operation("object.upload");
    await putPhoto(photo, "first");
    await putPhoto(photo, "second");
    await assert.rejects(putPhoto(`${id(10)}/avatar.jpg`, "foreign"), /row-level security/);
    await assert.rejects(putPhoto(`${id(9)}/nested/avatar.jpg`, "nested"), /row-level security/);

    await db.exec("reset role");
    const otherTeam = (await db.query(
      "insert into public.teams(name,created_by) values ('Unrelated synthetic team',$1) returning id", [id(10)],
    )).rows[0].id;
    await db.query("insert into public.team_memberships(team_id,user_id) values ($1,$2),($3,$4)",
      [otherTeam, id(10), anotherTeam, id(11)]);

    await actor(10);
    assert.deepEqual((await db.query("select nickname,play_level,fielding_position from public.player_profiles")).rows,
      [{ nickname: "Legacy name", play_level: null, fielding_position: null }]);
    await operation("object.get_authenticated");
    assert.deepEqual((await visible()).rows, [], "unrelated team has no access");
    await operation("object.get_authenticated_info");
    assert.deepEqual((await visible()).rows, [], "unrelated team cannot read object info");

    for (const member of [1, 11]) {
      await actor(member);
      await operation("object.get_authenticated");
      assert.deepEqual((await visible()).rows, [{ version: "second" }], "both teams can read");
      await operation("object.get_authenticated_info");
      assert.deepEqual((await visible()).rows, [{ version: "second" }], "both teams pass the gateway's object info check");
      for (const denied of ["object.sign", "object.sign_many", "object.list", "object.head_authenticated_info", ""]) {
        await operation(denied);
        assert.deepEqual((await visible()).rows, [], `teammate cannot read through ${denied || "an unset operation"}`);
      }
    }
    await operation("object.delete_many");
    assert.equal((await remove()).rows.length, 0);
    await operation("object.upload");
    await assert.rejects(putPhoto(photo, "foreign"), /row-level security/);
    await operation("object.upload_update");
    assert.equal((await db.query("update storage.objects set version='foreign' where name=$1 returning name", [photo])).rows.length, 0);

    await db.exec("reset role");
    await db.query("update public.team_memberships set active=false where team_id=$1 and user_id=$2",
      [anotherTeam, id(11)]);
    await actor(11);
    await operation("object.get_authenticated");
    assert.deepEqual((await visible()).rows, [], "inactive member loses the next read");
    await actor(1);
    assert.deepEqual((await visible()).rows, [{ version: "second" }], "other active team still has access");
    await db.exec("reset role");
    await db.query("insert into public.team_memberships(team_id,user_id) values ($1,$2)", [anotherTeam, id(1)]);
    await db.query("update public.team_memberships set active=false where team_id=$1 and user_id=$2", [team, id(1)]);
    await actor(1);
    assert.deepEqual((await visible()).rows, [{ version: "second" }], "a second active shared team keeps access");
    await db.exec("reset role");
    await db.query("delete from public.team_memberships where team_id=$1 and user_id=$2", [anotherTeam, id(1)]);
    await actor(1);
    assert.deepEqual((await visible()).rows, [], "removing the last active shared team revokes access");
    await operation("object.get_authenticated_info");
    assert.deepEqual((await visible()).rows, [], "revocation also blocks object info");
    await db.exec("reset role");
    await db.query("update public.team_memberships set active=true where team_id=$1 and user_id=$2", [team, id(1)]);
    await db.query("update public.team_memberships set active=false where team_id=$1 and user_id=$2",
      [team, id(9)]);
    await actor(1);
    assert.deepEqual((await visible()).rows, [], "inactive target membership does not grant access");

    await db.exec("reset role; set role anon");
    assert.deepEqual((await visible()).rows, []);
    await operation("object.upload");
    await assert.rejects(putPhoto(photo, "anonymous"), /row-level security/);
    await operation("object.delete_many");
    assert.equal((await remove()).rows.length, 0);
    await assert.rejects(rpc("da_save_player_details", ["Anonymous", null, null, false]), /permission denied/);
    await db.exec("reset role");
    await db.query("update public.team_memberships set active=true where team_id=$1 and user_id=$2", [team, id(9)]);
    await db.exec(fs.readFileSync("supabase/migrations/20261112192946_disable_direct_teammate_photo_reads.sql", "utf8"));
    await actor(1);
    await operation("object.get_authenticated");
    assert.deepEqual((await visible()).rows, [], "an active teammate cannot read directly after rollback");
    await operation("object.get_authenticated_info");
    assert.deepEqual((await visible()).rows, [], "an active teammate cannot read object info after rollback");
    await actor(9);
    assert.deepEqual((await visible()).rows, [{ version: "second" }]);
    await operation("object.get_authenticated_info");
    assert.deepEqual((await visible()).rows, [{ version: "second" }], "owner passes the gateway's object info check");
    await operation("object.sign_many");
    assert.deepEqual((await visible()).rows, [], "owner cannot sign a read URL");
    await operation("object.delete_many");
    assert.equal((await remove()).rows.length, 1);
    console.log("PASS private profile SQL: signup, independent aliases, owner photo writes, active teammate reads on both teams, revocation, anonymous and cross-account denial. Storage operation context is simulated.");
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
