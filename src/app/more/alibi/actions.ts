"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { personalAlibiCommand, type AlibiPage, type AlibiResult, type PersonalAlibi } from "@/lib/personal-alibis";

export async function alibiAction(input: unknown): Promise<AlibiResult> {
  try { return await personalAlibiCommand(await supabaseServer(), input); }
  catch { return { status: "unavailable" }; }
}
export async function loadPersonalAlibis(offset = 0): Promise<AlibiPage> {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return { status: "unavailable" };
  try {
    const client = await supabaseServer();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { status: "auth-required" };
    const { data, error } = await client.from("personal_alibis")
      .select("id,title,body,category,revision,updated_at").eq("user_id", user.id)
      .order("updated_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 49);
    if (error) return { status: ["PGRST205", "42P01"].includes(error.code) ? "setup-required" : "unavailable" };
    return { status: "ok", items: (data ?? []) as PersonalAlibi[], hasMore: data?.length === 50 };
  } catch { return { status: "unavailable" }; }
}
