import { profilePhotoBucket, profilePhotoPath } from "@/lib/profile-photo";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return new Response(null, { status: 401, headers });
  const { data: photo } = await client.storage.from(profilePhotoBucket)
    .download(profilePhotoPath(user.id), {}, { cache: "no-store" });
  if (!photo) return new Response(null, { status: 404, headers });
  return new Response(photo, { headers: { ...headers, "Content-Type": "image/jpeg" } });
}
