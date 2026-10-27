// A wall-clock time belongs to the venue's zone, never the viewer's device zone.
export const START_TIME_ZONES = [
  ["America/Chicago", "Central"],
  ["America/New_York", "Eastern"],
  ["America/Denver", "Mountain"],
  ["America/Phoenix", "Arizona"],
  ["America/Los_Angeles", "Pacific"],
  ["America/Anchorage", "Alaska"],
  ["Pacific/Honolulu", "Hawaii"],
  ["UTC", "UTC"],
] as const;
export function validStartTime(time: unknown, zone: unknown): boolean {
  return (
    (time === null ||
      (typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) &&
    START_TIME_ZONES.some(([id]) => id === zone)
  );
}
export type TournamentStartTime = {
  firstGameTime?: string | null;
  firstGameZone?: string | null;
};
export function tournamentStartLabel(
  tournament: TournamentStartTime,
): string | null {
  const time = tournament.firstGameTime;
  if (!time || !validStartTime(time, tournament.firstGameZone)) return null;
  const [hour, minute] = time.split(":").map(Number);
  const zone = START_TIME_ZONES.find(
    ([id]) => id === tournament.firstGameZone,
  )!;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"} ${zone[1]}`;
}
