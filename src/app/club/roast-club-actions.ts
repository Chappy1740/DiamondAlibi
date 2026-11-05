"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { roastClubConsent, roastClubEnabled, type RoastClubResult } from "@/lib/roast-club-consent";

/** The session client supplies identity; database functions enforce membership and ownership. */
export async function roastClubAction(input: unknown): Promise<RoastClubResult> {
  // Owner off switch: anything but exactly "true" silences Roast Club for everyone.
  if (!roastClubEnabled(process.env.ROAST_CLUB_ENABLED)) return { status: "unsupported" };
  try {
    return await roastClubConsent(await supabaseServer(), input);
  } catch {
    return { status: "unavailable" };
  }
}
