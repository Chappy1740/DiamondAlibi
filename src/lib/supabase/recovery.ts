import { supabaseServer } from "@/lib/supabase/server";
import { hasRecentRecovery } from "@/lib/password-recovery";

export async function recoveryClient() {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !hasRecentRecovery(data?.claims)) return null;
    // Also check the user with Auth so a deleted user cannot use an unexpired JWT.
    const user = await supabase.auth.getUser();
    if (user.error || !user.data.user || user.data.user.id !== data?.claims.sub)
      return null;
    return supabase;
  } catch {
    return null;
  }
}
