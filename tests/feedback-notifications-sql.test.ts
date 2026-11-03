import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("feedback outbox is atomic, private, leased, idempotent and bounded", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/20261011224726_review_feedback.sql",
        "utf8",
      ),
    );
    // Existing submissions are retained without sending a historical email batch.
    const historical = crypto.randomUUID();
    await db.query(
      "insert into public.review_feedback(id,sender_hash,kind,message) values ($1,$2,'suggestion','Synthetic historical')",
      [historical, "a".repeat(64)],
    );
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/20261103003240_feedback_owner_notifications.sql",
        "utf8",
      ),
    );
    assert.equal(
      (await db.query("select * from public.review_feedback_notifications"))
        .rows.length,
      0,
    );
    await db.exec("set role service_role");
    const submit = (id = crypto.randomUUID(), who = "b".repeat(64)) =>
      db.query<{ result: string }>(
        "select public.submit_review_feedback($1,$2,'issue','Synthetic feedback','') result",
        [id, who],
      );
    const claim = (recipient = "owner@example.invalid") =>
      db.query<{
        feedback_id: string;
        lease_token: string;
        recipient: string;
      }>(
        "select * from public.claim_feedback_notification($1,'alerts@example.invalid','https://app.example.invalid/owner/feedback')",
        [recipient],
      );
    const finish = (
      id: string,
      token: string,
      provider: string | null,
      failure: string | null = null,
    ) =>
      db.query<{ result: boolean }>(
        "select public.finish_feedback_notification($1,$2,$3,$4) result",
        [id, token, provider, failure],
      );
    const id = crypto.randomUUID();
    assert.equal((await submit(id)).rows[0].result, "sent");
    assert.equal((await submit(id)).rows[0].result, "sent");
    await assert.rejects(submit(id, "c".repeat(64)));
    assert.equal(
      (await db.query("select * from public.review_feedback_notifications"))
        .rows.length,
      1,
    );
    const first = (await claim()).rows[0];
    assert.equal(first.feedback_id, id);
    assert.equal(
      (await claim()).rows.length,
      0,
      "active leases prevent duplicate claims",
    );
    assert.equal(
      (await finish(id, crypto.randomUUID(), "fake")).rows[0].result,
      false,
    );
    assert.equal(
      (await finish(id, first.lease_token, null, "provider_unavailable"))
        .rows[0].result,
      true,
    );
    assert.equal(
      (await claim()).rows.length,
      0,
      "backoff prevents immediate retry",
    );
    await db.query(
      "update public.review_feedback_notifications set next_attempt_at = now() where feedback_id=$1",
      [id],
    );
    const second = (await claim("changed-owner@example.invalid")).rows[0];
    assert.equal(
      second.recipient,
      "owner@example.invalid",
      "retry payload destination is frozen",
    );
    await db.query(
      "update public.review_feedback_notifications set lease_until = now() - interval '1 minute' where feedback_id=$1",
      [id],
    );
    assert.equal(
      (await finish(id, second.lease_token, "late")).rows[0].result,
      false,
    );
    const recovered = (await claim()).rows[0];
    assert.notEqual(recovered.lease_token, second.lease_token);
    assert.equal(
      (await finish(id, second.lease_token, "stale")).rows[0].result,
      false,
    );
    assert.equal(
      (await finish(id, recovered.lease_token, "synthetic-provider-id")).rows[0]
        .result,
      true,
    );
    assert.equal(
      (await claim()).rows.length,
      0,
      "accepted notifications never resend",
    );
    assert.equal((await submit(id)).rows[0].result, "sent");
    assert.equal(
      (await claim()).rows.length,
      0,
      "submission retries do not enqueue another alert",
    );

    // Abandoned and repeatedly failing jobs remain visible without sending again
    // after the provider's documented 24-hour deduplication window.
    const expired = crypto.randomUUID();
    await submit(expired);
    await claim();
    await db.query(
      "update public.review_feedback_notifications set first_attempt_at=now()-interval '23 hours',lease_until=null,next_attempt_at=now() where feedback_id=$1",
      [expired],
    );
    assert.equal((await claim()).rows.length, 0);
    const exhausted = crypto.randomUUID();
    await submit(exhausted);
    await db.query(
      "update public.review_feedback_notifications set attempts=12 where feedback_id=$1",
      [exhausted],
    );
    assert.equal((await claim()).rows.length, 0);

    // Feedback and its outbox row roll back together.
    const rolledBack = crypto.randomUUID();
    await db.exec("begin");
    await submit(rolledBack);
    await db.exec("rollback");
    assert.equal(
      (
        await db.query(
          "select * from public.review_feedback_notifications where feedback_id=$1",
          [rolledBack],
        )
      ).rows.length,
      0,
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(
        db.query("select * from public.review_feedback_notifications"),
      );
      await assert.rejects(claim());
      await assert.rejects(finish(id, first.lease_token, "fake"));
      await assert.rejects(
        db.query(
          "update public.review_feedback_notifications set accepted_at=now()",
        ),
      );
      await assert.rejects(submit());
    }
  } finally {
    await db.close();
  }
});
