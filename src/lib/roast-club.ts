/**
 * Roast Club — presentation-only decision logic. Performs no I/O, no scoring, and no
 * authorization. It decides whether a clean, curated line MAY be shown for a confirmed
 * scoring event. Every doubt resolves to "say nothing" (fail closed).
 *
 * Consent is supplied by the caller from a server-authoritative store. This module never
 * infers, defaults, or caches consent beyond the map it is handed.
 */
import { OUTCOMES, type Outcome } from "./scoring.ts";

export type RoastCategory =
  | "1B"
  | "2B"
  | "3B"
  | "HR"
  | "ITP HR"
  | "K"
  | "K Swinging"
  | "K Looking"
  | "SOFO"
  | "DP"
  | "OUT"
  | "BB"
  | "SF"
  | "E"
  | "OVER-LIMIT HR";

/** Roast Club is OFF unless a caller explicitly enables it. */
export type RoastSettings = { enabled: boolean };
export const DEFAULT_ROAST_SETTINGS: RoastSettings = { enabled: false };

/**
 * Explicit mapping for every stored outcome value (not UI labels). `null` means no roast:
 * a plain "Hit" is a single and uses the single lines; "HBP" does not exist in slowpitch and is removed from new entry, so it stays silent. A new outcome added to
 * OUTCOMES fails typecheck here until it is deliberately mapped.
 */
export const ROAST_CATEGORY_BY_OUTCOME: Record<Outcome, RoastCategory | null> = {
  Hit: "1B",
  "1B": "1B",
  "2B": "2B",
  "3B": "3B",
  BB: "BB",
  HBP: null,
  ROE: "E",
  K: "K",
  "K Looking": "K Looking",
  "K Swinging": "K Swinging",
  SOFO: "SOFO",
  DP: "DP",
  Out: "OUT",
  SF: "SF",
  "Fence HR": "HR",
  "ITP HR": "ITP HR",
};

/**
 * Curated clean catalog (8 lines per category, 10 for over-limit HR; adult-league humor). `{name}` is replaced with a
 * sanitized display name of an opted-in batter only. Humor targets softball performance,
 * never the person. Keep every line safe for work and speakable (short).
 */
