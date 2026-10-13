const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "diamond-reset-"));
  const calls = [];
  let origin = "https://diamond-alibi-preview.lanternmere-wow.workers.dev";
  let authorized = true;
  let failed = false;
  global.__resetMocks = {
    headers: async () => new Headers({ origin }),
    supabaseServer: async () => ({
      auth: {
        resetPasswordForEmail: async (...args) => {
          calls.push(args);
          return { error: failed ? {} : null };
        },
        getUser: async () => ({
          data: { user: authorized ? { id: "synthetic" } : null },
          error: null,
        }),
        updateUser: async (args) => {
          calls.push(args);
          return { error: failed ? {} : null };
        },
      },
    }),
  };
  try {
    const plugins = [
      {
        name: "synthetic-auth",
        setup(build) {
          build.onResolve(
            { filter: /^(next\/headers|@\/lib\/supabase\/server)$/ },
            (args) => ({ path: args.path, namespace: "mock" }),
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents:
              args.path === "next/headers"
                ? "export const headers = global.__resetMocks.headers;"
                : "export const supabaseServer = global.__resetMocks.supabaseServer;",
          }));
        },
      },
    ];
    const load = async (entry, name) => {
      const outfile = path.join(dir, name + ".mjs");
      await esbuild.build({
        entryPoints: [entry],
        outfile,
        bundle: true,
        platform: "node",
        format: "esm",
        plugins,
      });
      return import(pathToFileURL(outfile).href);
    };
    const { requestPasswordReset } = await load(
      "src/app/forgot-password/actions.ts",
      "request",
    );
    const { updatePassword } = await load(
      "src/app/reset-password/actions.ts",
      "update",
    );
    const form = (values) => {
      const f = new FormData();
      Object.entries(values).forEach(([k, v]) => f.set(k, v));
      return f;
    };
    assert.ok(
      (await requestPasswordReset({}, form({ email: "invalid" }))).error,
    );
    assert.equal(calls.length, 0);
    origin = "https://attacker.invalid";
    assert.ok(
      (
        await requestPasswordReset(
          {},
          form({ email: "synthetic@example.invalid" }),
        )
      ).error,
    );
    assert.equal(calls.length, 0);
    origin = "https://diamond-alibi-preview.lanternmere-wow.workers.dev";
    assert.ok(
      (
        await requestPasswordReset(
          {},
          form({ email: "synthetic@example.invalid" }),
        )
      ).message,
    );
    assert.equal(
      calls[0][1].redirectTo,
      origin + "/auth/callback?next=/reset-password",
    );
    failed = true;
    assert.ok(
      (
        await requestPasswordReset(
          {},
          form({ email: "synthetic@example.invalid" }),
        )
      ).error,
    );
    failed = false;
    calls.length = 0;
    assert.ok(
      (
        await updatePassword(
          {},
          form({ password: "short", confirmPassword: "short" }),
        )
      ).error,
    );
    assert.ok(
      (
        await updatePassword(
          {},
          form({
            password: "synthetic-passphrase",
            confirmPassword: "different",
          }),
        )
      ).error,
    );
    authorized = false;
    assert.ok(
      (
        await updatePassword(
          {},
          form({
            password: "synthetic-passphrase",
            confirmPassword: "synthetic-passphrase",
          }),
        )
      ).error,
    );
    assert.equal(calls.length, 0);
    authorized = true;
    failed = true;
    assert.ok(
      (
        await updatePassword(
          {},
          form({
            password: "synthetic-passphrase",
            confirmPassword: "synthetic-passphrase",
          }),
        )
      ).error,
    );
    failed = false;
    assert.ok(
      (
        await updatePassword(
          {},
          form({
            password: "synthetic-passphrase",
            confirmPassword: "synthetic-passphrase",
          }),
        )
      ).message,
    );
    console.log(
      "Password recovery: validation, trusted redirect, send failure, session denial and password update checks passed. No network requests.",
    );
  } finally {
    delete global.__resetMocks;
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
