import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authOrigin,
  hasRecentRecovery,
  validRecoveryEmail,
} from "../src/lib/password-recovery.ts";
test("only configured HTTPS origins and exact loopback HTTP origins are accepted", () => {
  assert.equal(
    authOrigin("https://app.example.invalid"),
    "https://app.example.invalid",
  );
  assert.equal(authOrigin("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  for (const value of [
    undefined,
    "",
    "//evil.invalid",
    "javascript:alert(1)",
    "http://evil.invalid",
    "https://app.invalid/path",
    "https://user:secret@app.invalid",
    "https://app.invalid/?next=evil",
    "https://app.invalid/#token",
    "http://localhost.evil.invalid",
  ])
    assert.equal(authOrigin(value), null);
});
test("recovery requires verified authenticated, unexpired claims and a recent recovery AMR", () => {
  const claims = {
    sub: "synthetic",
    session_id: "synthetic-session",
    role: "authenticated",
    exp: 2000,
    amr: [{ method: "recovery", timestamp: 1000 }],
  };
  assert.equal(hasRecentRecovery(claims, 1100), true);
  assert.equal(hasRecentRecovery(claims, 1900), false);
  assert.equal(hasRecentRecovery(claims, 999), false);
  for (const replacement of [
    { role: "anon" },
    { exp: 1100 },
    { exp: NaN },
    { exp: Infinity },
    { sub: null },
    { session_id: null },
    { session_id: {} },
    { amr: [{ method: "password", timestamp: 1000 }] },
    { amr: ["recovery"] },
    { amr: [{ method: "recovery", timestamp: NaN }] },
    { amr: [], user_metadata: { recovery: true } },
  ])
    assert.equal(hasRecentRecovery({ ...claims, ...replacement }, 1100), false);
});
test("email validation rejects malformed and oversized input", () => {
  assert.equal(validRecoveryEmail("synthetic@example.invalid"), true);
  for (const email of [
    "",
    "a@",
    "a b@example.invalid",
    "a\n@example.invalid",
    "x".repeat(255) + "@example.invalid",
  ])
    assert.equal(validRecoveryEmail(email), false);
});
