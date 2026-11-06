export const playLevels = [
  "New to softball", "Recreational league", "Competitive league (unclassified)",
  "Class E", "Class D", "Class C", "Class B", "Class A", "Class AA", "Major",
  "Other classification", "Not sure",
] as const;

export const fieldingPositions = [
  "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", "Shortstop",
  "Left Field", "Left Center", "Center Field", "Right Center", "Right Field",
  "No Preference",
] as const;

export const profileNameLimit = 40;

export function playerDetails(name: unknown, level: unknown, position: unknown) {
  const nickname = typeof name === "string" ? name.trim() : "";
  if (!nickname || nickname.length > profileNameLimit) return null;
  const play_level = optionalChoice(level, playLevels);
  const fielding_position = optionalChoice(position, fieldingPositions);
  if (play_level === undefined || fielding_position === undefined) return null;
  return { nickname, play_level, fielding_position };
}

function optionalChoice<T extends string>(value: unknown, choices: readonly T[]) {
  return value == null || value === "" ? null : choices.find((choice) => choice === value);
}

export type PlayerDetails = NonNullable<ReturnType<typeof playerDetails>>;

export function signupDetails(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const values = metadata as Partial<Record<keyof PlayerDetails, unknown>>;
  return playerDetails(values.nickname, values.play_level, values.fielding_position);
}

export function profileArguments(details: PlayerDetails) {
  return {
    p_nickname: details.nickname,
    p_play_level: details.play_level,
    p_fielding_position: details.fielding_position,
  };
}

export function profileInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "").join("").toUpperCase() || "P";
}
