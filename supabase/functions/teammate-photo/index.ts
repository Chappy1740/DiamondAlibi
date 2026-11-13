import { createClient } from "@supabase/supabase-js";
import { profilePhotoBucket, profilePhotoDownloadOptions, profilePhotoMaxBytes, profilePhotoPath, rosterPhotoId } from "../_shared/profile-photo.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

function defaultKey(variable: string, legacyVariable: string) {
  const keys = Deno.env.get(variable);
  if (keys) {
    const key: unknown = JSON.parse(keys)?.default;
    if (typeof key === "string" && key) return key;
  }
  return Deno.env.get(legacyVariable);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405, headers });

  const authorization = request.headers.get("Authorization") ?? "";
  const token = /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/i.exec(authorization)?.[1];
  if (!token) return new Response(null, { status: 401, headers });

  const missing = () => new Response(null, { status: 404, headers });
  const input: unknown = await request.json().catch(() => null);
  const player = (input as { player?: unknown } | null)?.player;
  if (typeof player !== "string" || !rosterPhotoId.test(player)) return missing();

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = defaultKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
    if (!url || !key) return new Response(null, { status: 503, headers });
    const viewer = createClient(url, key, { auth, global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await viewer.auth.getUser(token);
    if (authError || !user) return new Response(null, { status: 401, headers });

    const { data: roster, error: rosterError } = await viewer.from("team_players")
      .select("user_id,is_guest").eq("id", player).maybeSingle();
    if (rosterError || roster?.is_guest || !roster?.user_id || !rosterPhotoId.test(roster.user_id)) return missing();

    // Membership RLS limits the rows to teams the viewer is still active on.
    const { data: shared, error: membershipError } = await viewer.from("team_memberships")
      .select("team_id").eq("user_id", roster.user_id).eq("active", true).limit(1).maybeSingle();
    if (membershipError || !shared) return missing();

    // Use the privileged client only to fetch this fixed avatar after authorization.
    const secret = defaultKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
    if (!secret) return new Response(null, { status: 503, headers });
    const storage = createClient(url, secret, { auth }).storage.from(profilePhotoBucket);
    const { data: photo, error: photoError } = await storage.download(
      profilePhotoPath(roster.user_id), profilePhotoDownloadOptions(), { cache: "no-store" },
    );
    if (photoError || !photo || !photo.size || photo.size > profilePhotoMaxBytes || photo.type !== "image/jpeg") return missing();
    return new Response(photo, { headers: { ...headers, "Content-Type": "application/octet-stream" } });
  } catch {
    return new Response(null, { status: 503, headers });
  }
});
