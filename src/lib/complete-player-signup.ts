import type { User } from "@supabase/supabase-js";
import type { supabaseServer } from "@/lib/supabase/server";
import { profileArguments, signupDetails } from "@/lib/player-profile";

export async function completePlayerSignup(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  user: User | null | undefined,
) {
  const details = signupDetails(user?.user_metadata?.da_signup_profile);
  if (!user?.email_confirmed_at || !details) return "/";
  const { data, error } = await client.rpc("da_save_player_details", {
    ...profileArguments(details),
    p_initialize: true,
  });
  // A retry can finish in Bio & profile if initialization could not be confirmed.
  return error || data === true ? "/more/profile?finish=1" : "/";
}