export const ROAST_CATALOG: Record<RoastCategory, readonly string[]> = {
  "1B": [
    "{name} singles. Don't worry, the beer cooler isn't going anywhere, and neither is that runner past first.",
    "{name} hits a single. That's the fastest anything has moved on that bench since the third inning.",
    "A single for {name}! Quick, somebody hand them a cold one and a participation ribbon.",
    "{name} pokes a single, then spends the next pitch catching their breath on first base.",
    "{name} reaches first on a hit. The ball had better wheels than the runner will.",
    "Single for {name}. Last night's choices did not hurt the swing. Just the legs.",
    "{name} slaps a single, and the whole bench pretends they saw it coming.",
    "{name} singles and looks at the dugout like they just won the lottery. It was one base, champ.",
  ],
  "2B": [
    "{name} stretches it into a double. The defense watched, mostly because they were also tired.",
    "A double for {name}! The slide was optional, the dirt on the jersey is forever.",
    "{name} hustles into second. By hustle we mean controlled falling forward.",
    "{name} doubles, then wheezes at second like it was a marathon. It was sixty feet.",
    "Double for {name}! Whatever they drank before the game, it wasn't enough to slow the bat.",
    "{name} makes it to second with a lead on the ball by about two inches. Cardio is a myth.",
    "{name} hits a double, then asks for a pinch runner on second. Bold move.",
    "A double for {name}! The outfielder forgot the ball and remembered their feelings.",
  ],
  "3B": [
    "{name} hits a triple! A very slow, very dramatic triple.",
    "A triple for {name}. By third base they'd forgotten how they got there. Classic.",
    "{name} chugs into third. The ball got there first, the umpire felt sorry for them.",
    "Triple for {name}! The outfield needed a search party and a better attitude.",
    "{name} triples, and the third base coach just started a countdown for the collapse.",
    "{name} makes it to third on a hit that took the scenic route. So did the runner.",
    "A triple for {name}! Do not ask how. The ball bounced off a cooler and a dream.",
    "{name} sprints, or what looks like a sprint, for a triple. Please hydrate.",
  ],
  HR: [
    "{name} goes deep! The ball finally left the infield. Great news for the league.",
    "Home run for {name}! Enjoy it. The trot will take longer than the swing.",
    "{name} cranks one out of the park. Everyone stand up. Nobody expected this, least of all the swinger.",
    "A home run for {name}! Even a ball this far gone couldn't outrun last night's decisions.",
    "{name} homers. Frame the scorebook, because the next one is a long way off.",
    "Gone! {name} swung once and the ball left town. The legs will follow by Thursday.",
    "{name} hits a home run and starts the victory lap. It is a slow lap. Very slow.",
    "Home run, {name}! The pitcher's league-night plans just got worse.",
  ],
  "ITP HR": [
    "{name} hits an inside-the-park homer! Nobody has ever seen that much running, or that much panic.",
    "An inside-the-parker for {name}! The defense was busy discovering gravity.",
    "{name} runs out a home run. The ball rolled forever and so did the sprint, barely.",
    "Inside-the-park homer for {name}! The outfield got lost, the runner got lucky.",
    "{name} circles the bases on one hit. Check the pulse. Check the bats. Check the beer count.",
    "{name} legs out an inside-the-parker. A miracle brought to you by a very bad outfield.",
    "{name} goes all the way around. Slowly. Painfully. And somehow safely.",
    "An inside-the-park home run for {name}! The dugout is shouting, mostly from disbelief.",
  ],
  K: [
    "{name} strikes out. The pitcher is lobbing it up there like a gift and still nothing.",
    "Strike three on {name}. The ball moves slower than the lineup and it still got missed.",
    "{name} whiffs. Slowpitch, folks. The one pitch you can see for a week and it's still gone.",
    "Strikeout for {name}! Swinging at a pitch with a hang time like that is almost impressive.",
    "{name} strikes out and heads straight to the cooler. Not judging.",
    "A strikeout for {name}. The ball floated in like a balloon and the balloon won.",
    "{name} fans on a pitch you could read the label on. Let that sink in.",
    "{name} strikes out. The beer is going to be very warm by the time they stop thinking about it.",
  ],
  "K Swinging": [
    "{name} swings and misses. The ball was arcing slower than a Monday morning.",
    "Swinging strike three! {name} missed a pitch with all the speed of a parade float.",
    "{name} whiffed on a pitch a toddler could track. The bat deserves a day off.",
    "{name} took a hack so big the backstop felt a breeze. And hit nothing.",
    "A swinging strikeout for {name}. Last night's judgment is clearly affecting this morning's reflexes.",
    "{name} swings through it. The ball waved as it went by.",
    "{name} cuts the air in half and misses the ball by a country mile.",
    "Strike three swinging. {name} might have hit it if the eyes and the hands were in the same time zone.",
  ],
  "K Looking": [
    "{name} watched strike three float by like it was on a lazy river.",
    "Called strike three on {name}, who stood there like a full cooler. Plenty of beer, no action.",
    "{name} didn't swing at strike three. Possibly the first smart thing they've done all night.",
    "{name} stared at the pitch for a full week and still didn't swing. Party of one.",
    "Strikeout looking for {name}. The ball arrived so slowly it had time to take a nap.",
    "{name} took the called third strike. That's not patience, that's paralysis.",
    "{name} looked at it, thought about it, and forgot what the bat was for.",
    "{name} froze on strike three. The ump had to check for a pulse.",
  ],
  SOFO: [
    "{name} struck out on a foul. Contact! Wrong direction, wrong game, wrong everything.",
    "Foul strike three for {name}. At least the ball hit something. Not the field. Not the point.",
    "{name} fouls out of the at-bat. The ball landed in the parking lot. Probably on a car.",
    "A strikeout on a foul for {name}. The foul ball got more distance than the swing deserved.",
    "{name} fouled it off one too many times. Three strikes, no mercy, no sense.",
    "{name} swings, tips it, and goes down. The catcher is calling it art.",
    "Foul strikeout for {name}. They connected just enough to be embarrassed.",
    "{name} fouled strike three straight into the screen. The fans filed an incident report.",
  ],
  DP: [
    "{name} hits into a double play. Two outs on one swing. Efficiency at its saddest.",
    "A double play for {name}! The defense is thrilled. The bench is composing a sad song.",
    "{name} grounds into two outs. Two for the price of one. The other team is out of cheap beer metaphors.",
    "{name} turns a rally into a funeral. Double play. Everyone back to the dugout.",
    "Double play for {name}! Nothing says league night like killing your own team's momentum.",
    "{name} hits it straight at the shortstop. Two outs. The shortstop was not even trying.",
    "A double play for {name}, who wins MVP of the other team.",
    "{name} grounds into a double play and shrugs. The shrug was the fastest thing on the field.",
  ],
  OUT: [
    "{name} is out. The beer was warm, the swing was cold, the result was inevitable.",
    "{name} makes an out. The glove didn't even have to try.",
    "Out for {name}. They hit it right at someone. It's a talent, really.",
    "{name} makes the easy out. Last night's regrets are showing up on today's batting average.",
    "{name} grounds out. The runner on first should have taken a nap on the way.",
    "{name} is retired. The defense stood there like they were in a photo shoot.",
    "An out for {name}. The bat was there, the ball was there, the skill was on vacation.",
    "{name} hit the ball hard, directly into a glove. The universe has a sense of humor.",
  ],
  BB: [
    "{name} draws a walk. Nothing like a free base for a person who hates swinging.",
    "A walk for {name}! The pitcher missed the plate by about the width of a bad excuse.",
    "{name} takes ball four. A masterclass in letting someone else do all the work.",
    "{name} walks. The pitcher had one job and missed it.",
    "Walk for {name}! The bat never left the shoulder, and neither did the effort.",
    "{name} trots to first, leaving a faint trail of beer and bad decisions.",
    "A walk for {name}. Hit like a champion, run like a person who walks everywhere.",
    "{name} takes a free pass. Their legs are thrilled. Their ego is neutral.",
  ],
  SF: [
    "{name} hits a sacrifice fly. A team player, finally, by accident.",
    "Sac fly for {name}! Gave up an out so someone else could score. Noble, sure, but also an accident.",
    "{name} flies out and drives in a run. The worst swing, the best outcome.",
    "A sacrifice fly for {name}. Not the plan, but the plan was also bad.",
    "{name} lofts a sac fly. The outfielder caught it and the runner scored. Everyone is confused.",
    "{name} makes an out and a run at once. Efficient and unintentionally heroic.",
    "Sacrifice fly, {name}! You took one for the team, then asked for the credit.",
    "{name} gets an RBI on a fly out. We would clap, but nobody believes it.",
  ],
  E: [
    "{name} reaches on an error. Thank the fielder who was somewhere between asleep and overserved.",
    "Error! {name} is on base because the shortstop prioritized the cooler over the ball.",
    "{name} reaches on an error and will immediately claim it as a hit.",
    "The defense dropped it. {name} reaches. The dugout cheers anyway.",
    "{name} hit it and the fielder fumbled it. Teamwork, in the worst sense.",
    "{name} is safe on an error. Sometimes the best swing is the other team's mistake.",
    "Error on the play, {name} safe at first. The fielder blames the sun. It's night.",
    "{name} reaches because somebody out there lost a fight with a ground ball.",
  ],
  "OVER-LIMIT HR": [
    "{name} hit it into another zip code and got an out. Congrats on the longest wasted swing in league history.",
    "Home run limit hit, {name}. The ball left the park, and so did your dignity. Out.",
    "{name} crushed one out of the park and the scorekeeper said sit down. Out. All that power, zero credit.",
    "{name} just hit a 400-foot out. The only thing longer is the line at the beer truck.",
    "The limit is up, so {name}'s moonshot counts as an out. Same swing, same sweat, zero reward.",
    "{name} cleared the fence and the rulebook cleared the base. Out. Next time, pace yourself like a grown-up.",
    "{name} hit a home run so far it entered a different tax bracket. And still made an out.",
    "{name} blasted the ball into orbit and earned a participation out. Frame it.",
    "The fence limit just ruined {name}'s night. Beautiful swing, glorious distance, total waste. Out.",
    "{name} went yard and the league went nope. Out. Please enjoy the longest, loneliest jog back to the dugout.",
  ],
};

