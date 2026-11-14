import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

test("all source migrations replay in order on an empty database", async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    // Stand-ins for the Supabase-managed Auth and Storage schemas.
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema extensions;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth to authenticated;

      create schema storage;
      create table storage.buckets(
        id text primary key, name text, public boolean,
        file_size_limit int, allowed_mime_types text[]
      );
      create table storage.objects(
        bucket_id text references storage.buckets(id),
        name text, version text, primary key(bucket_id, name)
      );
      create function storage.allow_any_operation(text[]) returns boolean
        language sql stable as $$
          select current_setting('storage.operation', true) = any($1)
        $$;
      create function storage.allow_only_operation(text) returns boolean
        language sql stable as $$select storage.allow_any_operation(array[$1])$$;
      alter table storage.objects enable row level security;
    `);
    const dir = "supabase/migrations";
    for (const name of readdirSync(dir)
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      try {
        await db.exec(readFileSync(`${dir}/${name}`, "utf8"));
      } catch (error) {
        throw new Error(`Fresh database migration failed at ${name}`, {
          cause: error,
        });
      }
    }
    const bucket = await db.query(`
      select public from storage.buckets where id = 'da-player-profile-photos'
    `);
    assert.deepEqual(bucket.rows, [{ public: false }]);
    const policies = await db.query<{ policyname: string }>(`
      select policyname from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
    `);
    assert.ok(
      policies.rows.some(
        ({ policyname }) => policyname === "da_profile_photo_owner_select",
      ),
    );
    assert.ok(
      !policies.rows.some(
        ({ policyname }) => policyname === "da_profile_photo_teammate_select",
      ),
    );
  } finally {
    await db.close();
  }
});
