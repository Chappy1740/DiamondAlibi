import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

test("photo route checks current membership before each download", async (t) => {
  const owner = "00000000-0000-4000-8000-000000000009";
  const roster = "00000000-0000-4000-8000-000000000001";
  let signedIn = true;
  let linked: string | null = owner;
  let shared = true;
  let available = true;
  const downloads: string[] = [];
  const queries: { table: string; filters: [string, unknown][] }[] = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: "viewer" } : null } }) },
    from(table: string) {
      const filters: [string, unknown][] = [];
      return {
        select() { return this; },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return this;
        },
        limit() { return this; },
        async maybeSingle() {
          queries.push({ table, filters });
          return { data: table === "team_players" ? { user_id: linked } : shared ? { team_id: "team" } : null };
        },
      };
    },
    storage: {
      from(bucket: string) {
        assert.equal(bucket, "da-player-profile-photos");
        return {
          async download(path: string, options: unknown, fetchOptions: unknown) {
            assert.deepEqual(JSON.parse(JSON.stringify(fetchOptions)), { cache: "no-store" });
            downloads.push(path);
            return { data: available ? new Blob(["synthetic photo"]) : null };
          },
        };
      },
    },
  };
  const result = await build({
    entryPoints: ["src/app/more/profile/photo/route.ts"],
    bundle: true, write: false, platform: "node", format: "cjs",
    plugins: [{
      name: "synthetic-session",
      setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/supabase\/server$/ }, () => ({ path: "session", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: "export const supabaseServer = async () => globalThis.__profileClient",
        }));
      },
    }],
  });
  const module = { exports: {} as { GET: (request: Request) => Promise<Response> } };
  runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, __profileClient: client, Response, URL,
  });
  const get = (suffix = `?player=${roster}`) => module.exports.GET(new Request(`https://synthetic.invalid/more/profile/photo${suffix}`));

  await t.test("linked teammate receives private bytes", async () => {
    const response = await get();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(downloads.at(-1), `${owner}/avatar.jpg`);
    assert.deepEqual(queries, [
      { table: "team_players", filters: [["id", roster]] },
      { table: "team_memberships", filters: [["user_id", owner], ["active", true]] },
    ]);
  });
  await t.test("removed or inactive membership stops the next download", async () => {
    shared = false;
    const before = downloads.length;
    assert.equal((await get()).status, 404);
    assert.equal(downloads.length, before);
    shared = true;
    assert.equal((await get()).status, 200);
  });
  await t.test("guest and invalid roster references share the missing response", async () => {
    linked = null;
    assert.equal((await get()).status, 404);
    assert.equal((await get("?player=invalid")).status, 404);
    linked = owner;
    available = false;
    assert.equal((await get()).status, 404);
    available = true;
  });
  await t.test("owner entry keeps its existing account path", async () => {
    assert.equal((await get("")).status, 200);
    assert.equal(downloads.at(-1), "viewer/avatar.jpg");
  });
  await t.test("signed-out requests receive no bytes", async () => {
    signedIn = false;
    const before = downloads.length;
    assert.equal((await get()).status, 401);
    assert.equal(downloads.length, before);
  });
});
