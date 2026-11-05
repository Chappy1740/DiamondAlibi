const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
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
    let replyMode = "saved";
    const senderHash = (subject) =>
      createHash("sha256").update(subject).digest("hex");
    const ownSubmission = {
      kind: "suggestion",
      owner_reply: "Thanks for the idea.",
    };
    global.fetch = async (url, init) => {
      const target = String(url instanceof Request ? url.url : url);
      if (target === issuer + "/cdn-cgi/access/certs")
        return Response.json({ keys: [key] });
      assert.ok(target.startsWith("https://synthetic.supabase.co/rest/v1/"));
      dbCalls++;
      if (target.endsWith("/rpc/reply_to_review_feedback")) {
        assert.deepEqual(JSON.parse(init.body), {
          p_id: id,
          p_message: "Thanks for the idea.",
        });
        return Response.json(replyMode);
      }
      if (target.includes("/rpc/"))
        return Response.json(
          mode === "sent" ? "sent" : mode === "rate" ? "rate_limited" : null,
        );
      if (init?.method === "PATCH")
        return Response.json({ id: id, reviewed: true });
      const params = new URL(target).searchParams;
      if (params.has("sender_hash")) {
        assert.equal(params.get("select").includes("sender_hash"), false);
        assert.equal(
          params.get("select").includes("review_feedback_notifications"),
          false,
        );
        assert.equal(params.get("id"), null);
        return Response.json(
          params.get("sender_hash") === `eq.${senderHash("synthetic-reviewer")}`
            ? [ownSubmission]
            : [],
        );
      }
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
    const otherReviewer = await signed("synthetic-other-reviewer");
    const owner = await signed("synthetic-owner");
    const id = crypto.randomUUID();
    const request = (
      method,
      token,
      body,
      origin = "https://app.example.invalid",
      query = "",
    ) =>
      new Request("https://app.example.invalid/api/feedback" + query, {
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
      (await api.GET(request("GET", null, undefined, undefined, "?view=mine")))
        .status,
      403,
    );
    const ownerReply = { id, message: " Thanks for the idea. " };
    assert.equal(
      (await api.PUT(request("PUT", reviewer, ownerReply))).status,
      403,
    );
    assert.equal(
      (
        await api.PUT(
          request("PUT", owner, ownerReply, "https://other.example.invalid"),
        )
      ).status,
      403,
    );
    assert.equal(
      (await api.PUT(request("PUT", owner, { id, message: " " }))).status,
      400,
    );
    assert.equal(
      (await api.PUT(request("PUT", owner, { id, message: "a".repeat(2001) })))
        .status,
      400,
    );
    assert.equal(
      (await api.PUT(request("PUT", owner, "a".repeat(12001)))).status,
      413,
    );
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
    const inboxResponse = await api.GET(request("GET", owner));
    assert.equal(inboxResponse.status, 200);
    assert.equal((await inboxResponse.json()).alertsConfigured, false);
    assert.equal(
      (await api.PATCH(request("PATCH", owner, { id, reviewed: true }))).status,
      200,
    );
    const mine = await api.GET(
      request("GET", reviewer, undefined, undefined, "?view=mine"),
    );
    assert.equal(mine.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await mine.json(), {
      items: [ownSubmission],
      more: false,
    });
    const spoofed = `?view=mine&id=${id}&sender_hash=${senderHash("synthetic-reviewer")}`;
    const other = await api.GET(
      request("GET", otherReviewer, undefined, undefined, spoofed),
    );
    assert.deepEqual(await other.json(), { items: [], more: false });
    const saved = await api.PUT(request("PUT", owner, ownerReply));
    assert.equal(saved.status, 200);
    assert.deepEqual(await saved.json(), {
      owner_reply: "Thanks for the idea.",
    });
    for (const [result, status] of [
      ["already_replied", 409],
      ["not_found", 404],
      ["unconfirmed", 503],
    ]) {
      replyMode = result;
      assert.equal(
        (await api.PUT(request("PUT", owner, ownerReply))).status,
        status,
      );
    }
    console.log(
      "Feedback API: owner-only replies, sender-only history, CSRF, bounded bodies, rate limits and truthful receipts pass. No live network calls.",
    );
  } finally {
    global.fetch = originalFetch;
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
