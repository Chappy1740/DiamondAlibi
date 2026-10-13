// Sanitized canonical project checklist. Update after every work session.
import type { ProjectTracker } from "../lib/project-status";
export const projectTracker: ProjectTracker = {
  schemaVersion: 1,
  revision: 41,
  updatedAt: "2026-10-12",
  scope:
    "Required first-release work. Optional future ideas are excluded from percentages.",
  release: {
    commit: "5fda987",
    label: "Challenge the Call and private Booth Reviews",
    status:
      "Feedback deployed; owner and reviewer test submission, owner delivery/readability, reviewed-state persistence and reviewer inbox denial passed",
  },
  milestones: [
    {
      id: "M1",
      name: "Foundation",
      description:
        "Canonical workspace, recovered requirements, architecture and development standards.",
      tasks: [
        {
          id: "M1-1",
          group: "Foundation",
          title: "Preserve source planning and establish the canonical folder",
          status: "done",
          evidence: "Copy provenance and local canonical workspace recorded.",
          next: "",
          kind: "work",
        },
        {
          id: "M1-2",
          group: "Foundation",
          title: "Reconcile master handoff and locked decisions",
          status: "done",
          evidence:
            "Existing requirements, decisions and release handoffs reviewed.",
          next: "",
          kind: "work",
        },
        {
          id: "M1-3",
          group: "Foundation",
          title: "Set permission and data-handling boundaries",
          status: "done",
          evidence:
            "Project instructions preserve separate publication/live-change approval.",
          next: "",
          kind: "work",
        },
        {
          id: "M1-4",
          group: "Foundation",
          title: "Establish application stack and reusable business logic",
          status: "done",
          evidence:
            "Existing Next.js/React shell, checked database RPCs and shared scoring modules.",
          next: "",
          kind: "work",
        },
        {
          id: "M1-5",
          group: "Foundation",
          title: "Track schema versions and historical integrity",
          status: "done",
          evidence:
            "Reviewed migrations, original/effective rule versions and retained audit records.",
          next: "",
          kind: "work",
        },
        {
          id: "M1-6",
          group: "Foundation",
          title: "Maintain the detailed project status source of truth",
          status: "done",
          evidence:
            "Canonical checklist, percentage/gate tests and mobile/API/accessibility validation complete.",
          next: "",
          kind: "work",
        },
      ],
    },
    {
      id: "M2",
      name: "Rule verification and examples",
      description:
        "Locked scoring rules with examples, replay checks and connected acceptance.",
      tasks: [
        {
          id: "M2-review-feedback",
          group: "Review access",
          title:
            "Send reviewer questions, suggestions and issues to a private owner inbox",
          status: "done",
          evidence:
            "Feedback deployed to protected preview; approved migration, RLS and encrypted configuration verified. Worker build and synthetic JWT/API/SQL checks pass. Will confirmed owner phone submission, inbox delivery and reviewed-state persistence after reopening. Separate reviewer test login succeeded, submitted feedback and received 404 at the owner inbox. October 12 screenshot confirms the full reviewer message is readable in Booth Reviews with Reviewed status. Inline message display clarified; no defect remains reported. Five teammate phone checks remain a separate task.",
          next: "",
          kind: "work",
        },
        {
          id: "M2-team-phone-review",
          group: "Review access",
          title: "Prepare private phone review access for five teammates",
          status: "in_progress",
          evidence:
            "Phone sample history and isolated twelve-player practice released; five approved reviewers have ongoing One-time PIN access. The saved policy was reopened and verified on October 10 with the existing preview association and 24-hour sessions. Owner confirmed review history and practice scoring passed on phone on October 10; Will confirmed October 12 that the separate reviewer test login on his phone displays sample players and switches seasons. Will then confirmed a synthetic practice plate appearance was recorded and visible in the scorebook. In response to the reload check, Will provided a screenshot showing the recorded synthetic hit still in the scorebook. Owner-controlled reviewer test login, sample history, scoring and reload persistence passed; the five teammates individual results remain pending.",
          next: "Resolve one reported login-code delivery failure; saved reviewer policy reverified October 11. Each reviewer verifies email-code sign-in, sample history and scoring persistence after reload on their phone.",
          kind: "work",
        },
        {
          id: "M2-outgoing-email-brand",
          group: "Review access",
          title:
            "Brand account emails and resolve reviewer code-email appearance",
          status: "in_progress",
          evidence:
            "Password recovery released as db931cf to the protected preview. Synthetic validation, TypeScript, Worker build and local phone-width browser checks pass. Will confirmed the link is visible, supplied a branded reset email screenshot (delivered to Junk), added the allowed recovery callback and saved the hosted Site URL after an initial localhost redirect. A fresh link opened Choose a new password; Will confirmed password change and subsequent sign-in to the clubhouse with the new password October 12. This is owner-reported live acceptance; inbox placement and separate email appearance acceptance remain open.",
          next: "Will confirmed all six branded Supabase account templates saved October 12. Reset template preview and actual received appearance accepted; other five templates need live delivery/flow checks where supported. Owner inbox delivery passed after a safe-sender addition; message authentication passed, but general reviewer inbox placement remains open. Public hosting of the locked logo and acceptable Cloudflare code-email appearance remain separate decisions. Publish local acceptance/template work only after new approval.",
          kind: "work",
        },
        {
          id: "M2-1",
          group: "Rules",
          title: "Configure league/tournament/game HR limits including zero",
          status: "done",
          evidence:
            "Saved competition limits and game-only overrides released; SQL/domain checks pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M2-2",
          group: "Rules",
          title: "Freeze tournament-only Bands at first participation",
          status: "done",
          evidence:
            "Tournament-only fix released; first-game and cross-date replay checks pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M2-3",
          group: "Rules",
          title: "Preserve outcome accounting, OBP and Reach Base %",
          status: "done",
          evidence: "Shared formulas/outcomes tested; displayed AVG removed.",
          next: "",
          kind: "work",
        },
        {
          id: "M2-4",
          group: "Rules",
          title: "Apply season-wide beverage rules, credits and season reset",
          status: "done",
          evidence:
            "League/tournament combined Board and historical-season isolation tests pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M2-5",
          group: "Rules",
          title: "Recalculate the whole game after HR-limit corrections",
          status: "done",
          evidence:
            "Audited original/effective rules and previous-play replay released/tested.",
          next: "",
          kind: "work",
        },
        {
          id: "M2-6",
          group: "Rules",
          title: "Verify the latest HR rules on the hosted phone scorebook",
          status: "done",
          evidence:
            "Owner explicitly confirmed the requested My clubhouse HR-limit changes/corrections and review checks passed on phone on October 10, 2026.",
          next: "",
          kind: "acceptance",
        },
        {
          id: "M2-7",
          group: "Rules",
          title:
            "Verify a fresh season and prior-season correction on hosted data",
          status: "done",
          evidence:
            "Owner explicitly confirmed the requested My clubhouse new-season/prior-season history checks passed on phone on October 10, 2026.",
          next: "",
          kind: "acceptance",
        },
      ],
    },
    {
      id: "M3",
      name: "Workflow and branding review",
      description:
        "Locked identity, usable phone flows and production-ready artwork.",
      tasks: [
        {
          id: "M3-1",
          group: "Brand",
          title:
            "Lock Primary Logo #5 Script Northwest and Icon #6 Northwest DA",
          status: "done",
          evidence: "Owner selections are final; no further voting.",
          next: "",
          kind: "work",
        },
        {
          id: "M3-2",
          group: "App shell",
          title: "Preserve navy/teal mobile sports UI and design tokens",
          status: "done",
          evidence: "Existing responsive shell and centralized theme.",
          next: "",
          kind: "work",
        },
        {
          id: "M3-3",
          group: "App shell",
          title: "Keep Home personal and elevate active live games",
          status: "done",
          evidence: "Connected personal dashboard and sample-context checks.",
          next: "",
          kind: "work",
        },
        {
          id: "M3-4",
          group: "App shell",
          title: "Provide Home, Games, Stats, Beverage and More navigation",
          status: "done",
          evidence: "Responsive main-screen navigation released.",
          next: "",
          kind: "work",
        },
        {
          id: "M3-5",
          group: "Tournament UX",
          title: "Reduce repeated tournament setup and page movement",
          status: "implemented",
          evidence:
            "Compact next-game UI released as 640fb1c; mobile browser checks passed.",
          next: "Owner checks Game 2 opponent-only setup, carried settings and stable controls.",
          kind: "work",
        },
        {
          id: "M3-6",
          group: "Brand",
          title: "Produce final production logo artwork",
          status: "implemented",
          evidence:
            "Supplied Script Northwest raster artwork and full-logo headers are released; owner accepted the larger header on phone on October 10, 2026.",
          next: "Confirm production usage rights/source artwork.",
          kind: "work",
        },
        {
          id: "M3-7",
          group: "Brand",
          title: "Produce final icon, sizing and accessible asset variants",
          status: "implemented",
          evidence:
            "Supplied Northwest DA raster sizes are wired to local favicon, Apple icon and PWA manifest metadata.",
          next: "Check actual phone home-screen and small-icon rendering before release.",
          kind: "work",
        },
        {
          id: "M3-8",
          group: "Phone UX",
          title:
            "Accept dashboard, navigation and game-day flows on a real phone",
          status: "done",
          evidence:
            "Owner confirmed the requested phone checks passed for both My clubhouse and review sample history/practice scoring on October 10, 2026.",
          next: "",
          kind: "acceptance",
        },
      ],
    },
    {
      id: "M4",
      name: "Implementation",
      description:
        "Keep M4.1–M4.5 numbering and expose every remaining feature or integration gap.",
      tasks: [
        {
          id: "M4-1",
          group: "M4.1 Shell/dashboard",
          title: "Build responsive shell and reusable accessible components",
          status: "done",
          evidence:
            "Shell browser/mobile checks and shared components delivered.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-2",
          group: "M4.1 Shell/dashboard",
          title: "Connect personal dashboard, live priority and data states",
          status: "done",
          evidence:
            "Selected team/season snapshots, live scorebook access and error/empty states.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-3",
          group: "M4.1 Shell/dashboard",
          title: "Provide clearly separate sample history",
          status: "done",
          evidence:
            "12 players, four 16-game league seasons, seven 2gg/3gg tournaments; deterministic synthetic fixtures.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-4",
          group: "M4.2 Identity/teams",
          title: "Implement sign-in, sign-out and confirmation recovery",
          status: "done",
          evidence: "Authentication released; owner confirmed login worked.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-5",
          group: "M4.2 Identity/teams",
          title: "Support multiple teams and private invitation codes",
          status: "done",
          evidence:
            "Connected membership and invite create/redeem/revoke controls tested.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-6",
          group: "M4.2 Identity/teams",
          title: "Support captain self-tag and guest rosters",
          status: "done",
          evidence:
            "Captain is designation only; noncaptain and guest scoring checks pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-7",
          group: "M4.2 Identity/teams",
          title: "Create seasons, retain history and archive reversibly",
          status: "done",
          evidence:
            "Connected season foundation and isolation checks delivered.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-8",
          group: "M4.2 Identity/teams",
          title: "Allow a guest player to claim an account safely",
          status: "planned",
          evidence: "",
          next: "Define ownership verification and merge rules, then implement audited claim behavior.",
          kind: "work",
        },
        {
          id: "M4-9",
          group: "M4.2 Identity/teams",
          title: "Complete owner membership/invite/multi-team walkthrough",
          status: "blocked",
          evidence: "",
          next: "Check invite lifecycle, switching teams, guests, captain self-tag and archived-season behavior.",
          kind: "acceptance",
        },
        {
          id: "M4-10",
          group: "M4.3 Scoring",
          title:
            "Create league/tournament games with saved limits and guarantees",
          status: "done",
          evidence:
            "Named league/tournament limits; 2gg/3gg and extra numbered games released.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-11",
          group: "M4.3 Scoring",
          title: "Manage lineup, batting order and next batter",
          status: "done",
          evidence:
            "Connected lineup commands, participation and next-batter override tested.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-12",
          group: "M4.3 Scoring",
          title: "Let authorized teammates score for everyone",
          status: "done",
          evidence:
            "Member-scoped RPCs, noncaptain access and team isolation checks pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-13",
          group: "M4.3 Scoring",
          title: "Record plays, correct completed games and preserve audit",
          status: "done",
          evidence:
            "Checked atomic event commands, corrections and retained history released.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-14",
          group: "M4.3 Scoring",
          title: "Record score/inning independently with correction reasons",
          status: "done",
          evidence:
            "Manual scoreboard and audit released; unknown history is not inferred.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-15",
          group: "M4.3 Scoring",
          title:
            "Protect retries, conflicts, stale revisions and offline writes",
          status: "done",
          evidence:
            "Database concurrency and browser uncertain-save/offline/conflict checks pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-16",
          group: "M4.3 Scoring",
          title: "Validate two real signed-in clients scoring simultaneously",
          status: "blocked",
          evidence: "",
          next: "Confirm live refresh/conflict/retry behavior without duplicate plays or silent data loss.",
          kind: "acceptance",
        },
        {
          id: "M4-17",
          group: "M4.4 Stats/Board",
          title: "Share League/Tournament/Overall statistical calculations",
          status: "done",
          evidence:
            "Connected scoped snapshots and shared aggregation; synthetic replay checks pass.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-18",
          group: "M4.4 Stats/Board",
          title: "Show player and team summaries with season history",
          status: "done",
          evidence:
            "Main screens use selected context; season totals and Board displayed.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-19",
          group: "M4.4 Stats/Board",
          title:
            "Keep beverage accounting separate and recalculate corrections",
          status: "done",
          evidence:
            "Versioned Board and whole-game/whole-tournament replay checked.",
          next: "",
          kind: "work",
        },
        {
          id: "M4-20",
          group: "M4.4 Stats/Board",
          title: "Set career scope and leaderboard ranking policy",
          status: "blocked",
          evidence: "",
          next: "Define cross-team/career scope, ranking direction and tie handling without changing settled formulas.",
          kind: "decision",
        },
        {
          id: "M4-21",
          group: "M4.4 Stats/Board",
          title: "Implement career totals and finalized leaderboard ranking",
          status: "planned",
          evidence: "",
          next: "Use approved scope/ranking and preserve underlying season records.",
          kind: "work",
        },
        {
          id: "M4-22",
          group: "M4.4 Stats/Board",
          title: "Accept connected stats/Board across team and season switches",
          status: "blocked",
          evidence: "",
          next: "Compare League/Tournament/Overall and previous seasons with scorebook totals.",
          kind: "acceptance",
        },
        {
          id: "M4-23",
          group: "M4.5 Social/integration",
          title: "Provide prewritten alibis in all four locked categories",
          status: "implemented",
          evidence:
            "Existing generator, exact action and copy/share controls implemented.",
          next: "Verify copy/share on the owner phone and handle unsupported share behavior.",
          kind: "work",
        },
        {
          id: "M4-24",
          group: "M4.5 Social/integration",
          title:
            "Define player reliability separately from technical reliability",
          status: "blocked",
          evidence: "",
          next: "Approve participation inputs, formula, visibility and history rules.",
          kind: "decision",
        },
        {
          id: "M4-25",
          group: "M4.5 Social/integration",
          title: "Implement the agreed player reliability metric",
          status: "planned",
          evidence: "",
          next: "Wait for definition; never infer a rating from connection state.",
          kind: "work",
        },
        {
          id: "M4-26",
          group: "M4.5 Social/integration",
          title: "Define tournament advancement and championship formats",
          status: "blocked",
          evidence: "",
          next: "Guarantee is a minimum; specify bracket/eligibility rules explicitly.",
          kind: "decision",
        },
        {
          id: "M4-27",
          group: "M4.5 Social/integration",
          title: "Implement explicit tournament progression",
          status: "planned",
          evidence: "",
          next: "Add approved progression rules without assuming one elimination structure.",
          kind: "work",
        },
        {
          id: "M4-28",
          group: "M4.5 Social/integration",
          title: "Accept complete game-day workflow",
          status: "blocked",
          evidence: "",
          next: "Registration/team/season/game/scoring/correction/stats/Board/alibi walkthrough on phone.",
          kind: "acceptance",
        },
      ],
    },
    {
      id: "M5",
      name: "Validation and hardening",
      description:
        "Security, concurrent live use, recovery, accessibility and real-device acceptance.",
      tasks: [
        {
          id: "M5-1",
          group: "Engineering checks",
          title: "Run domain, service, replay and idempotency regressions",
          status: "done",
          evidence:
            "46 focused checks and disposable SQL/React scoring suite passed before latest release.",
          next: "",
          kind: "work",
        },
        {
          id: "M5-2",
          group: "Engineering checks",
          title: "Verify database authorization and independent-team isolation",
          status: "done",
          evidence:
            "Member/nonmember/revoked/anonymous tests; narrow invoker RPCs and direct-write denial.",
          next: "",
          kind: "work",
        },
        {
          id: "M5-3",
          group: "Engineering checks",
          title: "Validate database concurrency and bounded fixture cleanup",
          status: "done",
          evidence:
            "Separate backend lock/conflict tests and scoped synthetic cleanup recorded.",
          next: "",
          kind: "work",
        },
        {
          id: "M5-4",
          group: "Engineering checks",
          title: "Check responsive layout and automated accessibility",
          status: "done",
          evidence:
            "Browser/WCAG and overflow checks at mobile and desktop widths.",
          next: "",
          kind: "work",
        },
        {
          id: "M5-5",
          group: "Live acceptance",
          title: "Complete real-client concurrency and revocation tests",
          status: "blocked",
          evidence: "",
          next: "Test two signed-in sessions, live refresh, access revocation and stale writes.",
          kind: "acceptance",
        },
        {
          id: "M5-6",
          group: "Live acceptance",
          title: "Complete physical-phone UX and copy/share acceptance",
          status: "blocked",
          evidence: "",
          next: "Review navigation, controls, compact tournament setup and assistive use.",
          kind: "acceptance",
        },
        {
          id: "M5-7",
          group: "Security",
          title:
            "Resolve password protection warning with appropriate service approval",
          status: "blocked",
          evidence: "",
          next: "Existing leaked-password protection warning was reported, not changed.",
          kind: "acceptance",
        },
        {
          id: "M5-8",
          group: "Security",
          title:
            "Review applicable data classification and GCC scope before broader launch",
          status: "blocked",
          evidence: "",
          next: "Keep government/sensitive records out; document the applicable requirements.",
          kind: "acceptance",
        },
        {
          id: "M5-9",
          group: "Recovery",
          title: "Prove backup/restore and rollback readiness",
          status: "planned",
          evidence: "",
          next: "Use approved bounded test scope; verify history/audit recovery without deleting real records.",
          kind: "work",
        },
        {
          id: "M5-10",
          group: "Performance",
          title: "Measure a realistic large-team/season workload",
          status: "planned",
          evidence: "",
          next: "Establish query/load budgets, measure and fix only demonstrated bottlenecks.",
          kind: "work",
        },
        {
          id: "M5-11",
          group: "Acceptance",
          title: "Record final private-alpha owner sign-off",
          status: "blocked",
          evidence: "",
          next: "All required preceding tests and product decisions must be resolved.",
          kind: "acceptance",
        },
      ],
    },
    {
      id: "M6",
      name: "Release",
      description:
        "A protected preview exists; production launch has separate approval and acceptance gates.",
      tasks: [
        {
          id: "M6-1",
          group: "Private preview",
          title:
            "Maintain protected preview and preserved environment bindings",
          status: "done",
          evidence:
            "Existing Cloudflare Access protects pages/assets; version preview URLs disabled.",
          next: "",
          kind: "work",
        },
        {
          id: "M6-2",
          group: "Private preview",
          title: "Record reviewed source and deployment receipts",
          status: "done",
          evidence:
            "Latest 640fb1c deployed; source and version receipts documented.",
          next: "",
          kind: "work",
        },
        {
          id: "M6-3",
          group: "Launch readiness",
          title: "Complete every earlier milestone before advancing",
          status: "blocked",
          evidence: "",
          next: "All required M1–M5 tasks and acceptance checks must be complete.",
          kind: "acceptance",
        },
        {
          id: "M6-4",
          group: "Launch readiness",
          title: "Prepare release/rollback/runbook and support process",
          status: "planned",
          evidence: "",
          next: "Consolidate approved operating guidance and release verification.",
          kind: "work",
        },
        {
          id: "M6-5",
          group: "Approval",
          title: "Approve the exact production release scope",
          status: "blocked",
          evidence: "",
          next: "No preview approval authorizes new services, broader access or production launch.",
          kind: "acceptance",
        },
        {
          id: "M6-6",
          group: "Production release",
          title: "Publish the approved production release",
          status: "planned",
          evidence: "",
          next: "Execute only the exact approved package, then verify deployment/access.",
          kind: "work",
        },
        {
          id: "M6-7",
          group: "Production acceptance",
          title: "Verify hosted release and owner acceptance",
          status: "blocked",
          evidence: "",
          next: "Check critical workflows and record owner sign-off before marking M6 complete.",
          kind: "acceptance",
        },
      ],
    },
  ],
  deferred: [
    {
      title: "1-up HR rule",
      reason: "Explicitly deferred beyond the first release.",
    },
    {
      title: "Community alibis and Alibi of the Week",
      reason: "Optional future features.",
    },
    {
      title: "Apparel and merchandise",
      reason: "Outside this app-first scope.",
    },
  ],
  changes: [
    {
      title: "Challenge the Call feedback",
      status:
        "Owner and reviewer test submission, owner delivery/readability, reviewed-state persistence and reviewer inbox denial passed",
      milestone: "M2",
    },
    {
      title: "Owner phone acceptance",
      status:
        "Owner confirmed full header, review history/scoring and hosted HR/season checks on October 10",
      milestone: "M2",
    },
    {
      title: "Full Script Northwest phone header",
      status:
        "Released to the protected preview; owner accepted the phone header",
      milestone: "M3",
    },
    {
      title: "Locked logo and app icon integration",
      status:
        "Released to the protected preview; phone appearance and icon review pending",
      milestone: "M3",
    },
    {
      title: "Outgoing email branding",
      status:
        "Local design draft and artwork available; sending capability pending",
      milestone: "M2",
    },
    {
      title: "Private team phone review",
      status:
        "Five exact reviewers have ongoing One-time PIN access on the protected preview; their phone acceptance is pending",
      milestone: "M2",
    },
    {
      title: "Compact tournament continuation",
      status: "Released; owner acceptance open",
      milestone: "M3",
    },
    {
      title: "Inherited HR limits and whole-game recalculation",
      status: "Released; latest hosted rule checks open",
      milestone: "M2",
    },
    {
      title: "Detailed status screen and milestone gates",
      status: "Released to the protected preview; owner phone review pending",
      milestone: "M1",
    },
  ],
};
