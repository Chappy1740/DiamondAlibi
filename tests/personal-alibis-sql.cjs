// Disposable PostgreSQL only. Never connects to the hosted project.
const { PGlite } = require("@electric-sql/pglite");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;
      insert into auth.users values ('${id(1)}'),('${id(2)}');`);
    await db.exec(fs.readFileSync("supabase/proposals/personal_alibis.sql", "utf8"));
    const actor = async (user) => { await db.exec("reset role; set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]); };
    const save = async (entry, command, revision, body = "Synthetic alibi") => (await db.query("select public.da_save_personal_alibi($1,$2,$3,'Synthetic title',$4,'Bad Plays') as r",[entry,command,revision,body])).rows[0].r;
    const remove = async (entry,revision) => (await db.query("select public.da_delete_personal_alibi($1,$2) as r",[entry,revision])).rows[0].r;
    await actor(id(1));
    let result = await save(id(10),id(20),0);
    assert.equal(result.status,"saved"); assert.equal(result.item.revision,1);
    assert.equal((await save(id(10),id(20),0)).item.revision,1);
    await assert.rejects(save(id(10),id(20),0,"Changed command payload"));
    assert.equal((await save(id(10),id(21),0)).status,"conflict");
    assert.equal((await save(id(10),id(21),1,"Edited synthetic alibi")).item.revision,2);
    assert.equal((await remove(id(10),1)).status,"conflict");
    await assert.rejects(db.query("insert into public.personal_alibis(id,user_id,body,category,last_command_id) values($1,$2,'Forged','Bad Plays',$3)",[id(11),id(2),id(22)]));
    await assert.rejects(db.query("update public.personal_alibis set user_id=$1 where id=$2",[id(2),id(10)]));
    await assert.rejects(save(id(11),id(22),0," "));
    await assert.rejects(save(id(11),id(22),0,"x".repeat(4001)));
    await actor(id(2));
    assert.equal((await db.query("select * from public.personal_alibis")).rows.length,0);
    assert.equal((await save(id(10),id(23),0)).status,"conflict");
    assert.equal((await remove(id(10),2)).status,"deleted"); // No owner disclosure or deletion.
    assert.equal((await db.query("update public.personal_alibis set body='Forged' where id=$1 returning id",[id(10)])).rows.length,0);
    assert.equal((await db.query("delete from public.personal_alibis where id=$1 returning id",[id(10)])).rows.length,0);
    await save(id(12),id(24),0,"Other synthetic owner");
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`reset role; set role ${role}`);
      await db.query("select set_config('request.jwt.claim.sub','',false)");
      if (role === "anon") await assert.rejects(db.query("select * from public.personal_alibis"));
      else assert.equal((await db.query("select * from public.personal_alibis")).rows.length,0);
      await assert.rejects(save(id(13),id(25),0));
      await assert.rejects(remove(id(10),2));
    }
    await actor(id(1));
    assert.equal((await db.query("select body from public.personal_alibis where id=$1",[id(10)])).rows[0].body,"Edited synthetic alibi");
    assert.equal((await remove(id(10),2)).status,"deleted");
    assert.equal((await remove(id(10),2)).status,"deleted");
    await db.exec(`reset role; delete from auth.users where id='${id(2)}'`);
    assert.equal((await db.query("select count(*)::int as n from public.personal_alibis")).rows[0].n,0);
    console.log("PASS disposable alibi SQL: owner isolation, anonymous denial, forged ownership, immutable owner, retry safety, stale revisions, constraints, deletes and account cascade.");
  } finally { await db.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
