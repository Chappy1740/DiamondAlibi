import {
  feedbackAccessConfig,
  verifyFeedbackIdentity,
} from "@/lib/feedback-access";
import { feedbackStore } from "@/lib/feedback-store";
import { feedbackSubjectHash, parseFeedback } from "@/lib/feedback";
export const dynamic = "force-dynamic";
function reply(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
async function identity(request: Request) {
  return verifyFeedbackIdentity(
    request.headers.get("cf-access-jwt-assertion"),
    feedbackAccessConfig(),
  );
}
function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
async function boundedText(
  request: Request,
  limit: number,
): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return reply({ error: "Request unavailable." }, 403);
  const user = await identity(request);
  if (!user) return reply({ error: "Please sign in again." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply({ error: "Invalid message." }, 400);
  try {
    // Bound streamed bodies too, rather than trusting Content-Length.
    const text = await boundedText(request, 12000);
    if (text === null)
      return reply({ error: "Message is too long or empty." }, 413);
    let input;
    try {
      input = parseFeedback(JSON.parse(text));
    } catch {
      return reply({ error: "Invalid message." }, 400);
    }
    if (!input)
      return reply(
        { error: "Choose a type and enter up to 2,000 characters." },
        400,
      );
    const { data, error } = await feedbackStore().rpc(
      "submit_review_feedback",
      {
        p_id: input.id,
        p_sender: await feedbackSubjectHash(user.subject),
        p_kind: input.kind,
        p_message: input.message,
        p_name: input.name,
      },
    );
    if (error)
      return reply(
        {
          error:
            "Not confirmed as sent. Keep your message and try again later.",
        },
        503,
      );
    if (data === "rate_limited")
      return reply(
        { error: "Too many messages. Please try again later." },
        429,
      );
    if (data !== "sent") throw new Error("Unconfirmed");
    return reply({ sent: true });
  } catch {
    return reply(
      {
        error: "Not confirmed as sent. Keep your message and try again later.",
      },
      503,
    );
  }
}
export async function GET(request: Request) {
  const user = await identity(request);
  if (!user?.owner) return reply({ error: "Inbox unavailable." }, 403);
  try {
    const pageText = new URL(request.url).searchParams.get("page") ?? "0";
    const page = Number(pageText);
    if (!Number.isInteger(page) || page < 0 || page > 10000)
      return reply({ error: "Invalid page." }, 400);
    const { data, error } = await feedbackStore()
      .from("review_feedback")
      .select("id,kind,message,name,created_at,reviewed")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(page * 50, page * 50 + 50);
    if (error) throw error;
    return reply({ items: data.slice(0, 50), more: data.length > 50 });
  } catch {
    return reply({ error: "Inbox unavailable. Try again later." }, 503);
  }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request))
    return reply({ error: "Request unavailable." }, 403);
  const user = await identity(request);
  if (!user?.owner) return reply({ error: "Inbox unavailable." }, 403);
  try {
    const text = await boundedText(request, 1024);
    if (text === null) return reply({ error: "Invalid update." }, 400);
    const value = JSON.parse(text);
    if (
      typeof value.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(value.id) ||
      typeof value.reviewed !== "boolean"
    )
      return reply({ error: "Invalid update." }, 400);
    const { data, error } = await feedbackStore()
      .from("review_feedback")
      .update({ reviewed: value.reviewed })
      .eq("id", value.id)
      .select("id,reviewed")
      .maybeSingle();
    if (error || !data) throw new Error("Unavailable");
    return reply(data);
  } catch {
    return reply({ error: "Update not confirmed. Try again later." }, 503);
  }
}
