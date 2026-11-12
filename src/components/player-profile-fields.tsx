import { fieldingPositions, playLevels, profileNameLimit, type PlayerDetails } from "@/lib/player-profile";

export function PlayerProfileFields({ details }: { details?: PlayerDetails | null }) {
  return (
    <>
      <label>
        What name do you go by?
        <input name="nickname" autoComplete="nickname" maxLength={profileNameLimit} required
          defaultValue={details?.nickname ?? ""} />
      </label>
      <label>
        What level of slow-pitch do you play? (optional)
        <select name="play_level" defaultValue={details?.play_level ?? ""}>
          <option value="">Choose a level</option>
          {playLevels.map((level) => <option key={level}>{level}</option>)}
        </select>
      </label>
      <label>
        What’s your favorite fielding position? (optional)
        <select name="fielding_position" defaultValue={details?.fielding_position ?? ""}>
          <option value="">Choose a position</option>
          {fieldingPositions.map((position) => <option key={position}>{position}</option>)}
        </select>
      </label>
    </>
  );
}
