"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { profileInitials } from "@/lib/player-profile";
import { profilePhotoState, resetProfilePhotoState, subscribeProfilePhotoChange } from "@/lib/profile-photo-events";

type Status = "loading" | "ready" | "missing";

// The signed-in user's own photo from the authenticated, no-store endpoint. The generic icon
// shows until the photo has loaded and whenever there is none. The version only changes when
// the profile form reports a save or removal, so a rerender never repeats the request. Each
// header mount starts from the latest shared state, so a photo removed on one page stays
// removed on the next page of the same tab.
export function ProfileAvatar({ signedIn, name }: { signedIn: boolean; name?: string }) {
  const [view, setView] = useState<{ version: number; status: Status }>(() => {
    const { revision, removed } = profilePhotoState();
    return { version: revision, status: removed ? "missing" : "loading" };
  });
  const photo = useRef<HTMLImageElement>(null);
  const { version, status } = view;

  useEffect(() => {
    if (!signedIn) {
      resetProfilePhotoState();
      return;
    }
    return subscribeProfilePhotoChange((change) => {
      const { revision } = profilePhotoState();
      setView({ version: revision, status: change === "saved" ? "loading" : "missing" });
    });
  }, [signedIn]);

  // The server-rendered image can finish before hydration, so read its result directly.
  useEffect(() => {
    const image = photo.current;
    if (!image?.complete) return;
    setView((current) => current.version !== version ? current
      : { version, status: image.naturalWidth > 0 ? "ready" : "missing" });
  }, [version, signedIn]);

  const fallback = name
    ? <span aria-hidden="true">{profileInitials(name)}</span>
    : <UserRound size={22} aria-hidden />;
  if (!signedIn || status === "missing") return fallback;
  return (
    <>
      {status !== "ready" && fallback}
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

export function OwnProfileName({ name, suffix = "" }: { name: string; suffix?: string }) {
  return <span className="roster-name">
    <span className="avatar roster-photo" aria-hidden="true">
      <ProfileAvatar signedIn name={name} />
    </span>
    <span>{name}{suffix}</span>
  </span>;
}
