const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "diamond-feedback-"));
  const originalFetch = global.fetch;
  try {
    const jose = await import("jose");
    const pair = await jose.generateKeyPair("RS256", { extractable: true });
    const key = {
      ...(await jose.exportJWK(pair.publicKey)),
      kid: "synthetic",
      alg: "RS256",
    };
    const issuer = "https://synthetic.cloudflareaccess.com";
    Object.assign(process.env, {
      FEEDBACK_ACCESS_ISSUER: issuer,
      FEEDBACK_ACCESS_AUDIENCE: "synthetic-app",
      FEEDBACK_OWNER_SUBJECT: "synthetic-owner",
      NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
      FEEDBACK_SUPABASE_SECRET_KEY: "synthetic-only-key",
    });
    let dbCalls = 0;
    let mode = "sent";
    global.fetch = async (url, init) => {
      const target = String(url instanceof Request ? url.url : url);
      if (target === issuer + "/cdn-cgi/access/certs")
        return Response.json({ keys: [key] });
      assert.ok(target.startsWith("https://synthetic.supabase.co/rest/v1/"));
      dbCalls++;
      if (target.includes("/rpc/"))
        return Response.json(
          mode === "sent" ? "sent" : mode === "rate" ? "rate_limited" : null,
        );
      if (init?.method === "PATCH")
        return Response.json({ id: id, reviewed: true });
      return Response.json([]);
    };
    const file = path.join(dir, "route.mjs");
    await esbuild.build({
      entryPoints: ["src/app/api/feedback/route.ts"],
      outfile: file,
      bundle: true,
      platform: "node",
      format: "esm",
      plugins: [
        {
          name: "server-marker",
          setup(build) {
            build.onResolve({ filter: /^server-only$/ }, () => ({
              path: "marker",
              namespace: "marker",
            }));
            build.onLoad({ filter: /.*/, namespace: "marker" }, () => ({
              contents: "",
            }));
          },
        },
      ],
    });
    const api = await import(pathToFileURL(file).href);
    const signed = (subject) =>
      new jose.SignJWT({ email: "synthetic@example.invalid" })
        .setSubject(subject)
        .setIssuer(issuer)
        .setAudience("synthetic-app")
        .setIssuedAt()
        .setExpirationTime("1h")
        .setProtectedHeader({ alg: "RS256", kid: "synthetic" })
        .sign(pair.privateKey);
    const reviewer = await signed("synthetic-reviewer");
    const owner = await signed("synthetic-owner");
    const id = crypto.randomUUID();
    const request = (
      method,
      token,
      body,
      origin = "https://app.example.invalid",
    ) =>
      new Request("https://app.example.invalid/api/feedback", {
        method,
        headers: {
          "cf-access-jwt-assertion": token ?? "",
          "content-type": "application/json",
          origin,
        },
        ...(body === undefined
          ? {}
          : { body: typeof body === "string" ? body : JSON.stringify(body) }),
      });
    assert.equal((await api.GET(request("GET", reviewer))).status, 403);
    assert.equal((await api.GET(request("GET", "forged"))).status, 403);
    assert.equal(
      (await api.PATCH(request("PATCH", reviewer, { id, reviewed: true })))
        .status,
      403,
    );
    assert.equal(dbCalls, 0, "denial must occur before database access");
    assert.equal(
      (
        await api.POST(
          request(
            "POST",
            reviewer,
            { id, kind: "issue", message: "Synthetic failure", name: "" },
            "https://other.example.invalid",
          ),
        )
      ).status,
      403,
    );
    assert.equal(dbCalls, 0);
    const value = { id, kind: "issue", message: "Synthetic failure", name: "" };
    assert.equal(
      (await api.POST(request("POST", reviewer, value))).status,
      200,
    );
    mode = "rate";
    assert.equal(
      (await api.POST(request("POST", reviewer, value))).status,
      429,
    );
    mode = "unconfirmed";
    assert.equal(
      (await api.POST(request("POST", reviewer, value))).status,
      503,
    );
    const before = dbCalls;
    assert.equal(
      (await api.POST(request("POST", reviewer, "a".repeat(12001)))).status,
      413,
    );
    assert.equal(
      (await api.PATCH(request("PATCH", owner, "a".repeat(1025)))).status,
      400,
    );
    assert.equal(dbCalls, before);
    assert.equal((await api.GET(request("GET", owner))).status, 200);
    assert.equal(
      (await api.PATCH(request("PATCH", owner, { id, reviewed: true }))).status,
      200,
    );
    console.log(
      "Feedback API: reviewer/forged denial before database access, CSRF, bounded bodies, rate limits, truthful receipts and owner access pass. No live network calls.",
    );
  } finally {
    global.fetch = originalFetch;
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
