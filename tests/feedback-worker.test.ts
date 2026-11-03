import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import {
  Miniflare,
  Response as WorkerResponse,
  convertV4MiniflareOptions,
} from "miniflare";

test("custom Worker preserves adapter fetch/exports and awaits scheduled notification failures", async () => {
  const result = await build({
    entryPoints: ["custom-worker.mjs"],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    plugins: [
      {
        name: "synthetic-worker-fixtures",
        setup(plugin) {
          plugin.onResolve({ filter: /\.open-next\/worker\.js$/ }, () => ({
            path: "adapter",
            namespace: "fixture",
          }));
          plugin.onResolve({ filter: /feedback-notifications\.ts$/ }, () => ({
            path: "notifications",
            namespace: "fixture",
          }));
          plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents:
              args.path === "adapter"
                ? `export const DOQueueHandler='queue'; export const DOShardedTagCache='cache'; export const BucketCachePurge='purge'; export default { fetch: async request => new Response(request.url) };`
                : `export async function dispatchFeedbackNotifications(env) { await Promise.resolve(); if(env.fail) throw new Error('synthetic-dispatch-failure'); }`,
          }));
        },
      },
    ],
  });
  const worker = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
  assert.equal(worker.DOQueueHandler, "queue");
  assert.equal(worker.DOShardedTagCache, "cache");
  assert.equal(worker.BucketCachePurge, "purge");
  assert.equal(
    await (
      await worker.default.fetch(
        new Request("https://app.example.invalid/club"),
      )
    ).text(),
    "https://app.example.invalid/club",
  );
  await worker.default.scheduled({}, {});
  await assert.rejects(
    worker.default.scheduled({}, { fail: true }),
    /synthetic-dispatch-failure/,
  );
});

test("Worker runtime sends alerts and rejects redirects without forwarding credentials", async (t) => {
  const bundled = await build({
    stdin: {
      contents: `import { dispatchFeedbackNotifications } from './src/lib/feedback-notifications.ts';
        export default { async fetch(_request, env) {
          return Response.json(await dispatchFeedbackNotifications(env, fetch, async () => {}));
        }};`,
      resolveDir: process.cwd(),
      sourcefile: "synthetic-feedback-worker.ts",
      loader: "ts",
    },
    bundle: true,
    platform: "browser",
    format: "esm",
    external: ["node:*"],
    write: false,
  });
  for (const status of [200, 302]) {
    await t.test(`provider status ${status}`, async () => {
      let claims = 0;
      let sends = 0;
      let receipt:
        { p_provider_id: string | null; p_failure: string | null } | undefined;
      const worker = new Miniflare(
        convertV4MiniflareOptions({
          workers: [
            {
              modules: true,
              script: bundled.outputFiles[0].text,
              compatibilityDate: "2026-10-09",
              compatibilityFlags: [
                "nodejs_compat",
                "global_fetch_strictly_public",
              ],
              bindings: {
                FEEDBACK_NOTIFICATIONS_ENABLED: "true",
                FEEDBACK_NOTIFICATION_TO: "owner@example.invalid",
                FEEDBACK_NOTIFICATION_FROM: "alerts@example.invalid",
                FEEDBACK_NOTIFICATION_INBOX_URL:
                  "https://app.example.invalid/owner/feedback",
                FEEDBACK_RESEND_API_KEY: "synthetic-api-key",
                NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
                FEEDBACK_SUPABASE_SECRET_KEY: "synthetic-service-key",
              },
              // Intercept every outbound request; no hosted database or real mail.
              outboundService: async (request) => {
                const url = new URL(request.url);
                if (url.hostname === "api.resend.com") {
                  sends++;
                  assert.equal(
                    request.headers.get("Authorization"),
                    "Bearer synthetic-api-key",
                  );
                  assert.equal(
                    request.headers.get("Idempotency-Key"),
                    "feedback/synthetic-feedback-id",
                  );
                  return status === 200
                    ? WorkerResponse.json({ id: "synthetic-provider-receipt" })
                    : new WorkerResponse(null, {
                        status: 302,
                        headers: {
                          Location: "https://attacker.invalid/collect",
                        },
                      });
                }
                assert.equal(
                  url.hostname,
                  "synthetic.supabase.co",
                  "unexpected destination must never receive credentials",
                );
                if (url.pathname.endsWith("/claim_feedback_notification")) {
                  return WorkerResponse.json(
                    claims++ === 0
                      ? [
                          {
                            feedback_id: "synthetic-feedback-id",
                            lease_token: "synthetic-lease",
                            recipient: "owner@example.invalid",
                            sender: "alerts@example.invalid",
                            inbox_url:
                              "https://app.example.invalid/owner/feedback",
                          },
                        ]
                      : [],
                  );
                }
                assert.ok(
                  url.pathname.endsWith("/finish_feedback_notification"),
                );
                receipt = (await request.json()) as NonNullable<typeof receipt>;
                return WorkerResponse.json(true);
              },
            },
          ],
        }),
      );
      try {
        const response = await worker.dispatchFetch(
          "https://local.example.invalid/test",
        );
        const outcome = await response.json();
        assert.equal(sends, 1, "actual Worker fetch must reach the provider");
        assert.deepEqual(outcome, {
          state: "processed",
          accepted: status === 200 ? 1 : 0,
          pending: status === 200 ? 0 : 1,
        });
        assert.ok(receipt, "the leased job must receive a durable outcome");
        assert.equal(
          receipt.p_provider_id,
          status === 200 ? "synthetic-provider-receipt" : null,
        );
        assert.equal(
          receipt.p_failure,
          status === 200 ? null : "provider_rejected",
        );
      } finally {
        await worker.dispose();
      }
    });
  }
});
