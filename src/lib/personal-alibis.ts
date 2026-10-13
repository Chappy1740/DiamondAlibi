export const ALIBI_CATEGORIES = ["New Gear", "At Home", "Bad Plays", "Team Shenanigans"] as const;
export type AlibiCategory = typeof ALIBI_CATEGORIES[number];
export type PersonalAlibi = {
  id: string; title: string; body: string; category: AlibiCategory;
  revision: number; updated_at: string;
};
export type AlibiPage = { status: "ok"; items: PersonalAlibi[]; hasMore: boolean }
  | { status: "setup-required" | "auth-required" | "unavailable" };
export type AlibiResult = { status: "saved"; item: PersonalAlibi }
  | { status: "deleted" | "conflict" | "invalid" | "auth-required" | "unavailable" | "uncertain" | "setup-required" };
export const ALIBI_PHRASES: Record<AlibiCategory, string[]> = {
  "New Gear": ["No dear, I have had this bat for years.", "What do you mean I have enough bats? Don't you have enough shoes?"],
  "At Home": ["I was checking the weather. For the entire game.", "I said one more inning. I never said which inning."],
  "Bad Plays": ["The sun was in my eyes. Yes, under the lights.", "That wasn't a missed catch. It was a ground inspection."],
  "Team Shenanigans": ["That was a team-building exercise with unusually bad timing.", "We were testing the mercy rule. Very thoroughly."],
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type AlibiClient = {
  auth: { getUser(): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }> };
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};
export async function personalAlibiCommand(client: AlibiClient, input: unknown): Promise<AlibiResult> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { status: "invalid" };
  const r = input as Record<string, unknown>;
  const save = r.action === "save";
  const allowed = save ? ["action", "id", "commandId", "revision", "title", "body", "category"] : ["action", "id", "revision"];
  if ((!save && r.action !== "delete") || Object.keys(r).some((key) => !allowed.includes(key)) ||
    typeof r.id !== "string" || !uuid.test(r.id) || !Number.isSafeInteger(r.revision) || Number(r.revision) < 0 || Number(r.revision) >= 2147483647 ||
    (save && (typeof r.commandId !== "string" || !uuid.test(r.commandId) || typeof r.title !== "string" || r.title.trim().length > 80 ||
      typeof r.body !== "string" || !r.body.trim() || r.body.length > 4000 || !ALIBI_CATEGORIES.includes(r.category as AlibiCategory)))) return { status: "invalid" };
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { status: "auth-required" };
  } catch { return { status: "unavailable" }; }
  try {
    const result = await client.rpc(save ? "da_save_personal_alibi" : "da_delete_personal_alibi", {
      p_id: r.id, p_expected: r.revision,
      ...(save ? { p_command: r.commandId, p_title: (r.title as string).trim(), p_body: (r.body as string).trim(), p_category: r.category } : {}),
    });
    if (result.error) {
      if (["PGRST202", "PGRST205", "42P01", "42883"].includes(result.error.code ?? "")) return { status: "setup-required" };
      if (result.error.code === "42501") return { status: "auth-required" };
      if (["22023", "22P02", "23514"].includes(result.error.code ?? "")) return { status: "invalid" };
      return { status: "uncertain" };
    }
    const receipt = result.data as { status?: string; item?: PersonalAlibi } | null;
    if (receipt?.status === "saved" && receipt.item) return { status: "saved", item: receipt.item };
    if (receipt?.status === "deleted" || receipt?.status === "conflict") return { status: receipt.status };
    return { status: "uncertain" };
  } catch { return { status: "uncertain" }; }
}
