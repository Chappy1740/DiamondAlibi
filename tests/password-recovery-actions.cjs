const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "diamond-recovery-"));
  const previousOrigin = process.env.AUTH_SITE_URL;
  let calls, mode, claims, userError, userId;
  const reset = () => {
    calls = [];
    mode = "ok";
    userError = null;
    userId = "synthetic";
    claims = {
      sub: userId,
      session_id: "synthetic-session",
      role: "authenticated",
      exp: Date.now() / 1000 + 3600,
      amr: [{ method: "recovery", timestamp: Math.floor(Date.now() / 1000) }],
    };
    process.env.AUTH_SITE_URL = "https://app.example.invalid";
  };
  global.__recoveryClient = {
    auth: {
      async resetPasswordForEmail(...args) {
        calls.push(["reset", ...args]);
        if (mode === "throw") throw Error("private provider detail");
        return {
          error: mode === "ok" ? null : { message: "private provider detail" },
        };
      },
      async getClaims() {
        return {
          data: { claims },
          error: mode === "claims-error" ? Error("invalid signature") : null,
        };
      },
      async getUser() {
        return {
          data: { user: userId ? { id: userId } : null },
          error: userError,
        };
      },
      async updateUser(...args) {
        calls.push(["update", ...args]);
        if (mode === "update-throw") throw Error("secret");
        return { error: mode === "update-error" ? Error("secret") : null };
      },
      async signOut(...args) {
        calls.push(["signout", ...args]);
        return { error: mode === "signout-error" ? Error("secret") : null };
      },
      async exchangeCodeForSession(...args) {
        calls.push(["exchange", ...args]);
        return { error: mode === "exchange-error" ? Error("secret") : null };
      },
      async verifyOtp(...args) {
        calls.push(["verify", ...args]);
        return { error: mode === "exchange-error" ? Error("secret") : null };
      },
    },
  };
  async function load(entry, name) {
    const outfile = path.join(dir, name + ".mjs");
    await esbuild.build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      plugins: [
        {
          name: "synthetic-auth",
          setup(build) {
            build.onResolve({ filter: /^@\/lib\/supabase\/server$/ }, () => ({
              path: "supabase",
              namespace: "synthetic",
            }));
            build.onResolve({ filter: /^next\/server$/ }, () => ({
              path: "response",
              namespace: "synthetic",
            }));
            build.onResolve({ filter: /^next\/navigation$/ }, () => ({
              path: "navigation",
              namespace: "synthetic",
            }));
            build.onLoad(
              { filter: /.*/, namespace: "synthetic" },
              ({ path: name }) => ({
                contents:
                  name === "navigation"
                    ? "export function redirect(path) { throw new Error('REDIRECT:' + path); }"
                    : name === "supabase"
                      ? "export async function supabaseServer() { return globalThis.__recoveryClient; }"
                      : "export class NextResponse extends Response { static redirect(url,status=307) { return new NextResponse(null,{status,headers:{Location:String(url)}}); } }",
              }),
            );
          },
        },
      ],
    });
    return import(pathToFileURL(outfile).href);
  }
  const form = (entries) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(entries)) data.set(key, value);
    return data;
  };
  const request = (query) => {
    const url = new URL("https://attacker.invalid/auth/recovery" + query);
    return { url: url.href, nextUrl: url };
  };
  try {
    const resetAction = await load(
      "src/app/forgot-password/actions.ts",
      "request",
    );
    const update = await load("src/app/update-password/actions.ts", "update");
    const recovery = await load("src/app/auth/recovery/route.ts", "recovery");
    const callback = await load("src/app/auth/callback/route.ts", "callback");
    reset();
    const validEmail = form({
      email: " synthetic@example.invalid ",
      redirectTo: "https://attacker.invalid",
    });
    const success = await resetAction.requestPasswordReset({}, validEmail);
    assert.deepEqual(calls[0], [
      "reset",
      "synthetic@example.invalid",
      { redirectTo: "https://app.example.invalid/auth/recovery" },
    ]);
    for (const failure of ["unknown", "smtp", "rate-limit", "throw"]) {
      mode = failure;
      assert.deepEqual(
        await resetAction.requestPasswordReset({}, validEmail),
        success,
      );
    }
    reset();
    assert.ok(
      (await resetAction.requestPasswordReset({}, form({ email: "bad" })))
        .error,
    );
    assert.equal(calls.length, 0);
    delete process.env.AUTH_SITE_URL;
    assert.ok((await resetAction.requestPasswordReset({}, validEmail)).error);
    assert.equal(calls.length, 0);
    reset();
    const validPassword = form({
      password: "synthetic password",
      confirmPassword: "synthetic password",
    });
    assert.ok(
      (
        await update.updatePassword(
          {},
          form({ password: "short", confirmPassword: "short" }),
        )
      ).error,
    );
    assert.ok(
      (
        await update.updatePassword(
          {},
          form({ password: "x".repeat(257), confirmPassword: "x".repeat(257) }),
        )
      ).error,
    );
    assert.ok(
      (
        await update.updatePassword(
          {},
          form({
            password: "synthetic password",
            confirmPassword: "different",
          }),
        )
      ).error,
    );
    assert.equal(calls.length, 0);
    for (const amr of [
      [],
      [{ method: "password", timestamp: Date.now() / 1000 }],
      [{ method: "recovery", timestamp: Date.now() / 1000 - 901 }],
    ]) {
      claims.amr = amr;
      assert.ok((await update.updatePassword({}, validPassword)).error);
      assert.equal(calls.length, 0);
    }
    for (const failure of ["claims-error", "deleted", "mismatch"]) {
      reset();
      if (failure === "claims-error") mode = failure;
      if (failure === "deleted") userError = Error("deleted");
      if (failure === "mismatch") userId = "other-user";
      assert.ok((await update.updatePassword({}, validPassword)).error);
      assert.equal(calls.length, 0);
    }
    reset();
    await assert.rejects(
      update.updatePassword({}, validPassword),
      /REDIRECT:\/login\?notice=password-updated$/,
    );
    assert.deepEqual(calls, [
      ["update", { password: "synthetic password" }],
      ["signout", { scope: "global" }],
    ]);
    for (const failure of ["update-error", "update-throw"]) {
      reset();
      mode = failure;
      assert.ok((await update.updatePassword({}, validPassword)).error);
      assert.equal(calls.length, 1);
    }
    reset();
    mode = "signout-error";
    await assert.rejects(
      update.updatePassword({}, validPassword),
      /REDIRECT:\/login\?notice=password-updated-signout-failed$/,
    );
    reset();
    let response = await recovery.GET(
      request(
        "?code=synthetic-code&sb_flow_id=synthetic-flow&next=https://attacker.invalid",
      ),
    );
    assert.equal(response.status, 303);
    assert.equal(
      response.headers.get("location"),
      "https://app.example.invalid/update-password",
    );
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.deepEqual(calls[0], [
      "exchange",
      "synthetic-code",
      { flowId: "synthetic-flow" },
    ]);
    reset();
    response = await recovery.GET(
      request(
        "?token_hash=synthetic-hash&type=recovery&redirect_to=//attacker.invalid",
      ),
    );
    assert.equal(
      response.headers.get("location"),
      "https://app.example.invalid/update-password",
    );
    assert.deepEqual(calls[0], [
      "verify",
      { token_hash: "synthetic-hash", type: "recovery" },
    ]);
    for (const query of [
      "",
      "?error=access_denied&error_description=secret",
      "?token_hash=synthetic&type=signup",
      "?token_hash=synthetic&code=synthetic&type=recovery",
      "?code=" + "x".repeat(2049),
    ]) {
      reset();
      response = await recovery.GET(request(query));
      assert.equal(
        response.headers.get("location"),
        "https://app.example.invalid/forgot-password?notice=invalid-link",
      );
      assert.equal(calls.length, 0);
    }
    reset();
    mode = "exchange-error";
    response = await recovery.GET(request("?code=expired"));
    assert.match(response.headers.get("location"), /invalid-link$/);
    reset();
    claims.amr = [{ method: "password", timestamp: Date.now() / 1000 }];
    response = await recovery.GET(request("?code=signup-code"));
    assert.match(response.headers.get("location"), /invalid-link$/);
    reset();
    response = await callback.GET(
      request("?code=synthetic&next=//attacker.invalid"),
    );
    assert.equal(
      response.headers.get("location"),
      "https://app.example.invalid/update-password",
    );
    reset();
    claims.amr = [];
    response = await callback.GET(request("?code=signup"));
    assert.equal(
      response.headers.get("location"),
      "https://app.example.invalid/club",
    );
    reset();
    delete process.env.AUTH_SITE_URL;
    response = await recovery.GET(request("?code=synthetic"));
    assert.equal(response.status, 503);
    assert.equal(calls.length, 0);
    console.log(
      "Password recovery actions and callbacks passed (synthetic Auth only).",
    );
  } finally {
    if (previousOrigin === undefined) delete process.env.AUTH_SITE_URL;
    else process.env.AUTH_SITE_URL = previousOrigin;
    delete global.__recoveryClient;
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
