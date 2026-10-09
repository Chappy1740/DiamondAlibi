// Synthetic fixtures only. No real accounts, team records, or credentials.
export const teams = ["Northwest Alibis", "Weekend Warriors"] as const;
export const seasons = ["Fall 2026", "Summer 2026"] as const;
export type Scope = "League" | "Tournament" | "Overall";
export type Scenario =
  | "Game day"
  | "Multiple live games"
  | "Upcoming only"
  | "Completed"
  | "No team"
  | "Empty season"
  | "Guest";
export type Connection =
  | "Connected"
  | "Loading"
  | "Offline"
  | "Reconnecting"
  | "Error"
  | "Conflict"
  | "Save pending"
  | "Save failed"
  | "Success";
export const scenarios: Scenario[] = [
  "Game day",
  "Multiple live games",
  "Upcoming only",
  "Completed",
  "No team",
  "Empty season",
  "Guest",
];
export const connections: Connection[] = [
  "Connected",
  "Loading",
  "Offline",
  "Reconnecting",
  "Error",
  "Conflict",
  "Save pending",
  "Save failed",
  "Success",
];
export const sampleStats: Record<
  Scope,
  { obp: string; reach: string; games: number }
> = {
  League: { obp: ".600", reach: ".650", games: 8 },
  Tournament: { obp: ".500", reach: ".550", games: 3 },
  Overall: { obp: ".571", reach: ".621", games: 11 },
};
export const samplePlayers = [
  { name: "Alex R.", balance: 4 },
  { name: "Jordan K.", balance: 2 },
  { name: "You", balance: -2 },
  { name: "Morgan T.", balance: -3 },
];
