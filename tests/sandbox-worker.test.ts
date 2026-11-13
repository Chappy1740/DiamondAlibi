import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { build } from "esbuild";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const config = JSON.parse(readFileSync("wrangler.sandbox.jsonc", "utf8"));
const origin = config.vars.DA_SANDBOX_ORIGIN;
const issuer = "https://synthetic-team.cloudflareaccess.com";
const audience = "sandbox-audience";
const project = "abcdefghijklmnopqrst";

test("sandbox Worker has no public routes or cron and only binds to itself", () => {
  assert.equal(config.name, "diamond-alibi-sandbox");
  assert.equal(config.main, "sandbox-worker.mjs");
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal(config.keep_vars, false);
  assert.deepEqual(config.routes, []);
  assert.deepEqual(config.triggers.crons, []);
  assert.deepEqual(config.services, [
    { binding: "WORKER_SELF_REFERENCE", service: config.name },
  ]);
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.vars.FEEDBACK_NOTIFICATIONS_ENABLED, "false");
  assert.equal(config.vars.NEXT_PUBLIC_SUPABASE_URL, undefined);
});

test("sandbox Worker rejects alternate hosts, unsafe bindings and invalid Access tokens", async (t) => {
  const result = await build({
    entryPoints: [config.main],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    plugins: [
      {
        name: "synthetic-opennext",
        setup(plugin) {
          plugin.onResolve({ filter: /\.open-next\/worker\.js$/ }, () => ({
            path: "adapter",
            namespace: "fixture",
          }));
          plugin.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
            contents:
              "export const DOQueueHandler = null, DOShardedTagCache = null, BucketCachePurge = null; export default { fetch: (_, env) => Response.json({ url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }) };",
          }));
        },
      },
    ],
  });
  const worker = (
    await import(
      "data:text/javascript;base64," +
        Buffer.from(result.outputFiles[0].text).toString("base64")
    )
  ).default;
  assert.equal(worker.scheduled, undefined);

  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const keyId = "synthetic-access-key";
  t.mock.method(globalThis, "fetch", async (url: URL) => {
    assert.equal(String(url), issuer + "/cdn-cgi/access/certs");
    return Response.json({ keys: [{ ...jwk, kid: keyId, alg: "RS256" }] });
  });
  const sign = (aud: string, expiry = "5m") =>
    new SignJWT({ email: "tester@example.invalid" })
      .setProtectedHeader({ alg: "RS256", kid: keyId })
      .setSubject("synthetic-tester")
      .setIssuer(issuer)
      .setAudience(aud)
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(privateKey);
  const validToken = await sign(audience);
  const bindings = {
    ...config.vars,
    DA_SANDBOX_SUPABASE_REF: project,
    DA_SANDBOX_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
    DA_SANDBOX_ACCESS_ISSUER: issuer,
    DA_SANDBOX_ACCESS_AUDIENCE: audience,
  };
  const request = (host: string, token?: string) =>
    new Request(host + "/brand/diamond-alibi-icon-32.png", {
      headers: token ? { "Cf-Access-Jwt-Assertion": token } : {},
    });
  assert.equal(
    (
      await worker.fetch(
        request("https://diamondalibi.eydrenworks.com", validToken),
        bindings,
        {},
      )
    ).status,
    404,
  );
  for (const unsafe of [
    { DA_SANDBOX_SUPABASE_REF: undefined },
    { DA_SANDBOX_SUPABASE_REF: "twfyeoywjexxnhnluomv" },
    { DA_SANDBOX_SUPABASE_PUBLISHABLE_KEY: "sb_secret_synthetic" },
    { DA_SANDBOX_ACCESS_AUDIENCE: "" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://unexpected.supabase.co" },
    { FEEDBACK_NOTIFICATIONS_ENABLED: "true" },
    { FEEDBACK_RESEND_API_KEY: "synthetic" },
  ]) {
    assert.equal(
      (
        await worker.fetch(
          request(origin, validToken),
          { ...bindings, ...unsafe },
          {},
        )
      ).status,
      503,
    );
  }
  for (const token of [
    undefined,
    "invalid",
    await sign("production-audience"),
    await sign(audience, "1s ago"),
  ]) {
    const denied = await worker.fetch(request(origin, token), bindings, {});
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get("cache-control"), "no-store");
  }
  const allowed = await worker.fetch(request(origin, validToken), bindings, {});
  assert.deepEqual(await allowed.json(), {
    url: "https://" + project + ".supabase.co",
    key: bindings.DA_SANDBOX_SUPABASE_PUBLISHABLE_KEY,
  });
});
