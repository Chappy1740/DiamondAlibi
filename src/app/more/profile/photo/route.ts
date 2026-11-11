import { profilePhotoBucket, profilePhotoPath } from "@/lib/profile-photo";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return new Response(null, { status: 401, headers });
  const notFound = () => new Response(null, { status: 404, headers });
  const rosterId = new URL(request.url).searchParams.get("player");
  let target = user.id;
  if (rosterId !== null) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rosterId)) return notFound();
    const { data: player, error: playerError } = await client.from("team_players")
      .select("user_id").eq("id", rosterId).maybeSingle();
    if (playerError || !player?.user_id) return notFound();
    target = player.user_id;
    if (target !== user.id) {
      // Membership RLS only exposes teams where the viewer is active.
      // Check it on every request before touching the Storage CDN.
      const { data: shared, error: membershipError } = await client.from("team_memberships")
        .select("team_id").eq("user_id", target).eq("active", true).limit(1).maybeSingle();
      if (membershipError || !shared) return notFound();
    }
  }
  const { data: photo } = await client.storage.from(profilePhotoBucket)
    .download(profilePhotoPath(target), {}, { cache: "no-store" });
  if (!photo) return notFound();
  return new Response(photo, { headers: { ...headers, "Content-Type": "image/jpeg" } });
}
