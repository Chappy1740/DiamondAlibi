import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyFeedbackIdentity } from "../src/lib/feedback-access.ts";
import { feedbackSubjectHash, parseFeedback } from "../src/lib/feedback.ts";
const config = {
  issuer: "https://synthetic.cloudflareaccess.com",
  audience: "synthetic-audience",
  ownerSubject: "synthetic-owner",
};
const pair = await generateKeyPair("RS256", { extractable: true });
const key = { ...(await exportJWK(pair.publicKey)), kid: "test", alg: "RS256" };
const keys = createLocalJWKSet({ keys: [key] });
async function token(changes: Record<string, unknown> = {}) {
  return new SignJWT({
    email: "synthetic@example.invalid",
    sub: "synthetic-reviewer",
    iss: config.issuer,
    aud: config.audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
    ...changes,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .sign(pair.privateKey);
}
test("verified identity alone determines private owner access", async () => {
  assert.deepEqual(await verifyFeedbackIdentity(await token(), config, keys), {
    subject: "synthetic-reviewer",
    owner: false,
  });
  assert.deepEqual(
    await verifyFeedbackIdentity(
      await token({ sub: config.ownerSubject }),
      config,
      keys,
    ),
    { subject: config.ownerSubject, owner: true },
  );
});
test("missing, forged, expired and wrong-application tokens fail closed", async () => {
  assert.equal(await verifyFeedbackIdentity(null, config, keys), null);
  assert.equal(await verifyFeedbackIdentity(await token(), null, keys), null);
  for (const changes of [
    { iss: "https://other.cloudflareaccess.com" },
    { aud: "other" },
    { exp: 1 },
    { email: null },
    { sub: "" },
    { nbf: Math.floor(Date.now() / 1000) + 300 },
  ])
    assert.equal(
      await verifyFeedbackIdentity(await token(changes), config, keys),
      null,
    );
  const signed = await token();
  const parts = signed.split(".");
  parts[1] = Buffer.from(
    JSON.stringify({ sub: config.ownerSubject, exp: 9999999999 }),
  ).toString("base64url");
  assert.equal(
    await verifyFeedbackIdentity(parts.join("."), config, keys),
    null,
  );
});
test("feedback bounds reject invalid IDs, types, blank and long messages", async () => {
  const value = {
    id: crypto.randomUUID(),
    kind: "issue",
    message: "  Save failed  ",
    name: "",
  };
  assert.equal(parseFeedback(value)?.message, "Save failed");
  for (const change of [
    { id: "invalid" },
    { kind: "owner" },
    { message: " " },
    { message: "a".repeat(2001) },
    { name: "a".repeat(61) },
  ])
    assert.equal(parseFeedback({ ...value, ...change }), null);
  assert.match(
    await feedbackSubjectHash("synthetic-reviewer"),
    /^[0-9a-f]{64}$/,
  );
});
