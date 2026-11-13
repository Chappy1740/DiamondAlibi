import { profilePhotoBucket, profilePhotoDownloadOptions, profilePhotoPath, rosterPhotoId } from "@/lib/profile-photo";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const client = await supabaseServer();
  const notFound = () => new Response(null, { status: 404, headers });
  const image = (photo: Blob) => new Response(photo, { headers: { ...headers, "Content-Type": "image/jpeg" } });
  const rosterId = new URL(request.url).searchParams.get("player");
  if (rosterId !== null) {
    if (!rosterPhotoId.test(rosterId)) return notFound();
    const { data: photo, error, response } = await client.functions.invoke<Blob>("teammate-photo", { body: { player: rosterId } });
    if (response?.status === 401) return new Response(null, { status: 401, headers });
    return !error && photo instanceof Blob ? image(photo) : notFound();
  }

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return new Response(null, { status: 401, headers });
  const { data: photo } = await client.storage.from(profilePhotoBucket)
    .download(profilePhotoPath(user.id), profilePhotoDownloadOptions(), { cache: "no-store" });
  return photo ? image(photo) : notFound();
}
