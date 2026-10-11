const { PGlite } = require("@electric-sql/pglite");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(
      fs.readFileSync("supabase/migrations/20261011224726_review_feedback.sql", "utf8"),
    );
    const sender = "a".repeat(64);
    await db.exec("set role service_role");
    const submit = (id, who = sender) =>
      db.query(
        "select public.submit_review_feedback($1,$2,'issue','Synthetic issue','') as result",
        [id, who],
      );
    const first = crypto.randomUUID();
    assert.equal((await submit(first)).rows[0].result, "sent");
    assert.equal((await submit(first)).rows[0].result, "sent");
    await assert.rejects(submit(first, "b".repeat(64)));
    for (let i = 1; i < 10; i++) await submit(crypto.randomUUID());
    assert.equal(
      (await submit(crypto.randomUUID())).rows[0].result,
      "rate_limited",
    );
    assert.equal(
      (await db.query("select count(*)::int as n from public.review_feedback"))
        .rows[0].n,
      10,
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(db.query("select * from public.review_feedback"));
      await assert.rejects(submit(crypto.randomUUID()));
      await assert.rejects(
        db.query("update public.review_feedback set reviewed = true"),
      );
    }
    console.log(
      "Feedback SQL: idempotent retries, cross-sender denial, rate cap, and direct-role privacy pass.",
    );
  } finally {
    await db.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
