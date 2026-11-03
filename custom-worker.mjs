// Keep the adapter's request handler and exports; add only the owner-alert cron.
import handler from "./.open-next/worker.js";
import { dispatchFeedbackNotifications } from "./src/lib/feedback-notifications.ts";
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
  async scheduled(_event, env) {
    // Await the work so the scheduled invocation retains its lifetime and records failures.
    await dispatchFeedbackNotifications(env);
  },
};
