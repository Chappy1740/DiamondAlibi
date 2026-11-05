import { FeedbackInbox } from "@/components/review-feedback";
import {
  feedbackAccessConfig,
  verifyFeedbackIdentity,
} from "@/lib/feedback-access";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MyFeedbackPage() {
  const user = await verifyFeedbackIdentity(
    (await headers()).get("cf-access-jwt-assertion"),
    feedbackAccessConfig(),
  );
  if (!user) notFound();
  return <FeedbackInbox mine />;
}
