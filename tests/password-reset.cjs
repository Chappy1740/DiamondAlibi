const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { NextResponse } = require("next/server");

(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "diamond-reset-"));
  const calls = [];
  let origin = "https://diamond-alibi-preview.lanternmere-wow.workers.dev";
  let authorized = true;
  let failed = false;
  global.__resetMocks = {
    NextResponse,
    headers: async () => new Headers({ origin }),
    supabaseServer: async () => ({
      auth: {
        exchangeCodeForSession: async (code) => {
          calls.push(["exchange", code]);
          return { data: { user: null }, error: failed ? {} : null };
        },
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
            { filter: /^(next\/(headers|server)|@\/lib\/supabase\/server)$/ },
            (args) => ({ path: args.path, namespace: "mock" }),
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents:
              args.path === "next/headers"
                ? "export const headers = global.__resetMocks.headers;"
                : args.path === "next/server"
                  ? "export const NextResponse = global.__resetMocks.NextResponse;"
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
    const { GET: authCallback } = await load("src/app/auth/callback/route.ts", "callback");
    const callback = async (query) => {
      const nextUrl = new URL(`/auth/callback?${query}`, origin);
      return authCallback({ nextUrl, url: nextUrl.href });
    };
    const signupConfirmation = await callback("next=/login&code=synthetic-signup-code");
    assert.equal(signupConfirmation.headers.get("location"), `${origin}/login#`);
    assert.equal(signupConfirmation.headers.get("cache-control"), "private, no-store");
    assert.equal(calls.length, 0, "signup confirmation must leave the browser session alone");
    const recovery = await callback("next=/reset-password&code=synthetic-recovery-code");
    assert.equal(recovery.headers.get("location"), `${origin}/reset-password`);
    assert.deepEqual(calls, [["exchange", "synthetic-recovery-code"]]);
    const expiredRecovery = await callback("next=/reset-password");
    assert.equal(expiredRecovery.headers.get("location"), `${origin}/forgot-password?error=expired`);
    calls.length = 0;
    const form = (values) => {
      const f = new FormData();
      Object.entries(values).forEach(([k, v]) => f.set(k, v));
      return f;
    };
    const sandboxOrigin = "https://diamondalibi-sandbox.eydrenworks.com";
    process.env.DA_SANDBOX_ORIGIN = sandboxOrigin;
    try {
      origin = sandboxOrigin;
      const blocked = await requestPasswordReset({}, form({ email: "synthetic@example.invalid" }));
      assert.match(blocked.error, /reset your sandbox password/);
      const update = await updatePassword({}, form({
        password: "synthetic-password",
        confirmPassword: "synthetic-password",
      }));
      assert.match(update.error, /reset your sandbox password/);
      const callbackResponse = await callback("next=/reset-password&code=synthetic");
      assert.equal(callbackResponse.status, 404);
      assert.equal(callbackResponse.headers.get("location"), null);
      assert.equal(calls.length, 0);
    } finally {
      delete process.env.DA_SANDBOX_ORIGIN;
    }
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
    origin = "https://diamondalibi.eydrenworks.com";
    calls.length = 0;
    assert.ok(
      (
        await requestPasswordReset(
          {},
          form({ email: "synthetic@example.invalid" }),
        )
      ).message,
    );
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0][1].redirectTo,
      origin + "/auth/callback?next=/reset-password",
    );
    for (const hostileOrigin of [
      "http://diamondalibi.eydrenworks.com",
      "https://diamondalibi.eydrenworks.com.attacker.invalid",
      "https://attacker.invalid/diamondalibi.eydrenworks.com",
      "https://diamondalibi.eydrenworks.com:444",
    ]) {
      origin = hostileOrigin;
      calls.length = 0;
      assert.ok(
        (
          await requestPasswordReset(
            {},
            form({ email: "synthetic@example.invalid" }),
          )
        ).error,
      );
      assert.equal(
        calls.length,
        0,
        "untrusted origins must not issue reset mail",
      );
    }
    origin = "https://diamondalibi.eydrenworks.com";
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
