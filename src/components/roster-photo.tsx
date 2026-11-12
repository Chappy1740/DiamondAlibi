"use client";

import { useState } from "react";
import { profileInitials } from "../lib/player-profile";

export function RosterPhoto({ playerId, name }: { playerId: string | null; name: string }) {
  const [loadedPlayerId, setLoadedPlayerId] = useState<string | null>(null);
  return (
    <span className="avatar roster-photo" data-initials={profileInitials(name)} aria-hidden="true">
      {playerId && (
        <img key={playerId} src={`/more/profile/photo?player=${encodeURIComponent(playerId)}`}
          loading="lazy" alt="" style={{ visibility: loadedPlayerId === playerId ? "visible" : "hidden" }}
          onLoad={() => setLoadedPlayerId(playerId)} onError={() => setLoadedPlayerId(null)} />
      )}
    </span>
  );
}

export function RosterName({ playerId, name }: { playerId: string | null; name: string }) {
  return <span className="roster-name">
    <RosterPhoto playerId={playerId} name={name} />
    <span>{name}</span>
  </span>;
}