/** Backstop only. Not exhaustive: the catalog is curated and names still need review. */
export const ROAST_BANNED_PATTERN =
  /\b(damn|hell|crap|ass|asshole|shit|fuck|fucking|bitch|bastard|piss|dick|cock|sex|sexy|nude|porn|slut|whore|retard)\b/i;

/**
 * Topics the owner ruled out of bounds for catalog lines: mental health and body weight.
 * Checked by tests on every catalog line (not applied to player names).
 */
export const ROAST_OFF_LIMITS_PATTERN =
  /(\bfat\b|chubby|overweight|obese|\bweigh|\bweight|\bdiet\b|belly|\bgut\b|\bpudgy|\bheavy\b|mental|depress|anxi|crazy|insane|psycho|\bmad\b|\bnuts\b|suicid|\bocd\b|bipolar|\badhd\b|therap|\bhelp\b.*\bsad)/i;

const MAX_NAME_LENGTH = 24;

/**
 * Returns a safe, speakable display name, or null when nothing safe can be said.
 * Callers must treat null as "say nothing".
 */
export function safeDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/[^\p{L}\p{M}\p{N} .'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  if (!cleaned || ROAST_BANNED_PATTERN.test(cleaned)) return null;
  return cleaned;
}

export type RoastSkipReason =
  | "disabled"
  | "not-confirmed"
  | "duplicate-command"
  | "no-roast-for-outcome"
  | "no-consent"
  | "unsafe-name"
  | "no-line";

