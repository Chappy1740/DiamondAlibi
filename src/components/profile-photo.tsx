"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { changeProfilePhoto, type ProfilePhotoResult } from "@/app/more/profile/actions";
import { profileInitials } from "@/lib/player-profile";
import { profilePhotoMaxBytes } from "@/lib/profile-photo";

const maxSourceBytes = 20 * 1024 * 1024;

async function preparePhoto(source: File) {
  if (!source.size || source.size > maxSourceBytes) throw new Error("Choose a photo under 20 MB.");
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(512, size);
    const context = canvas.getContext("2d");
    if (!context || !size) throw new Error("Image unavailable");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2,
      size, size, 0, 0, canvas.width, canvas.height);
    const photo = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!photo || photo.type !== "image/jpeg" || photo.size > profilePhotoMaxBytes) throw new Error("Image unavailable");
    return photo;
  } catch {
    throw new Error("This photo couldn’t be opened. Choose another photo or a JPEG copy.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfilePhoto({ name }: { name: string }) {
  const [preview, setPreview] = useState<{ photo: Blob; url: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [loadedVersion, setLoadedVersion] = useState(-1);
  const [version, setVersion] = useState(0);
  const hasPhoto = loadedVersion === version;
  const [result, submit, pending] = useActionState<ProfilePhotoResult, FormData>(
    async (_previous, form) => {
      if (form.get("photo_action") === "save" && preview) {
        form.set("photo", preview.photo, "avatar.jpg");
      }
      const response = await changeProfilePhoto(form);
      if (!response.error) {
        setPreview(null);
        setVersion((current) => current + 1);
      }
      return response;
    },
    {},
  );

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    event.currentTarget.value = "";
    setPhotoError("");
    setPreview(null);
    setProcessing(true);
    try {
      const photo = await preparePhoto(file);
      setPreview({ photo, url: URL.createObjectURL(photo) });
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not preview this photo.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="club-form" action={submit}>
      <div className="avatar profile-photo">
        {!hasPhoto && !preview && <span role="img" aria-label="Profile initials">{profileInitials(name)}</span>}
        <img key={version} src={`/more/profile/photo?v=${version}`} alt="Your profile photo"
          hidden={!hasPhoto || !!preview} onLoad={() => setLoadedVersion(version)}
          onError={() => setLoadedVersion(-1)} />
        {preview && <img src={preview.url} alt="Profile photo preview" />}
      </div>
      <label>
        Choose a photo (optional)
        <input type="file" accept="image/*" onChange={choosePhoto} disabled={processing || pending} />
      </label>
      <p className="muted">Members of your active teams can see your photo.</p>
      {processing && <p role="status">Preparing preview…</p>}
      {preview && <p>Preview before saving.</p>}
      {(photoError || result.error) && <p role="alert" className="form-error">{photoError || result.error}</p>}
      {result.message && <p role="status" className="form-message">{result.message}</p>}
      {preview && <>
        <button className="button secondary" name="photo_action" value="save" disabled={pending}>
          {pending ? "Saving…" : "Save photo"}
        </button>
        <button className="button secondary" type="button" onClick={() => setPreview(null)} disabled={pending}>
          Cancel preview
        </button>
      </>}
      {hasPhoto && !preview && <button className="button secondary" name="photo_action" value="remove"
        disabled={processing || pending}>
        {pending ? "Removing…" : "Remove photo"}
      </button>}
    </form>
  );
}
