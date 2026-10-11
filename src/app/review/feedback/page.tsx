import { ReviewFeedback } from "@/components/review-feedback";
import {
  feedbackAccessConfig,
  verifyFeedbackIdentity,
} from "@/lib/feedback-access";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export default async function FeedbackPage() {
  const config = feedbackAccessConfig();
  const user = await verifyFeedbackIdentity(
    (await headers()).get("cf-access-jwt-assertion"),
    config,
  );
  return (
    <ReviewFeedback
      ready={!!config && !!process.env.FEEDBACK_SUPABASE_SECRET_KEY}
      owner={user?.owner ?? false}
    />
  );
}
