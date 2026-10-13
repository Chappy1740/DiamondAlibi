import type { Outcome } from "./scoring.ts";

type Player = { id: string; display_name: string };
const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[.,!?]/g, "").trim().replace(/\s+/g, " ");
const words: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4 };
const aliases: [Outcome, string[]][] = [
  ["ITP HR", ["inside the park home run", "inside-the-park home run", "inside the park hr", "itp hr"]],
  ["Fence HR", ["fence home run", "fence hr", "home run", "hr"]],
  ["Hit", ["hit"]], ["BB", ["walk", "bb"]], ["HBP", ["hit by pitch", "hbp"]],
  ["K", ["strikeout", "strike out", "k"]], ["Out", ["out"]],
  ["SF", ["sacrifice fly", "sac fly", "sf"]], ["ROE", ["reached on error", "error", "roe"]],
];
export function parseNamedPlay(text: string, roster: Player[], fallbackPlayer?: string) {
  const fail = (message: string) => ({ status: "invalid" as const, message });
  if (text.length > 200) return fail("Keep the result under 200 characters.");
  let phrase = normalized(text), runs: number | undefined, rbi: number | undefined;
  let duplicate = false;
  phrase = phrase.replace(/\b(\d+|zero|one|two|three|four)\s+(runs?|rbis?)\b/g, (_, raw: string, type: string) => {
    const value = words[raw] ?? Number(raw);
    if (type.startsWith("rbi")) { if (rbi !== undefined) duplicate = true; rbi = value; }
    else { if (runs !== undefined) duplicate = true; runs = value; }
    return "";
  }).trim().replace(/\s+/g, " ");
  if (duplicate || [runs, rbi].some(value => value !== undefined && (!Number.isInteger(value) || value < 0 || value > 4))) return fail("Use one runs count and one RBI count, each from 0 to 4.");
  const choices = aliases.flatMap(([outcome, names]) => names.map(name => ({ outcome, name }))).sort((a, b) => b.name.length - a.name.length);
  const choice = choices.find(({ name }) => phrase === name || phrase.endsWith(` ${name}`));
  if (!choice) return fail("Say a player and a supported result, such as ‘Alex hit’ or ‘Alex home run two RBI’.");
  const name = phrase.slice(0, phrase.length - choice.name.length).trim();
  let players = name ? roster.filter(player => normalized(player.display_name) === name) : roster.filter(player => player.id === fallbackPlayer);
  if (name && !players.length) players = roster.filter(player => normalized(player.display_name).split(" ")[0] === name);
  if (players.length !== 1) return fail(players.length > 1 ? "That name matches more than one player. Use the full roster name." : "Choose an existing team player or use their roster name.");
  const hr = choice.outcome === "Fence HR" || choice.outcome === "ITP HR";
  const finalRbi = rbi ?? (hr ? 1 : 0), finalRuns = runs ?? Math.max(finalRbi, hr ? 1 : 0);
  if (finalRbi > finalRuns || (hr && finalRuns < 1)) return fail("RBI cannot exceed runs, and a home run must score at least one run.");
  return { status: "ok" as const, playerId: players[0].id, outcome: choice.outcome, runs: finalRuns, rbi: finalRbi };
}