export type RoastInput = {
  /** The scoring command's id: stable across retries, so it is the dedupe key. */
  commandId: string;
  playerId: string;
  displayName: string;
  outcome: Outcome;
  /** True only when the server classified this fence HR as over the HR limit (an out). */
  overLimitFenceHr?: boolean;
  /** The save receipt. Conflicts and replays never produce a roast. */
  receipt?: { status?: string; duplicate?: boolean };
  settings: RoastSettings;
  /** Server-authoritative consent. Only an explicit `true` counts. */
  consent: ReadonlyMap<string, boolean>;
};

export type RoastDecision =
  | {
      kind: "show";
      commandId: string;
      playerId: string;
      category: RoastCategory;
      lineId: string;
      text: string;
    }
  | { kind: "skip"; reason: RoastSkipReason };

export function roastCategory(outcome: Outcome, overLimitFenceHr = false): RoastCategory | null {
  if (outcome === "Fence HR" && overLimitFenceHr) return "OVER-LIMIT HR";
  return ROAST_CATEGORY_BY_OUTCOME[outcome] ?? null;
}

/** Playback-time recheck. Call immediately before displaying or speaking. */
export function stillConsented(
  playerId: string,
  consent: ReadonlyMap<string, boolean>,
  settings: RoastSettings,
): boolean {
  return settings.enabled === true && consent.get(playerId) === true;
}

export type RoastPlannerOptions = {
  random?: () => number;
  /** How many command ids to remember for dedupe (oldest evicted first). */
  memory?: number;
};

/** A small stateful planner: remembers shown commands and the last line per category. */
export function createRoastPlanner(options: RoastPlannerOptions = {}) {
  const random = options.random ?? Math.random;
  const memory = Math.max(1, options.memory ?? 500);
  const seen = new Set<string>();
  const lastLine = new Map<RoastCategory, string>();

  function remember(commandId: string) {
    seen.add(commandId);
    if (seen.size > memory) {
      const oldest = seen.values().next().value;
      if (oldest !== undefined) seen.delete(oldest);
    }
  }

  function plan(input: RoastInput): RoastDecision {
    if (input.settings.enabled !== true) return { kind: "skip", reason: "disabled" };
    const receipt = input.receipt;
    if (receipt && (receipt.duplicate === true || receipt.status === "conflict"))
      return { kind: "skip", reason: "not-confirmed" };
    if (!input.commandId || seen.has(input.commandId))
      return { kind: "skip", reason: "duplicate-command" };
    const category = roastCategory(input.outcome, input.overLimitFenceHr === true);
    if (!category) return { kind: "skip", reason: "no-roast-for-outcome" };
    if (input.consent.get(input.playerId) !== true) return { kind: "skip", reason: "no-consent" };
    const name = safeDisplayName(input.displayName);
    if (!name) return { kind: "skip", reason: "unsafe-name" };

    const lines = ROAST_CATALOG[category];
    const previous = lastLine.get(category);
    const choices = lines.map((_, index) => index).filter((index) => `${category}:${index}` !== previous);
    const pool = choices.length ? choices : lines.map((_, index) => index);
    if (!pool.length) return { kind: "skip", reason: "no-line" };
    const pick = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
    const index = pool[pick];
    const lineId = `${category}:${index}`;

    remember(input.commandId);
    lastLine.set(category, lineId);
    return {
      kind: "show",
      commandId: input.commandId,
      playerId: input.playerId,
      category,
      lineId,
      text: lines[index].replaceAll("{name}", name),
    };
  }

  return { plan };
}

/** Exposed for tests: every stored outcome must be deliberately mapped. */
export const MAPPED_OUTCOMES: readonly Outcome[] = OUTCOMES;
