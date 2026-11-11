"use client";

import { useState } from "react";
import { profileInitials } from "../lib/player-profile";

export function RosterPhoto({ playerId, name }: { playerId: string | null; name: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className="avatar roster-photo" aria-hidden="true">
      {profileInitials(name)}
      {playerId && (
        <img src={`/more/profile/photo?player=${encodeURIComponent(playerId)}`}
          loading="lazy" alt="" style={{ visibility: loaded ? "visible" : "hidden" }}
          onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
      )}
    </span>
  );
}
