import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OwnerFeedbackInbox } from "@/components/review-feedback";
import {
  feedbackAccessConfig,
  verifyFeedbackIdentity,
} from "@/lib/feedback-access";
export const dynamic = "force-dynamic";
export default async function OwnerInboxPage() {
  const user = await verifyFeedbackIdentity(
    (await headers()).get("cf-access-jwt-assertion"),
    feedbackAccessConfig(),
  );
  if (!user?.owner) notFound();
  return <OwnerFeedbackInbox />;
}
