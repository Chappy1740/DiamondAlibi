import { ClubForm } from "./club-form";
export type RosterPlayer = {
  id: string;
  display_name: string;
  is_guest: boolean;
};
export function TeamRoster({
  team,
  players,
  playerInvitesAvailable,
}: {
  team: string;
  players: RosterPlayer[];
  playerInvitesAvailable: boolean;
}) {
  return (
    <section aria-label="Team roster">
      <h3>Roster</h3>
      <p className="muted">
        Everyone listed is a team player. An account is optional. Add players
        now; invite them to link an account when they are ready.
      </p>
      <ul className="roster-list regular-roster">
        {players.map((player) => (
          <li key={player.id}>
            <div className="roster-player-heading">
              <strong>{player.display_name}</strong>
              <span className="badge">
                {player.is_guest ? "No account" : "Account linked"}
              </span>
            </div>
            {player.is_guest && playerInvitesAvailable && (
              <ClubForm
                operation="create-player-invite"
                team={team}
                hidden={{ player: player.id }}
                label={`Create membership invite for ${player.display_name}`}
                confirmation={`Create a private membership invite for ${player.display_name}? The person who redeems it while signed in will link this player and gain team access, including scoring. Share it only with ${player.display_name}.`}
              />
            )}
          </li>
        ))}
      </ul>
      {!playerInvitesAvailable && (
        <p className="muted">
          Player account linking is unavailable right now. You can still add
          players and record their games.
        </p>
      )}
      <ClubForm operation="guest" team={team} label="Add player">
        <label>
          Player name
          <input name="name" maxLength={40} required />
        </label>
      </ClubForm>
    </section>
  );
}

export type TeamInvite = {
  id: string;
  expires_at: string;
  revoked_at: string | null;
  uses: number;
  max_uses: number;
};
export type PlayerInvite = { invite_id: string; player_id: string };
export function TeamInvitations({
  team,
  players,
  invites,
  playerInvites,
  playerInvitesAvailable,
}: {
  team: string;
  players: RosterPlayer[];
  invites: TeamInvite[];
  playerInvites: PlayerInvite[];
  playerInvitesAvailable: boolean;
}) {
  const linkedPlayers = new Map(
    playerInvites.map((link) => [
      link.invite_id,
      players.find((p) => p.id === link.player_id)?.display_name ??
        "Roster player",
    ]),
  );
  return (
    <section
      className="card detail-card team-invitations"
      aria-label="Private team invitations"
    >
      <h2>Private invitations</h2>
      <p className="muted">
        Codes expire in seven days. Share manually only with the intended
        teammate. Raw codes are shown once, never stored here.
      </p>
      <p className="muted">
        For an existing player, use Create membership invite beside their roster
        entry. It links their account to the same player and keeps their stats
        and BEVs. Each player invitation is for one account.
      </p>
      {!playerInvitesAvailable && (
        <p role="status">
          Player-specific invitation details are unavailable. Refresh before
          inviting an existing roster player.
        </p>
      )}
      <details>
        <summary>Invite someone not on the roster</summary>
        <p>
          This general invite adds a new player record. Use a player-specific
          invite for someone already listed.
        </p>
        <ClubForm
          operation="create-invite"
          team={team}
          label="Create invite code"
        >
          <label>
            Maximum joins
            <input
              name="maxUses"
              type="number"
              min={1}
              max={100}
              defaultValue={10}
              required
            />
          </label>
        </ClubForm>
      </details>
      {invites.map((invite) => (
        <div className="invite-row" key={invite.id}>
          <p>
            {linkedPlayers.has(invite.id)
              ? `Player membership invite: ${linkedPlayers.get(invite.id)}`
              : playerInvitesAvailable
                ? "New teammate invitation"
                : "Membership invitation"}{" "}
            · {invite.uses}/{invite.max_uses} uses ·{" "}
            {invite.revoked_at
              ? "Revoked"
              : new Date(invite.expires_at) < new Date()
                ? "Expired"
                : invite.uses >= invite.max_uses
                  ? "Used"
                  : `Expires ${new Date(invite.expires_at).toISOString().slice(0, 10)}`}
          </p>
          {!invite.revoked_at && (
            <ClubForm
              operation="revoke-invite"
              team={team}
              hidden={{ invite: invite.id }}
              label="Revoke this invite"
              confirmation="Revoke this invitation? It will no longer allow anyone to join. Existing memberships stay unchanged."
            />
          )}
        </div>
      ))}
    </section>
  );
}
