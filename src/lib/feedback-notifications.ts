// The scheduler uses this module outside Next.js; it contains no client exports.
import { createClient } from "@supabase/supabase-js";

export type NotificationEnvironment = {
  [binding: string]: unknown;
  FEEDBACK_NOTIFICATIONS_ENABLED?: string;
  FEEDBACK_NOTIFICATION_TO?: string;
  FEEDBACK_NOTIFICATION_FROM?: string;
  FEEDBACK_NOTIFICATION_INBOX_URL?: string;
  FEEDBACK_RESEND_API_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  FEEDBACK_SUPABASE_SECRET_KEY?: string;
};

type NotificationJob = {
  feedback_id: string;
  lease_token: string;
  recipient: string;
  sender: string;
  inbox_url: string;
};

export function notificationConfig(env: NotificationEnvironment) {
  if (env.FEEDBACK_NOTIFICATIONS_ENABLED !== "true") return null;
  const {
    FEEDBACK_NOTIFICATION_TO: to,
    FEEDBACK_NOTIFICATION_FROM: from,
    FEEDBACK_NOTIFICATION_INBOX_URL: inbox,
    FEEDBACK_RESEND_API_KEY: key,
    NEXT_PUBLIC_SUPABASE_URL: database,
    FEEDBACK_SUPABASE_SECRET_KEY: secret,
  } = env;
  const address = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  if (
    !to ||
    !from ||
    to.length > 254 ||
    from.length > 254 ||
    !address.test(to) ||
    !address.test(from) ||
    !key ||
    !database ||
    !secret ||
    !inbox
  )
    return null;
  try {
    const url = new URL(inbox);
    const db = new URL(database);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/owner/feedback" ||
      url.search ||
      url.hash ||
      db.protocol !== "https:" ||
      db.username ||
      db.password
    )
      return null;
  } catch {
    return null;
  }
  return { to, from, inbox, key, database, secret };
}

// A generic alert keeps private feedback and author names in the protected inbox.
export function notificationEmail(
  job: Pick<
    NotificationJob,
    "feedback_id" | "recipient" | "sender" | "inbox_url"
  >,
) {
  return {
    from: job.sender,
    to: [job.recipient],
    subject: "Diamond Alibi: new Challenge the Call feedback",
    text: `New feedback is waiting in Booth Reviews.\n\nOpen your owner inbox:\n${job.inbox_url}\n\nReference: ${job.feedback_id}\n\nThis notification does not contain the private submission.`,
  };
}

export async function dispatchFeedbackNotifications(
  env: NotificationEnvironment,
  request: typeof fetch = fetch,
  pause: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
) {
  const config = notificationConfig(env);
  if (!config)
    return { state: "disabled_or_unconfigured", accepted: 0, pending: 0 };
  const db = createClient(config.database, config.secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: request },
  });
  let accepted = 0;
  let pending = 0;
  // Bound each cron run. The database leases one job at a time across isolates.
  for (let i = 0; i < 5; i++) {
    const { data, error } = await db.rpc("claim_feedback_notification", {
      p_recipient: config.to,
      p_sender: config.from,
      p_inbox_url: config.inbox,
    });
    if (error) throw new Error("Feedback notification claim unavailable");
    const job = data?.[0] as NotificationJob | undefined;
    if (!job) break;
    let providerId: string | null = null;
    let failure = "provider_unavailable";
    try {
      const response = await request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `feedback/${job.feedback_id}`,
        },
        body: JSON.stringify(notificationEmail(job)),
        signal: AbortSignal.timeout(10000),
        // Workers supports manual/follow only. Keep credentials on this origin.
        redirect: "manual",
      });
      if (response.ok) {
        const result = await response.json();
        if (
          typeof result.id === "string" &&
          result.id.length > 0 &&
          result.id.length <= 200
        )
          providerId = result.id;
      } else {
        failure =
          response.status === 429
            ? "provider_rate_limited"
            : "provider_rejected";
      }
    } catch {
      /* No secrets, response bodies, identities or feedback in logs. */
    }
    const finished = await db.rpc("finish_feedback_notification", {
      p_feedback_id: job.feedback_id,
      p_lease_token: job.lease_token,
      p_provider_id: providerId,
      p_failure: providerId ? null : failure,
    });
    if (finished.error || finished.data !== true)
      throw new Error("Feedback notification receipt unavailable");
    if (providerId) accepted++;
    else pending++;
    if (!providerId) break; // Respect provider failures/rate limits until next run.
    if (i < 4) await pause(600);
  }
  return { state: "processed", accepted, pending };
}
