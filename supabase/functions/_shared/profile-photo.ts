export const profilePhotoBucket = "da-player-profile-photos";
export const profilePhotoMaxBytes = 512 * 1024;
export const rosterPhotoId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function profilePhotoPath(userId: string) {
  return `${userId}/avatar.jpg`;
}

export function profilePhotoDownloadOptions() {
  // The Storage CDN can serve the previous bytes after an upload or deletion.
  return { cacheNonce: crypto.randomUUID() };
}
