import assert from "node:assert/strict";
import test from "node:test";
import {
  dispatchFeedbackNotifications,
  notificationConfig,
  notificationEmail,
} from "../src/lib/feedback-notifications.ts";
import { feedbackAlertStatus } from "../src/lib/feedback.ts";
import type { FeedbackRecord } from "../src/lib/feedback.ts";

const env = {
  FEEDBACK_NOTIFICATIONS_ENABLED: "true",
  FEEDBACK_NOTIFICATION_TO: "owner@example.invalid",
  FEEDBACK_NOTIFICATION_FROM: "alerts@example.invalid",
  FEEDBACK_NOTIFICATION_INBOX_URL: "https://app.example.invalid/owner/feedback",
  FEEDBACK_RESEND_API_KEY: "synthetic-api-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
  FEEDBACK_SUPABASE_SECRET_KEY: "synthetic-service-key",
};
const job = {
  feedback_id: "b546e012-3590-4071-8551-e0cf055eb19f",
  lease_token: "f72343e4-540b-4c89-a416-ce076ef2da12",
  recipient: env.FEEDBACK_NOTIFICATION_TO,
  sender: env.FEEDBACK_NOTIFICATION_FROM,
  inbox_url: env.FEEDBACK_NOTIFICATION_INBOX_URL,
};

test("notifications require complete explicit server configuration", async () => {
  assert.ok(notificationConfig(env));
  for (const key of Object.keys(env)) {
    assert.equal(notificationConfig({ ...env, [key]: "" }), null, key);
  }
  for (const inbox of [
    "http://app.example.invalid/owner/feedback",
    "https://user:pass@app.example.invalid/owner/feedback",
    "https://app.example.invalid/owner/feedback?token=private",
    "https://app.example.invalid/",
  ]) {
    assert.equal(
      notificationConfig({ ...env, FEEDBACK_NOTIFICATION_INBOX_URL: inbox }),
      null,
    );
  }
  assert.equal(
    notificationConfig({
      ...env,
      FEEDBACK_NOTIFICATION_TO:
        "owner@example.invalid\r\nBcc: x@example.invalid",
    }),
    null,
  );
  const result = await dispatchFeedbackNotifications({}, async () => {
    throw new Error("No network expected");
  });
  assert.equal(result.state, "disabled_or_unconfigured");
});

test("scheduler sends a private link with stable idempotency and acknowledges only provider acceptance", async () => {
  let claims = 0;
  let sends = 0;
  let finished = 0;
  const mock: typeof fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/rpc/claim_feedback_notification")) {
      claims++;
      assert.deepEqual(JSON.parse(String(init?.body)), {
        p_recipient: job.recipient,
        p_sender: job.sender,
        p_inbox_url: job.inbox_url,
      });
      return Response.json(claims === 1 ? [job] : []);
    }
    if (url === "https://api.resend.com/emails") {
      sends++;
      assert.equal(
        new Headers(init?.headers).get("Idempotency-Key"),
        `feedback/${job.feedback_id}`,
      );
      assert.equal(init?.redirect, "manual");
      assert.ok(init?.signal);
      assert.deepEqual(JSON.parse(String(init?.body)), notificationEmail(job));
      return Response.json({ id: "synthetic-provider-receipt" });
    }
    assert.ok(url.endsWith("/rpc/finish_feedback_notification"));
    const receipt = JSON.parse(String(init?.body));
    assert.equal(receipt.p_lease_token, job.lease_token);
    assert.equal(receipt.p_provider_id, "synthetic-provider-receipt");
    assert.equal(receipt.p_failure, null);
    finished++;
    return Response.json(true);
  };
  const result = await dispatchFeedbackNotifications(env, mock, async () => {});
  assert.deepEqual(result, { state: "processed", accepted: 1, pending: 0 });
  assert.equal(sends, 1);
  assert.equal(finished, 1);
  const body = notificationEmail({
    ...job,
    message: "private feedback",
    name: "private name",
  } as typeof job);
  assert.doesNotMatch(body.text, /private feedback|private name/);
});

test("provider failures remain queued without claiming delivery or hammering the provider", async () => {
  for (const mode of ["rate", "rejected", "network", "malformed"]) {
    let claims = 0;
    let receipts = 0;
    const mock: typeof fetch = async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.endsWith("/rpc/claim_feedback_notification")) {
        claims++;
        return Response.json([job]);
      }
      if (url === "https://api.resend.com/emails") {
        if (mode === "network") throw new Error("synthetic timeout");
        if (mode === "malformed") return Response.json({});
        return Response.json({}, { status: mode === "rate" ? 429 : 500 });
      }
      assert.ok(url.endsWith("/rpc/finish_feedback_notification"));
      const body = JSON.parse(String(init?.body));
      assert.equal(body.p_provider_id, null);
      assert.equal(
        body.p_failure,
        mode === "rate"
          ? "provider_rate_limited"
          : mode === "rejected"
            ? "provider_rejected"
            : "provider_unavailable",
      );
      receipts++;
      return Response.json(true);
    };
    assert.deepEqual(
      await dispatchFeedbackNotifications(env, mock, async () => {}),
      { state: "processed", accepted: 0, pending: 1 },
    );
    assert.equal(claims, 1);
    assert.equal(receipts, 1);
  }
});

test("uncertain receipt or database error fails the run, leaving the lease for recovery", async () => {
  for (const stage of ["claim", "finish"]) {
    const mock: typeof fetch = async (input) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.endsWith("/rpc/claim_feedback_notification"))
        return stage === "claim"
          ? Response.json({ message: "Synthetic" }, { status: 400 })
          : Response.json([job]);
      if (url === "https://api.resend.com/emails")
        return Response.json({ id: "synthetic-id" });
      return Response.json(false);
    };
    await assert.rejects(
      dispatchFeedbackNotifications(env, mock, async () => {}),
      /notification (claim|receipt) unavailable/,
    );
  }
});

test("each scheduled invocation is bounded and yields between provider calls", async () => {
  let sends = 0;
  let pauses = 0;
  const mock: typeof fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/rpc/claim_feedback_notification"))
      return Response.json([job]);
    if (url === "https://api.resend.com/emails") {
      sends++;
      return Response.json({ id: "synthetic-id" });
    }
    return Response.json(true);
  };
  const result = await dispatchFeedbackNotifications(env, mock, async (ms) => {
    assert.equal(ms, 600);
    pauses++;
  });
  assert.equal(result.accepted, 5);
  assert.equal(sends, 5);
  assert.equal(pauses, 4);
});

test("owner status distinguishes queued, retry, attention and provider acceptance", () => {
  assert.match(feedbackAlertStatus({}), /earlier submission/);
  const pending: NonNullable<FeedbackRecord["review_feedback_notifications"]> =
    {
      accepted_at: null,
      attempts: 0,
      first_attempt_at: null,
      last_failure: null,
    };
  const status = (values: Partial<typeof pending>) =>
    feedbackAlertStatus({
      review_feedback_notifications: { ...pending, ...values },
    });
  assert.match(status({}), /queued/);
  assert.match(status({ last_failure: "provider_unavailable" }), /retry/);
  assert.match(status({ attempts: 12 }), /needs attention/);
  assert.match(
    status({ first_attempt_at: "2020-01-01T00:00:00Z" }),
    /needs attention/,
  );
  assert.match(
    status({ accepted_at: "2026-11-02T00:00:00Z" }),
    /delivery is not confirmed/,
  );
});
