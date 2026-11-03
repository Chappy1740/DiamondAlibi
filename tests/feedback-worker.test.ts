import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

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
