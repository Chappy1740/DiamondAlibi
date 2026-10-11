import "server-only";
import { createClient } from "@supabase/supabase-js";
export function feedbackStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.FEEDBACK_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Feedback unavailable");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
