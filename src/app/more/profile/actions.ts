"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { hasVerifiedPlayerContact } from "@/lib/complete-player-signup";
import { isProfilePhoto, profilePhotoBucket, profilePhotoPath } from "@/lib/profile-photo";

export type ProfilePhotoResult = { error?: string; message?: string };

export async function changeProfilePhoto(form: FormData): Promise<ProfilePhotoResult> {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !hasVerifiedPlayerContact(user)) {
    return { error: "Verify your email or mobile number and sign in to save a photo." };
  }
  const storage = client.storage.from(profilePhotoBucket);
  const path = profilePhotoPath(user.id);

  if (form.get("photo_action") === "remove") {
    const { error } = await storage.remove([path]);
    return error ? { error: "Could not remove your photo. Try again." } : { message: "Photo removed." };
  }
  const file = form.get("photo");
  if (form.get("photo_action") !== "save" || !(file instanceof File) || !(await isProfilePhoto(file))) {
    return { error: "Choose a valid photo and try again." };
  }
  const { error: uploadError } = await storage.upload(path, file, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "0",
  });
  return uploadError ? { error: "Could not save your photo. Try again." } : { message: "Photo saved." };
}
