"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { subscribeProfilePhotoChange } from "@/lib/profile-photo-events";

type Status = "loading" | "ready" | "missing";

// The signed-in user's own photo from the authenticated, no-store endpoint. The generic icon
// shows until the photo has loaded and whenever there is none. The version only changes when
// the profile form reports a save, so a rerender never repeats the request.
export function ProfileAvatar({ signedIn }: { signedIn: boolean }) {
  const [view, setView] = useState<{ version: number; status: Status }>({ version: 0, status: "loading" });
  const photo = useRef<HTMLImageElement>(null);
  const { version, status } = view;

  useEffect(() => {
    if (!signedIn) return;
    return subscribeProfilePhotoChange((change) => {
      setView((current) => change === "saved"
        ? { version: current.version + 1, status: "loading" }
        : { version: current.version, status: "missing" });
    });
  }, [signedIn]);

  // The server-rendered image can finish before hydration, so read its result directly.
  useEffect(() => {
    const image = photo.current;
    if (!image?.complete) return;
    setView((current) => current.version !== version ? current
      : { version, status: image.naturalWidth > 0 ? "ready" : "missing" });
  }, [version, signedIn]);

  if (!signedIn || status === "missing") return <UserRound size={22} aria-hidden />;
  return (
    <>
      {status !== "ready" && <UserRound size={22} aria-hidden />}
      <img
        ref={photo}
        key={version}
        className="profile-avatar-photo"
        src={`/more/profile/photo?v=${version}`}
        alt=""
        aria-hidden
        hidden={status !== "ready"}
        onLoad={() => setView((current) => current.version === version ? { version, status: "ready" } : current)}
        onError={() => setView((current) => current.version === version ? { version, status: "missing" } : current)}
      />
    </>
  );
}
