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
};
export function parseFeedback(value: unknown): FeedbackInput | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      row.id,
    ) ||
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

export async function feedbackSubjectHash(subject: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(subject),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
