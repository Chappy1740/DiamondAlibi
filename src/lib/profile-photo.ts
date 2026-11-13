import { profilePhotoMaxBytes } from "../../supabase/functions/_shared/profile-photo";
export { profilePhotoBucket, profilePhotoDownloadOptions, profilePhotoMaxBytes, profilePhotoPath, rosterPhotoId } from "../../supabase/functions/_shared/profile-photo";

export async function isProfilePhoto(file: File) {
  if (file.type !== "image/jpeg" || file.size < 4 || file.size > profilePhotoMaxBytes) return false;
  const [start, end] = await Promise.all([
    file.slice(0, 3).arrayBuffer(),
    file.slice(-2).arrayBuffer(),
  ]);
  const head = new Uint8Array(start);
  const tail = new Uint8Array(end);
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
    && tail[0] === 0xff && tail[1] === 0xd9;
}
