import handler from "./.open-next/worker.js";
import { verifyFeedbackIdentity } from "./src/lib/feedback-access.ts";
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

const productionProject = "twfyeoywjexxnhnluomv";
const sandboxOrigin = "https://diamondalibi-sandbox.eydrenworks.com";
const deny = (status) =>
  new Response(null, { status, headers: { "Cache-Control": "no-store" } });

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).origin !== sandboxOrigin) return deny(404);

    const project = env.DA_SANDBOX_SUPABASE_REF;
    const key = env.DA_SANDBOX_SUPABASE_PUBLISHABLE_KEY;
    const issuer = env.DA_SANDBOX_ACCESS_ISSUER;
    const audience = env.DA_SANDBOX_ACCESS_AUDIENCE;
    if (
      env.DA_SANDBOX_ORIGIN !== sandboxOrigin ||
      !/^[a-z]{20}$/.test(project ?? "") ||
      project === productionProject ||
      !/^sb_publishable_[\w-]+$/.test(key ?? "") ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer ?? "") ||
      !audience ||
      env.FEEDBACK_NOTIFICATIONS_ENABLED !== "false" ||
      env.FEEDBACK_SUPABASE_SECRET_KEY ||
      env.FEEDBACK_RESEND_API_KEY
    ) {
      return deny(503);
    }

    const identity = await verifyFeedbackIdentity(
      request.headers.get("Cf-Access-Jwt-Assertion"),
      { issuer, audience, ownerSubject: "" },
    );
    if (!identity) return deny(403);

    return handler.fetch(
      request,
      {
        ...env,
        NEXT_PUBLIC_SUPABASE_URL: "https://" + project + ".supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      },
      ctx,
    );
  },
};
