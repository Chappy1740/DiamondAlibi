const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");

(async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role supabase_auth_admin");
    await db.exec(fs.readFileSync(path.join(__dirname, "../supabase/proposals/phone-signup-pilot-hook.sql"), "utf8"));
    const phone = (value) => ({ user: { phone: value, app_metadata: { provider: "phone" } } });
    const email = { user: { email: "test@example.invalid", app_metadata: { provider: "email" } } };
    const allowed = async (event) => {
      await db.exec("set role supabase_auth_admin");
      try {
        const { rows: [{ result }] } = await db.query("select da_auth_hooks.before_user_created($1) as result", [JSON.stringify(event)]);
        return Object.keys(result).length === 0;
      } finally {
        await db.exec("reset role");
      }
    };
    assert.equal(await allowed(email), true);
    assert.equal(await allowed(phone("13125550100")), false, "empty pilot is fail-closed");
    await db.query("insert into da_auth_hooks.phone_signup_pilot(phone_digits) values ($1)", ["13125550100"]);
    for (const value of ["13125550100", "+13125550100"]) assert.equal(await allowed(phone(value)), true);
    for (const value of ["", "+1 3125550100", "13125550101", null]) assert.equal(await allowed(phone(value)), false);
    assert.equal(await allowed({ user: { ...email.user, phone: "13125550101" } }), false);
    assert.equal(await allowed(email), true);
    const { rows } = await db.query(`
      select r,
        has_schema_privilege(r, 'da_auth_hooks', 'USAGE') as schema_access,
        has_function_privilege(r, 'da_auth_hooks.before_user_created(jsonb)', 'EXECUTE') as hook_access,
        has_table_privilege(r, 'da_auth_hooks.phone_signup_pilot', 'SELECT,INSERT,UPDATE,DELETE') as table_access
      from unnest(array['anon', 'authenticated', 'supabase_auth_admin']) as r
    `);
    assert.deepEqual(rows, [
      { r: "anon", schema_access: false, hook_access: false, table_access: false },
      { r: "authenticated", schema_access: false, hook_access: false, table_access: false },
      { r: "supabase_auth_admin", schema_access: true, hook_access: true, table_access: false },
    ]);
    await db.exec("delete from da_auth_hooks.phone_signup_pilot");
    assert.equal(await allowed(phone("13125550100")), false);
    assert.equal(await allowed(email), true);
    console.log("PASS disposable SQL: pilot default denial, one allowed phone, email passthrough, private grants and revocation.");
  } finally {
    await db.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
