export const feedbackKinds = ["question", "suggestion", "issue"] as const;
export type FeedbackKind = (typeof feedbackKinds)[number];
export type FeedbackInput = {
  id: string;
  kind: FeedbackKind;
  message: string;
  name: string;
};
export type FeedbackRecord = FeedbackInput & {
  created_at: string;
  reviewed: boolean;
  owner_reply: string | null;
  review_feedback_notifications?: {
    accepted_at: string | null;
    attempts: number;
    first_attempt_at: string | null;
    last_failure: string | null;
  } | null;
};

const feedbackId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function feedbackAlertStatus(
  item: Pick<FeedbackRecord, "review_feedback_notifications">,
  now = Date.now(),
) {
  const job = item.review_feedback_notifications;
  if (!job) return "Email alerts were not enabled for this earlier submission.";
  if (job.accepted_at)
    return "Email alert accepted by the mail provider; inbox delivery is not confirmed.";
  if (
    job.attempts >= 12 ||
    (job.first_attempt_at &&
      now - Date.parse(job.first_attempt_at) >= 23 * 60 * 60 * 1000)
  )
    return "Email alert needs attention. This feedback is safely saved here.";
  return job.last_failure
    ? "Email alert pending automatic retry. This feedback is safely saved here."
    : "Email alert queued. This feedback is safely saved here.";
}
export function parseFeedback(value: unknown): FeedbackInput | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    !feedbackId.test(row.id) ||
    !feedbackKinds.includes(row.kind as FeedbackKind) ||
    typeof row.message !== "string" ||
    typeof row.name !== "string"
  )
    return null;
  const message = row.message.trim();
  const name = row.name.trim();
  if (!message || message.length > 2000 || name.length > 60) return null;
  return { id: row.id, kind: row.kind as FeedbackKind, message, name };
}

export function parseFeedbackReply(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const { id, message } = value as Record<string, unknown>;
  if (
    typeof id !== "string" ||
    !feedbackId.test(id) ||
    typeof message !== "string"
  )
    return null;
  const trimmed = message.trim();
  return trimmed && trimmed.length <= 2000 ? { id, message: trimmed } : null;
}

export async function feedbackSubjectHash(subject: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(subject),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
