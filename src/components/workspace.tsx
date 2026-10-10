"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import Link from "next/link";
import { BrandLink } from "./brand-link";
import { usePathname } from "next/navigation";
import {
  House,
  Trophy,
  ChartNoAxesColumnIncreasing,
  CupSoda,
  Ellipsis,
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Sparkles,
  UserRound,
  Settings2,
  Radio,
  WifiOff,
  SlidersHorizontal,
  X,
  ShieldCheck,
  CircleCheck,
} from "lucide-react";
import {
  teams,
  seasons,
  scenarios,
  connections,
  sampleStats,
  samplePlayers,
  type Scope,
  type Scenario,
  type Connection,
} from "@/lib/fixtures";

type PreviewState = {
  team: string;
  season: string;
  scope: Scope;
  scenario: Scenario;
  connection: Connection;
  captain: boolean;
  setTeam: (v: string) => void;
  setSeason: (v: string) => void;
  setScope: (v: Scope) => void;
  setScenario: (v: Scenario) => void;
  setConnection: (v: Connection) => void;
  setCaptain: (v: boolean) => void;
};
const PreviewContext = createContext<PreviewState | null>(null);
export function PreviewProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<string>(teams[0]);
  const [season, setSeason] = useState<string>(seasons[0]);
  const [scope, setScope] = useState<Scope>("League");
  const [scenario, setScenario] = useState<Scenario>("Game day");
  const [connection, setConnection] = useState<Connection>("Connected");
  const [captainTags, setCaptainTags] = useState<Record<string, boolean>>({});
  const captain = captainTags[team] ?? false;
  const setCaptain = (value: boolean) =>
    setCaptainTags((tags) => ({ ...tags, [team]: value }));
  return (
    <PreviewContext.Provider
      value={{
        team,
        setTeam,
        season,
        setSeason,
        scope,
        setScope,
        scenario,
        setScenario,
        connection,
        setConnection,
        captain,
        setCaptain,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}
function usePreview() {
  const state = useContext(PreviewContext);
  if (!state) throw new Error("Missing preview context");
  return state;
}
const navigation = [
  { href: "/", label: "Home", icon: House },
  { href: "/games", label: "Games", icon: Trophy },
  { href: "/stats", label: "Stats", icon: ChartNoAxesColumnIncreasing },
  { href: "/beverages", label: "Beverages", icon: CupSoda },
  { href: "/more", label: "More", icon: Ellipsis },
];
function Badge({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function SectionTitle({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {href && (
        <Link className="text-link" href={href}>
          {action ?? "View all"}
          <ArrowUpRight size={15} aria-hidden />
        </Link>
      )}
    </div>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card empty">
      <Trophy size={30} aria-hidden />
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="button secondary" href="/more/team">
        Team options
        <ChevronRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
function ScopeTabs() {
  const p = usePreview();
  return (
    <div className="segmented" role="group" aria-label="Statistics view">
      {(["League", "Tournament", "Overall"] as Scope[]).map((s) => (
        <button
          key={s}
          onClick={() => p.setScope(s)}
          aria-pressed={p.scope === s}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
function ContextSelectors() {
  const p = usePreview();
  return (
    <div className="context-selectors">
      <label>
        Team
        <select
          aria-label="Team"
          value={p.team}
          onChange={(e) => p.setTeam(e.target.value)}
          disabled={p.scenario === "No team"}
        >
          {teams.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        Season
        <select
          aria-label="Season"
          value={p.season}
          onChange={(e) => p.setSeason(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
function GameCard({ other = false }: { other?: boolean }) {
  const p = usePreview();
  const gameTeam = other ? teams.find((team) => team !== p.team)! : p.team;
  const blocked = !["Connected", "Success"].includes(p.connection);
  return (
    <article className="card live-card">
      <div className="card-top">
        <Badge tone="green">
          <Radio size={12} aria-hidden /> Live · sample
        </Badge>
        <span className="muted small">
          {other ? "Tournament" : "League"} · Game {other ? "2" : "1"}
        </span>
      </div>
      <div className="scoreline">
        <div>
          <span className="team-monogram">
            {gameTeam === teams[0] ? "NA" : "WW"}
          </span>
          <h3>{gameTeam}</h3>
          <span className="muted small">Home</span>
        </div>
        <strong>
          {other ? "6" : "12"}
          <span className="score-dash">:</span>
          {other ? "4" : "8"}
        </strong>
        <div>
          <span className="team-monogram opponent">{other ? "BR" : "DD"}</span>
          <h3>{other ? "Base Runners" : "Dugout Delinquents"}</h3>
          <span className="muted small">Away</span>
        </div>
      </div>
      <div className="game-progress">
        <span>
          Bottom {other ? "3rd" : "5th"}
          <span className="divider">/</span>
          {other ? "0" : "1"} out
        </span>
        <span>Sample update · 7:42 PM</span>
      </div>
      {blocked ? (
        <button className="button primary" disabled>
          Scoring unavailable · {p.connection.toLowerCase()}
        </button>
      ) : (
        <Link
          className="button primary"
          href={other ? "/games/live?game=second" : "/games/live"}
        >
          Open scoring
          <ArrowUpRight size={18} aria-hidden />
        </Link>
      )}
      <p className="micro">
        Every team member can score. Captain tag not required.
      </p>
    </article>
  );
}
function PersonalStats() {
  const p = usePreview();
  const s = sampleStats[p.scope];
  return (
    <section>
      <SectionTitle title="Your numbers" href="/stats" action="Explore stats" />
      <ScopeTabs />
      <div className="stats-grid">
        {[
          { value: s.obp, label: "OBP" },
          { value: s.reach, label: "Reach Base %" },
        ].map((stat) => (
          <div className="card stat-tile" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
      <p className="micro">
        {p.team} · {p.season} · {p.scope} · {s.games} sample games
      </p>
    </section>
  );
}
function UpcomingCard() {
  const p = usePreview();
  return (
    <article className="card upcoming">
      <div className="date-box">
        <span>OCT</span>
        <strong>15</strong>
      </div>
      <div className="grow">
        <Badge>Upcoming · sample</Badge>
        <h3>vs. Pitch Please</h3>
        <p className="muted small">
          {p.team} · League
          <br />
          7:00 PM · Field 2
        </p>
      </div>
      <Link
        href="/games"
        className="icon-link"
        aria-label="View upcoming games"
      >
        <ChevronRight aria-hidden />
      </Link>
    </article>
  );
}
function BeverageSummary() {
  return (
    <article className="card beverage-summary">
      <div className="beverage-icon">
        <CupSoda size={26} aria-hidden />
      </div>
      <div className="grow">
        <span className="eyebrow">Beverage Board</span>
        <h3>2 beverages in credit</h3>
        <p className="muted small">A little credit where it’s due.</p>
      </div>
      <Link
        className="icon-link"
        href="/beverages"
        aria-label="View Beverage Board"
      >
        <ChevronRight aria-hidden />
      </Link>
    </article>
  );
}
function Recent() {
  return (
    <article className="card recent">
      <div className="row">
        <Badge tone="green">Final · sample</Badge>
        <span className="muted small">Oct 8 · League</span>
      </div>
      <div className="row">
        <h3>vs. Bat Intentions</h3>
        <strong className="result">
          14–9 <span>W</span>
        </strong>
      </div>
      <p className="muted small">
        Sample result. Historical corrections belong to a later milestone.
      </p>
    </article>
  );
}
function Home() {
  const p = usePreview();
  const hasLive =
    ["Game day", "Multiple live games", "Guest"].includes(p.scenario) &&
    p.season === seasons[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your clubhouse</span>
          <h1>
            Good evening, Player<span className="accent">.</span>
          </h1>
          <p>The stats don’t lie. Your teammates might.</p>
        </div>
        <span className="avatar" aria-label="Sample player initials">
          P
        </span>
      </div>
      <div className="identity-row">
        <Badge>
          {p.scenario === "Guest" ? "Guest player preview" : "Player dashboard"}
        </Badge>
        {p.captain && <Badge tone="purple">Self-tagged captain</Badge>}
      </div>
      {p.scenario === "No team" ? (
        <Empty title="Your next team starts here.">
          Join with an invite code or explore team setup. No private roster is
          shown before membership.
        </Empty>
      ) : p.scenario === "Empty season" ? (
        <Empty title="A clean scorebook.">
          No games or stats for this sample season yet. Your history stays with
          its original season.
        </Empty>
      ) : (
        <>
          {hasLive && (
            <section>
              <SectionTitle
                title="You’re up. Game is live."
                href="/games"
                action="Games"
              />
              <div className="live-grid">
                <GameCard />
                {p.scenario === "Multiple live games" && <GameCard other />}
              </div>
            </section>
          )}
          <div className="dashboard-grid">
            <div className="main-column">
              <PersonalStats />
              {p.scenario !== "Completed" && (
                <section>
                  <SectionTitle title="Next on the schedule" />
                  <UpcomingCard />
                </section>
              )}
              <section>
                <SectionTitle
                  title="Last time out"
                  href="/games"
                  action="Game history"
                />
                <Recent />
              </section>
            </div>
            <div className="side-column">
              <section>
                <SectionTitle title="Off the field" />
                <BeverageSummary />
              </section>
              <article className="card alibi-teaser">
                <Sparkles size={24} aria-hidden />
                <span className="eyebrow">Need a good excuse?</span>
                <h2>
                  We’ve got an alibi <br />
                  for that.
                </h2>
                <p>
                  The scorebook remembers. <br />
                  Your story can still improve.
                </p>
                <Link className="text-link" href="/more/alibi">
                  Find your alibi
                  <ArrowUpRight size={16} aria-hidden />
                </Link>
              </article>
              <Link href="/more/team" className="card quick-link">
                <Users size={20} aria-hidden />
                <span>Team & roster</span>
                <ChevronRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
function Games() {
  const p = usePreview();
  const live =
    ["Game day", "Multiple live games", "Guest"].includes(p.scenario) &&
    p.season === seasons[0];
  return (
    <>
      <PageHeading
        eyebrow="The scorebook"
        title="Games"
        subtitle="Game day, all in one place."
      />
      {["No team", "Empty season"].includes(p.scenario) ? (
        <Empty title="No games here yet.">
          Choose a team and season to see its game day.
        </Empty>
      ) : (
        <>
          {live && (
            <section>
              <SectionTitle title="Live now" />
              <div className="live-grid">
                <GameCard />
                {p.scenario === "Multiple live games" && <GameCard other />}
              </div>
            </section>
          )}
          {p.scenario !== "Completed" && (
            <section>
              <SectionTitle title="Coming up" />
              <UpcomingCard />
            </section>
          )}
          <section>
            <SectionTitle title="Completed" />
            <Recent />
          </section>
        </>
      )}
    </>
  );
}
function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function Stats() {
  const p = usePreview();
  return (
    <>
      <PageHeading
        eyebrow="Beyond the box score"
        title="Your stats"
        subtitle="One player. Every part of the season."
      />
      {["No team", "Empty season"].includes(p.scenario) ? (
        <Empty title="The numbers will come.">
          There are no stats in this sample context.
        </Empty>
      ) : (
        <>
          <PersonalStats />
          <section className="card detail-card">
            <h2>{p.scope} snapshot</h2>
            <p className="muted">
              {p.team} · {p.season}
            </p>
            <dl className="data-list">
              <div>
                <dt>Games played</dt>
                <dd>{sampleStats[p.scope].games}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>Synthetic preview</dd>
              </div>
              <div>
                <dt>Historical aggregation</dt>
                <dd>Still to be defined</dd>
              </div>
            </dl>
            <p className="micro">
              These are display fixtures. Official OBP and Reach Base %
              rules remain unchanged in the project rulebook. Overall preview
              covers only the selected sample team and season.
            </p>
          </section>
        </>
      )}
    </>
  );
}
function Beverages() {
  const p = usePreview();
  const [direction, setDirection] = useState("Owed");
  const rows = samplePlayers
    .filter((x) => (direction === "Owed" ? x.balance > 0 : x.balance < 0))
    .sort((a, b) =>
      direction === "Owed" ? b.balance - a.balance : a.balance - b.balance,
    );
  return (
    <>
      <PageHeading
        eyebrow="Friendly competition. Questionable excuses."
        title="Beverage Board"
        subtitle="Your balance, with a little clubhouse personality."
      />
      {["No team", "Empty season"].includes(p.scenario) ? (
        <Empty title="No beverage entries yet.">
          Balances appear when games are recorded. Reset and carryover policy is
          still to be decided.
        </Empty>
      ) : (
        <>
          <BeverageSummary />
          <section>
            <SectionTitle title="Around the clubhouse" />
            <div
              className="segmented"
              role="group"
              aria-label="Beverage leaderboard view"
            >
              {["Owed", "Credits"].map((d) => (
                <button
                  key={d}
                  aria-pressed={direction === d}
                  onClick={() => setDirection(d)}
                >
                  {d === "Owed" ? "Most owed" : "Most credited"}
                </button>
              ))}
            </div>
            <div className="card leaderboard">
              {rows.map((row, i) => (
                <div className="leader-row" key={row.name}>
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <span className="player-initial">{row.name[0]}</span>
                  <strong>{row.name}</strong>
                  <span className="balance">
                    {Math.abs(row.balance)}{" "}
                    <small>{row.balance < 0 ? "in credit" : "owed"}</small>
                  </span>
                </div>
              ))}
            </div>
            <p className="micro">
              Proposed ranking · sample players · {p.team} · {p.season}. Rank
              rules and balance carryover await a decision. Credits are not
              errors.
            </p>
          </section>
        </>
      )}
    </>
  );
}
const moreItems = [
  {
    path: "team",
    title: "Team & roster",
    subtitle: "Invite codes and captain designation",
    icon: Users,
  },
  {
    path: "seasons",
    title: "Seasons",
    subtitle: "A new season. Same good stories.",
    icon: CalendarDays,
  },
  {
    path: "alibi",
    title: "Alibi Generator",
    subtitle: "A little help with your side of the story",
    icon: Sparkles,
  },
  {
    path: "profile",
    title: "Player profile",
    subtitle: "Your personal clubhouse",
    icon: UserRound,
  },
  {
    path: "settings",
    title: "Settings",
    subtitle: "Preview and connection states",
    icon: Settings2,
  },
];
function More() {
  return (
    <>
      <PageHeading
        eyebrow="The rest of the clubhouse"
        title="More"
        subtitle="Keep game day simple. Find the extras here."
      />
      <div className="card menu-list">
        <Link href="/status"><span className="grow"><strong>Project status</strong><small>Milestones, remaining tasks and completion gates</small></span><ChevronRight size={18} aria-hidden /></Link>
        {moreItems.map((item) => (
          <Link key={item.path} href={`/more/${item.path}`}>
            <span className="menu-icon">
              <item.icon aria-hidden />
            </span>
            <span className="grow">
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        ))}
      </div>
      <div className="brand-note">
        <strong>DIAMOND ALIBI</strong>
        <p>The stats don’t lie. Your teammates might.</p>
        <span>Sample dashboard · synthetic data</span>
      </div>
    </>
  );
}
function Team() {
  const p = usePreview();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="Your people"
        title="Team & roster"
        subtitle="Everyone can score for everyone on their team."
      />
      <section className="card detail-card">
        <h2>{p.scenario === "No team" ? "Join your clubhouse" : p.team}</h2>
        <p className="muted">Membership and roster services arrive in M4.2.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(
              "Preview only: invite codes are not validated or sent. No team was joined.",
            );
          }}
        >
          <label>
            Team invite code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={32}
              autoComplete="off"
              placeholder="Enter invite code"
              required
            />
          </label>
          <button className="button secondary" type="submit">
            Preview joining
          </button>
        </form>
        <p role="status">{message}</p>
        <div className="separator" />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={p.captain}
            disabled={p.scenario === "No team" || p.scenario === "Guest"}
            onChange={(e) => p.setCaptain(e.target.checked)}
          />
          <span>
            Tag myself as Team Captain{" "}
            <small>
              Sample designation. Captain tags do not grant extra scoring
              permissions.
            </small>
          </span>
        </label>
        <button className="button secondary" disabled>
          Create team · available in M4.2
        </button>
        <p className="micro">
          Guest membership rights, captain lifecycle and invite security policy
          are still to be defined.
        </p>
      </section>
    </>
  );
}
function Seasons() {
  const p = usePreview();
  return (
    <>
      <PageHeading
        eyebrow="Keep the history"
        title="Seasons"
        subtitle="Fresh scorebook. No lost memories."
      />
      <section className="card menu-list">
        {seasons.map((s) => (
          <button
            key={s}
            className="season-row"
            onClick={() => p.setSeason(s)}
            aria-pressed={p.season === s}
          >
            <CalendarDays aria-hidden />
            <span className="grow">
              <strong>{s}</strong>
              <small>
                {s === seasons[0]
                  ? "Current sample season"
                  : "Historical sample season"}
              </small>
            </span>
            {p.season === s && <CircleCheck size={20} aria-label="Selected" />}
          </button>
        ))}
      </section>
      <section className="card detail-card">
        <h2>New season</h2>
        <p className="muted">
          Season creation and historical records will use the team backend in
          M4.2.
        </p>
        <button className="button secondary" disabled>
          Create season · available in M4.2
        </button>
      </section>
    </>
  );
}
export function Alibi() {
  const [category, setCategory] = useState("New Gear");
  const [alibi, setAlibi] = useState("");
  const [message, setMessage] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);
  const phrases: Record<string, string[]> = {
    "New Gear": [
      "No dear, I have had this bat for years.",
      "What do you mean I have enough bats? Don't you have enough shoes?",
    ],
    "At Home": [
      "I was checking the weather. For the entire game.",
      "I said one more inning. I never said which inning.",
    ],
    "Bad Plays": [
      "The sun was in my eyes. Yes, under the lights.",
      "That wasn't a missed catch. It was a ground inspection.",
    ],
    "Team Shenanigans": [
      "That was a team-building exercise with unusually bad timing.",
      "We were testing the mercy rule. Very thoroughly.",
    ],
  };
  return (
    <>
      <PageHeading
        eyebrow="Your side of the story"
        title="Alibi Generator"
        subtitle="The scorebook has facts. You have options."
      />
      <section className="card detail-card">
        <label>
          Category
          <select
            aria-label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setAlibi("");
              setMessage("");
            }}
          >
            {Object.keys(phrases).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          className="button primary"
          onClick={() => {
            const pool = phrases[category].filter((phrase) => phrase !== alibi);
            setAlibi(pool[Math.floor(Math.random() * pool.length)]);
            setMessage("");
          }}
        >
          Plead the Fifth? Nah. Generate an Alibi.
        </button>
        {alibi && <blockquote aria-live="polite">“{alibi}”</blockquote>}
        {alibi && (
          <div className="action-row">
            <button
              className="button secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await navigator.clipboard.writeText(alibi);
                  setMessage("Alibi copied. Your defense is ready.");
                } catch {
                  setMessage(
                    "Clipboard unavailable. Select the alibi text and copy it manually.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Copy alibi
            </button>
            <button
              className="button secondary"
              disabled={busy || !canShare}
              onClick={async () => {
                setBusy(true);
                try {
                  await navigator.share({ text: alibi });
                  setMessage("Share action handed to your device.");
                } catch (error) {
                  setMessage(
                    error instanceof DOMException && error.name === "AbortError"
                      ? "Sharing canceled. Your alibi stayed here."
                      : "Sharing unavailable. Try copying the alibi instead.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Share alibi
            </button>
          </div>
        )}
        <p role="status">{message}</p>
        <p className="micro">
          Prewritten local samples. Additional phrases are draft copy. Copy and
          device sharing happen only when you press their buttons. If device
          sharing is unavailable, use Copy alibi.
        </p>
      </section>
    </>
  );
}
function Profile() {
  const p = usePreview();
  return (
    <>
      <PageHeading
        eyebrow="Personal clubhouse"
        title="Player profile"
        subtitle="Sample player. No personal account connected."
      />
      <section className="card detail-card">
        <span className="avatar">P</span>
        <h2>Sample Player</h2>
        <p className="muted">
          {p.scenario === "Guest" ? "Guest preview" : "Team member preview"}
        </p>
        {p.captain && <Badge tone="purple">Self-tagged captain</Badge>}
        <p>Account editing and sign-in are planned for M4.2.</p>
      </section>
    </>
  );
}
function ConnectionNotice() {
  const p = usePreview();
  if (p.connection === "Connected" || p.connection === "Loading") return null;
  const messages: Record<string, string> = {
    Offline:
      "Offline preview. Showing sample data last confirmed at 7:42 PM. Scoring is unavailable.",
    Reconnecting:
      "Reconnecting preview. Confirmed data must refresh before scoring resumes.",
    Error:
      "Could not load the sample game. Your selected team and season are retained.",
    Conflict:
      "Another scorer updated the game in this preview. Review the latest version before continuing.",
    "Save pending": "Pending save preview. This is not a confirmed save.",
    "Save failed":
      "Save failed preview. No confirmed save; nothing was written.",
    Success:
      "Success preview. Sample state refreshed; no real data was written.",
  };
  return (
    <div
      className={`connection-notice ${p.connection === "Success" ? "success" : ""}`}
      role="status"
    >
      {p.connection === "Success" ? (
        <CircleCheck size={18} aria-hidden />
      ) : (
        <WifiOff size={18} aria-hidden />
      )}
      <span>{messages[p.connection]}</span>
      {["Error", "Conflict", "Save failed", "Reconnecting"].includes(
        p.connection,
      ) && (
        <button onClick={() => p.setConnection("Connected")}>
          {p.connection === "Conflict" ? "Review latest" : "Retry preview"}
        </button>
      )}
    </div>
  );
}
function PreviewControls() {
  const p = usePreview();
  return (
    <div className="preview-controls">
      <p className="micro">Local sample controls · reset on browser refresh</p>
      <label>
        Dashboard scenario
        <select
          aria-label="Dashboard scenario"
          value={p.scenario}
          onChange={(e) => p.setScenario(e.target.value as Scenario)}
        >
          {scenarios.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Connection state
        <select
          aria-label="Connection state"
          value={p.connection}
          onChange={(e) => p.setConnection(e.target.value as Connection)}
        >
          {connections.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={p.captain}
          onChange={(e) => p.setCaptain(e.target.checked)}
        />
        <span>Captain designation preview</span>
      </label>
    </div>
  );
}
function ScoringPreview({ other = false }: { other?: boolean }) {
  const p = usePreview();
  const gameTeam = other ? teams.find((team) => team !== p.team)! : p.team;
  return (
    <>
      <PageHeading
        eyebrow="Game day"
        title="Scoring preview"
        subtitle={`${gameTeam} vs. ${other ? "Base Runners" : "Dugout Delinquents"}`}
      />
      <section className="card detail-card">
        <Badge tone="green">Live · synthetic game</Badge>
        <h2>Everyone gets a scorebook.</h2>
        <p>
          All authorized team members will have scoring access. A captain tag is
          not required.
        </p>
        <div className="score-preview">
          <strong>{other ? "6 : 4" : "12 : 8"}</strong>
          <span>{other ? "Bottom 3rd · 0 outs" : "Bottom 5th · 1 out"}</span>
        </div>
        <p className="muted">
          This sample game is a shell preview. Try lineup editing, next-batter
          controls, batting outcomes and corrections in the separate local
          practice scorebook.
        </p>
        <button className="button primary" disabled>
          Record outcome · available in M4.3
        </button>
        <Link className="button primary" href="/practice">
          Open practice scorebook
        </Link>
        <p className="micro">
          No scoring writes, simulated saves or official rule changes.
        </p>
      </section>
    </>
  );
}
function Loading() {
  return (
    <section
      className="loading"
      aria-label="Loading sample dashboard"
      aria-busy="true"
    >
      <span className="eyebrow">Loading sample dashboard…</span>
      <div className="skeleton tall" />
      <div className="stats-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton tall" />
    </section>
  );
}
function PreviewDialog({ close }: { close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="preview-dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="row">
        <h2>Preview controls</h2>
        <button
          className="icon-link"
          onClick={close}
          aria-label="Close preview controls"
        >
          <X aria-hidden />
        </button>
      </div>
      <PreviewControls />
      <button className="button primary" onClick={close}>
        Apply & return
      </button>
    </dialog>
  );
}
export function Workspace({
  route,
  otherGame = false,
}: {
  route: string;
  otherGame?: boolean;
}) {
  const p = usePreview();
  const pathname = usePathname();
  const [controls, setControls] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      heading.current?.focus();
      previousPath.current = pathname;
    }
  }, [pathname]);
  const tab = route.split("/")[0] || "home";
  const detail = route.includes("/");
  const noData = ["No team", "Empty season"].includes(p.scenario);
  let content: ReactNode;
  switch (route) {
    case "":
      content = <Home />;
      break;
    case "games":
      content = <Games />;
      break;
    case "games/live":
      content = noData ? (
        <Empty title="No game in this context.">
          Choose a team and season with sample games.
        </Empty>
      ) : (
        <ScoringPreview other={otherGame} />
      );
      break;
    case "stats":
      content = <Stats />;
      break;
    case "beverages":
      content = <Beverages />;
      break;
    case "more":
      content = <More />;
      break;
    case "more/team":
      content = <Team />;
      break;
    case "more/seasons":
      content = <Seasons />;
      break;
    case "more/alibi":
      content = <Alibi />;
      break;
    case "more/profile":
      content = <Profile />;
      break;
    case "more/settings":
      content = (
        <>
          <PageHeading
            eyebrow="Local experience"
            title="Preview settings"
            subtitle="Explore the states a real game day needs."
          />
          <section className="card detail-card">
            <PreviewControls />
          </section>
        </>
      );
      break;
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="desktop-rail">
        <BrandLink href="/" className="rail-logo" variant="primary" />
        <span className="rail-caption">YOUR GAME. YOUR STORY.</span>
        <nav aria-label="Desktop primary">
          {navigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={
                (item.href === "/" ? tab === "home" : item.href === `/${tab}`)
                  ? "page"
                  : undefined
              }
            >
              <item.icon size={20} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rail-footer">
          <ShieldCheck size={18} aria-hidden />
          <span>
            Sample dashboard
            <br />
            <small>Team accounts: My clubhouse</small>
          </span>
        </div>
      </div>
      <div className="workspace">
        <header className="topbar">
          <BrandLink href="/" className="header-logo" variant="primary" />
          <span className="topbar-note">THE STATS DON’T LIE.</span>
          <Link className="sign-in-link" href="/club">
            My clubhouse
          </Link>
          <button className="preview-button" onClick={() => setControls(true)}>
            <SlidersHorizontal size={16} aria-hidden />
            <span>Sample data</span>
          </button>
        </header>
        <div className="content-wrap">
          <div className="context-row">
            <ContextSelectors />
            <span className="context-status">
              <span className="status-dot" />
              Sample data
            </span>
          </div>
          <ConnectionNotice />
          <main id="main" ref={heading} tabIndex={-1}>
            {detail && (
              <Link
                href={tab === "games" ? "/games" : "/more"}
                className="back-link"
              >
                <ArrowLeft size={16} aria-hidden />
                Back to {tab === "games" ? "games" : "More"}
              </Link>
            )}
            {p.connection === "Loading" ? <Loading /> : content}
          </main>
          <footer className="content-footer">
            <span>Made for the game. Built for the clubhouse.</span>
            <span>Sample data</span>
          </footer>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Mobile primary">
        {navigation.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            aria-current={
              (item.href === "/" ? tab === "home" : item.href === `/${tab}`)
                ? "page"
                : undefined
            }
          >
            <item.icon size={21} aria-hidden />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      {controls && <PreviewDialog close={() => setControls(false)} />}
    </>
  );
}
