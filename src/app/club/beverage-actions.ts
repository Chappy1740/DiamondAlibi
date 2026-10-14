"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { teamBeverage, type BeverageResult } from "@/lib/team-beverage";
export async function beverageAction(input: unknown): Promise<BeverageResult> {
  try {
    return await teamBeverage(await supabaseServer(), input);
  } catch {
    return { status: "unavailable" };
  }
}
