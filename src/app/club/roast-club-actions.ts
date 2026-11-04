"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { roastClubConsent, type RoastClubResult } from "@/lib/roast-club-consent";

/** The session client supplies identity; database functions enforce membership and ownership. */
export async function roastClubAction(input: unknown): Promise<RoastClubResult> {
  try {
    return await roastClubConsent(await supabaseServer(), input);
  } catch {
    return { status: "unavailable" };
  }
}
