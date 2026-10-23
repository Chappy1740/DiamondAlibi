// Sanitized canonical project checklist. Update after every work session.
import type { ProjectTracker } from "../lib/project-status";
export const projectTracker: ProjectTracker = {
  schemaVersion: 1,
  revision: 73,
  updatedAt: "2026-10-23",
  scope:
    "Required first-release work. Optional future ideas are excluded from percentages.",
  release: {
    commit: "dd2dff4",
    label: "October 22 readiness evidence; phone acceptance remains open",
    status:
      "October 22 dashboard/API reconciliation: published source dd2dff4 was deployed with Worker version prefix 6235a541 at 100% traffic. Cloudflare also records delivery of unchanged-save fix 1435811 with Worker prefix 0be9f387. The current source has a successful Workers Builds check but no GitHub Actions run; full current-source validation and hosted phone acceptance remain unverified. The local readiness patch is based on dd2dff4 and is not published. Historical October 14 receipt: tracker source 13de9f0 (revision 68), Worker a78e8585-9ff6-4135-a589-ed9b74ebb78d; build/delivery evidence only. Prior manager-rules release receipt remains historical: e16b80c / Worker 2361de15-da30-4c5a-9d91-18a73cc2032c. Latest owner-reported iPhone results: seven approved amounts finalized and displayed, Locked by Test Player, creator Change opens the editor, and Cancel returns to Current Rules. Saving unchanged values fails with a could-not-save/team-access message. Non-creator visibility, saved-rule reload persistence and changed-value replacement remain untested. M3-16 remains incomplete. The unchanged-save form fix has historical Chrome/WebKit, typecheck, Worker-build and permission/history evidence, and was subsequently committed and delivered as 1435811. Owner iPhone retest remains open. The prior phone failure remains the hosted acceptance result until the owner retests an approved release. Double Plays remains an unapplied proposal. Earlier release and acceptance receipts, retained as history: Sign-out controls added in e9fb665; ab2ac0e triggered the configured main build. Owner screenshot reported active Worker d40cf3c5. Owner accepted dashboard sign-out to login, signed-out Back/refresh and protected /club. Scorebook control visible; its logout flow remains untested. Personal workflow source 39d7170 passed GitHub validation (66 unit checks, disposable alibi RLS, dashboard loader, actual React/browser workflows, full connected scorebook regression, Worker build and built Next.js pages). Main 97d4251 and redeploy ace4ad6 passed Cloudflare delivery; the latter reported Worker 16aa34b5-4b2b-4772-8752-7584792c897a. Owner reports spacing is much better but not perfect. Compact first/next-game setup is implemented with local typecheck, 22 focused checks, Chromium layout/validation checks, full connected scoring regression and Worker build passing; Source 6c03520 passed complete GitHub validation, including mobile WebKit and Chromium setup checks, 66 unit checks, disposable SQL, scoring regression, typecheck, Worker build and built Next.js pages. UI fix merged as 773a8ca through PR #3. Cloudflare attempt b02beff4-b6d2-4fa6-bdf7-b1cc80643bc9 failed with no GitHub error annotations. The unchanged-UI retry on main 2909ee8 succeeded, reporting Worker c225bfb2-29d1-46cb-933b-6db55d5d59ea (build 34c94f14-e80c-45aa-9986-196a3ae0b0e3). Owner then requested moving the Home notices, selectors and refresh controls below the personal greeting and main actions, and showing full selected names at every screen width. Home now places greeting, competition actions and personal summary before those controls; selected names wrap using native accessible selects. Local Chromium checks cover 320–1440px, keyboard/form selection, credits and offline refresh; typecheck, Worker build and built-page checks pass. Source 29deb01 passed full GitHub run 38462372769, including Chromium/mobile WebKit Home and setup checks, 66 unit checks, disposable SQL, scoring regression, typecheck, Worker build and built Next.js pages. A WebKit native-widget overflow was reproduced and contained while the complete visible-name checks remained strict. Local WebKit Home checks also pass. PR #4 merged as a22d922 and Cloudflare build d9520d8f-b98c-48f5-b6c9-fa1bb18e52c1 succeeded with Worker 796ef769-0cf6-4089-b934-7f9e1ecf4805. Owner's next screenshot confirms wrapped selected names; owner requested removing the brown notice and keeping signed-in Home limited to personal player information. The notice and sample-history entry were removed from signed-in Home, the sample link moved to More, team-wide live cards kept in Games, and aggregate season activity and the all-player shortcut removed from Home. Personal statistics and Beverage balance still use account-linked records only. Team summary and roster statistics remain under Stats. Typecheck, seven dashboard/tracker checks, Chromium/mobile WebKit Home checks and Worker build pass for the personal-only refinement. Browser fixtures verify personal HR 1 and credit 2 on Home while the separate Stats page shows team HR 10 and the other player; no personal records were touched. PR #5 merged as c4875c1. GitHub run 38465437544 passed, and Cloudflare build ff07b7fc-34d2-4092-9ab5-09799e50a006 succeeded with Worker 30cd05af-4e7f-4dcd-a2ab-31c94089fba4. Owner responded that Home looks better, then resumed isolated tournament acceptance. Game 1 is created, but continuation acceptance remains incomplete. Grouped batting buttons deployed as fee6b89 after full GitHub validation, with Worker bae0f67b-400e-4796-8027-3d9191d0301a. The owner reiterated the required walk-in, tap-or-say, carry-on flow. Quick tap scoring and voice entry are explicitly tracked as incomplete M3-10/M3-11. Owner screenshots show the at-bat controls buried after scoreboard/HR settings and large stacked controls. Owner requested 1–4 RBI buttons and a simpler at-bat view. The scorer now puts the batter and compact outcome buttons first, provides 0–4 RBI buttons, and moves game switching, score/inning, HR corrections, lineup controls and play history below the at-bat form. RBI selection raises the visible editable runs value only as needed to satisfy the established RBI <= runs rule. Local typecheck, 15 focused scoring/continuation/tracker checks, Chromium/mobile WebKit compact-page and RBI-button checks, full disposable scoring regression, Worker build and built Next.js page checks pass. The separate confirmed Record plate appearance step remains; voice entry is not implemented. Source 7843272 passed full GitHub run 38475524349. PR #7 merged as 27f426a; Cloudflare build 43ee961b-4d08-4b38-9cfc-bb880284fac3 succeeded with Worker daa666a3-2839-4666-99af-08a46d390b16. Owner screenshots show the compact controls and three saved appearances: two Hits with 1 run/1 RBI each and one Fence HR with 2 runs/2 RBI; game HR limit 2 and HRs used 1 are visible. Owner still reports too many menus and requires an optional coach-entered lineup, with direct named-player scoring when no lineup exists. Optional-lineup implementation and executable SQL proposal are prepared. Owner explicitly approved live application, commit and publication. Migration 20261013235234_optional_lineups is now applied and the authorized capability enables no-lineup scoring. Hosted rollback-only synthetic RPC checks pass; existing ordered games, RLS, grants, HR/Bands, credits, retries and isolation are preserved. No synthetic rows remain and personal game records were not touched. Security/performance advisor notices remain at their pre-migration baseline. Quick result taps, typed/natively recognized named results and a separate management view are implemented; hosted iPhone acceptance remains open. Broad simplicity and tournament continuation acceptance remain incomplete. Private alibi persistence is unapplied.",
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
          next: "Resolve Morgan's reported login-code delivery failure; the owner did not report that failure. Saved reviewer policy reverified October 11. This reviewer acceptance issue does not block unrelated implementation. Each reviewer verifies email-code sign-in, sample history and scoring persistence after reload on their phone.",
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
            "League/tournament combined Board and historical-season isolation tests pass. Owner's refinement requires finalized team-wide Beverage Rules and self-only future-at-bat opt-out/rejoin. The specifically approved migration is applied under M3-14; hosted synthetic RPC checks pass while iPhone acceptance remains open.",
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
            "Compact next-game UI released as 640fb1c; earlier automated checks passed. Acceptance is paused and incomplete. Owner's original account is their main account. Owner created a separate app account and reported an empty team list; its email was not verified by the agent. Owner then created M3-5 Synthetic Test, Test Player, M3-5 Synthetic Season and M3-5 Synthetic Cup with a 2-game guarantee and HR limit 2, not zero. No Game 2 acceptance had been recorded at that earlier checkpoint. An earlier October 13 owner screenshot showed the synthetic cup with no games recorded. Add Game 1 opened setup; the owner identified a repeated header, large connection card, excessive spacing and apparent date-field overflow. The walkthrough was paused for that layout fix and resumed after the Home refinement. Compact first/next-game setup is implemented; Chromium checks verify primary controls, hidden-field validation, date containment, preserved HR/Bands payloads and visible uncertain/offline handling. Mobile WebKit and Chromium setup checks, full scoring regression, typecheck/build and the complete GitHub suite passed on source 6c03520. Owner screenshots then show the bounded date field, saved HR limit 2 with override unchecked, Test Player selected at position 1, and HR Band checked in the setup draft. Owner created Game 1 with opponent label Test game; the scoring screen shows Game 1 live, HR limit 2, HRs used 0 and Test Player next to bat. Later owner screenshots confirm three saved appearances: two Hits with 1 run/1 RBI each and a Fence HR with 2 runs/2 RBI. Game details show HR limit 2 and HRs used 1. The saved Band assignment and Game 2 carry-over were unverified at that checkpoint. The owner supplied a grouped batting-button reference and selected tappable buttons in the dark theme. The connected scorer now presents its nine established outcomes as Hits/Outs/Other buttons. Hit and Out remain aggregate outcomes; no hit/out subtypes or new rules were invented. Selection retains the HR runs/RBI defaults, explicit confirmed save and disabled-state guards. The game selector also wraps its complete label. Local typecheck, 20 focused scoring/service/continuation/tracker checks, Chromium/mobile WebKit scoring/setup and Home checks, full disposable connected SQL/browser regression, Worker build and built Next.js pages pass. Button tests check all nine choices, preserved runs/RBI when reselecting the same choice, HR defaults when changing choice, no write until confirmed, unchanged score payload, offline disabling and 320–1440px touch targets/labels. Source ca18c3d passed full GitHub run 38468757589. PR #6 merged as fee6b89; Cloudflare build 944fd725-c281-448f-8ca5-7caf42540276 succeeded with Worker bae0f67b-400e-4796-8027-3d9191d0301a. Owner later resumed Game 2 setup. Screenshots confirm fence HR limit 2, Test Player selected at batting position 1 and HR Band retained. Owner started Game 2 and its scoring screen shows the carried batter. Owner reported recording a Fence HR; the later Game details screenshot shows two Fence HR appearances, each 1 run/1 RBI. The exact tap count, current HR-used count, Beverage credit and refresh persistence have not yet been accepted. The owner then identified an unrelated League setup form and season-wide controls on tournament Game details. This UI defect paused acceptance again. Management now excludes all new-game setup, game switching and season statistics; audit display is limited to the selected game and relevant shared tournament Band corrections. Actual-route Chromium/mobile WebKit checks verify no setup form, game kind, league selector, game switching, season statistics or Create Game action in either league or tournament management; current-game corrections/audit and Back to scoring remain usable, unrelated audit entries are excluded, and 320–1440px layouts fit. Typecheck, 71 unit checks, complete connected SQL/browser scoring regression and Worker build pass. Owner next clarified that retained Beverage rules should not be editable again on Add Game, subsequent games should reuse the saved date and ask only for a new opponent, the page should stay inside the tournament, and game count must not be capped by the guarantee. Compact continuation now has only the opponent input and Start Game action; saved date, lineup, HR Bands and Beverage values are submitted internally. Existing multi-day history is retained, and the saved latest tournament date carries forward instead of the device current date. Tournament pages show the common date once and compact game cards. The existing full administration component retains explicit cross-date controls; normal tournament entry does not expose them. The simplified flow passes typecheck, 73 unit checks, Chromium/mobile WebKit opponent-only/rules/date/retry tests at 320–1440px, complete connected scoring regression, Worker build and built Next.js routes. Disposable PostgreSQL accepts nine same-day games under a 2-game minimum guarantee, numbered 1–9; the tournament page offers Add Game 10. Read/scoring commands, rules, records, authentication and schema are unchanged. Hosted button acceptance and tournament continuation remain open. No personal game records were touched.",
          next: "Publish the opponent-only tournament continuation and selected-tournament player leaderboard, then resume isolated hosted acceptance one step at a time. Verify the retained date/rules, Game 2 HR-use/credit/refresh and no-lineup mode. M3-5 stays incomplete until explicit owner acceptance.",
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
        {
          id: "M3-9",
          group: "Personal workflow redesign",
          title:
            "Make Home personal, add profile control and competition pages, compact phone setup",
          status: "implemented",
          evidence:
            "Implementation reuses authorized snapshots and existing scoring commands. Login returns Home; leagues/tournaments have games/settings pages; profile menu includes bio, settings, team management and sign-out. Bio uses existing user metadata only as profile text. 55 focused synthetic checks passed locally. Source 39d7170 passed all GitHub checks: 66 unit checks, typecheck, disposable ownership/RLS SQL, actual React workflows, score/setup modes, complete connected scoring regression, Worker build and built Next.js route/mobile checks. Dependency installation and local build/browser checks are now available. Owner's latest Home screenshot requested primary content first and readable selected names. Home controls were moved below the greeting, competition actions and personal summary; native selected text now wraps. Local Chromium layout/keyboard/form checks at 320–1440px, typecheck and Worker build pass.",
          next: "Personal-only Home deployed as c4875c1 and owner responded that it looks better. Isolated tournament acceptance resumed; Game 1 creation is visible in the owner screenshot. Keep Game 2 acceptance open. Owner requested removing the brown notice and keeping team statistics under bottom Stats; this refinement removes the notice, team-wide live cards, aggregate activity and all-player shortcut from signed-in Home, while retaining personal account-linked stats and Beverage balance. Full validation passed on source 29deb01, including Chromium/mobile WebKit Home checks at 320–1440px; long names, native keyboard/form values, credits and offline refresh were verified with synthetic data. Owner accepted improved spacing generally, but requested another setup-format pass. Compact first/next-game forms, small connection status, grouped settings and native date containment are implemented; targeted Chromium/scoring/build checks pass. Mobile WebKit validation also passed in GitHub CI on source 6c03520; hosted phone review remains open. Scorebook logout still needs a separate owner check.",
          kind: "work",
        },
        {
          id: "M3-10",
          group: "Simple game-day scoring",
          title: "Simplify scoring to tap the result, see Saved and carry on",
          status: "in_progress",
          evidence:
            "Owner explicitly requires a simple walk-in, tap-or-say, carry-on flow. Grouped outcome buttons are deployed. Owner then requested RBI buttons and less at-bat clutter. The compact form now places the batter/outcome/RBI/save controls before game management, uses 0–4 RBI buttons and keeps the runs value visible and editable. Normal scoring now saves on the result tap, resets RBI/runs after confirmed save and keeps administration/history on a separate view. Browser tests cover single writes, explicit RBI, resets and offline protection. Hosted owner acceptance remains open.",
          next: "Quick taps and separate management are deployed with confirmed-save count/draft reset and guarded retries. Guide explicit hosted iPhone acceptance for one-tap results and RBI before marking complete.",
          kind: "work",
        },
        {
          id: "M3-11",
          group: "Simple game-day scoring",
          title: "Add voice entry for batting outcomes",
          status: "in_progress",
          evidence:
            "Owner explicitly includes saying what happened in the required simple scoring flow. Typed named-player entry and opt-in browser speech recognition are implemented using existing outcomes. Synthetic Chromium/mobile WebKit contracts verify names, counts, ambiguous/unknown rejection, duplicate final events, microphone-denial fallback and late-offline protection. Actual iPhone microphone behavior remains unaccepted.",
          next: "Define iPhone dictation/recognition support and microphone/privacy behavior, map spoken results and explicit runs/RBI to existing scoring commands, resolve ambiguous input clearly, and provide the same Saved/retry flow. Validate supported-device behavior and explicit hosted owner acceptance before marking complete.",
          kind: "work",
        },
        {
          id: "M3-12",
          group: "Simple game-day scoring",
          title: "Make lineups optional and allow direct named-player scoring",
          status: "in_progress",
          evidence:
            "Owner requires automatic batter advancement with a saved lineup and direct player/result entry without one. Prior start/save RPCs required a nonempty lineup and expected next batter; the approved migration now supports explicit ordered/manual games. Concrete schema, command, Band, continuation, security and validation design is recorded in supabase/proposals/optional-lineup-design.md. Canonical supabase/migrations/20261013235234_optional_lineups.sql is tested against disposable PostgreSQL matching reviewed live function hashes. Existing games default ordered; explicit manual games may have no lineup and choose scoped players per play, with atomic first tournament Band assignment. Owner explicitly approved live application, commit and publication; migration 20261013235234_optional_lineups is applied. Hosted rollback-only checks pass for manual and legacy ordered RPCs, first Bands, retries/fingerprints/conflicts, guests, team/season denial, HR/credit replay, Game 2 reset/carry and archived denial. RLS/grants/search paths and advisor baseline are unchanged; all synthetic fixture rows rolled back. UI source bf6f859 passed GitHub run 38482329940 and merged as 768f779; Cloudflare build b7d83423 succeeded with Worker 6579699d. Hosted owner acceptance is still open.",
          next: "Guide isolated hosted iPhone acceptance one step at a time: verify coach-lineup advancement, arbitrary named-player scoring without a lineup, first tournament Band choice, confirmed saves and Game 2 continuation. Require explicit owner acceptance before completion; M3-5 remains incomplete.",
          kind: "work",
        },
        {
          id: "M3-13",
          group: "Statistics UX",
          title: "Show scoped team and tournament category leaders",
          status: "implemented",
          evidence:
            "Owner requested tournament leaderboards and explicitly chose the team's players using existing tournament statistics. The leaderboard aggregates only selected-tournament authoritative game totals; league/other-tournament totals are excluded. Existing corrections, voids, HR limits, Bands, rules and rates are reused. Hits, HR and RBI ranking controls share ranks for ties. Server rendering passes only the selected tournament player rows to the interactive leaderboard. Unit and Chromium/mobile WebKit tests verify isolation, ties, metrics, immutable source data, effective HR/void/correction totals, existing OBP, long names and 320–1440px layout. Worker build and actual built Next.js tournament pages, including ranking controls, pass. It requires no new schema or public cross-team standings. Owner screenshot confirms the tournament leaderboard is visible, showing Test Player with 9 PA, 8 Hits, 6 HR, 11 RBI and OBP 0.889; the agent has not reconciled all intervening synthetic plays. Owner requests tournament Beverage statistics there too. Each row now displays its tournament-only net Beverage amount as owed, in credit, or Even, using the existing effective game totals and preserving negative credits. Focused units and Chromium/mobile WebKit checks verify tournament-only charges, negative credit, corrections/voids, ranking changes and 320–1440px readability. Typecheck, Worker build and built Next.js routes pass. Season/league balances and accounting remain unchanged. Owner also reported that Game 3 began with HR limit 2 and zero used, then counted two scored HRs. Owner subsequently clarified that Beverage must be a ranking button beside Hits, HR and RBI and an amount in the stat row. The previous balance was secondary text and had no Beverage ranking control. The new Beverage button ranks the existing signed tournament-only net totals, highest owed first, with shared ranks. Every player row now has a prominent fourth Beverage count labelled owed, in credit or Even; negative credits remain signed in the model. Mobile rows keep the player name above the four aligned counts. Eight focused leaderboard/tracker checks and Chromium/mobile WebKit scoring-page checks pass for the Beverage metric, visible fourth counts, owed/credit labels, shared ranks, corrections/voids, source immutability and tournament isolation. Typecheck and Worker build pass; built-page ranking verification is included in the existing Chromium/WebKit route suite. No earned/owed scoring formula, rule, schema, auth setting or personal record is changed. M3-5 and hosted Beverage/leaderboard acceptance remain incomplete. Owner then requested one statistic per leaderboard view and OBP% before Hits, descending; OBS% is interpreted as the established on-base percentage, with no new formula. The current UI supersedes the previous combined leaderboard rows: OBP%, Hits, HR, RBI and Beverages tabs show only their selected statistic, without unrelated PA/OBP details. OBP ranks by the unrounded existing rate, shares ranks for ties, and places undefined values last without a rank. HR uses existing legal fence plus inside-the-park HR totals and excludes voided/over-limit HRs. Beverage remains the signed tournament net balance with explicit owed/credit labels. Personal Home keeps its combined account-linked summary and now includes Hits and RBI alongside OBP%, HR, Reach Base %, PA and the separate retained season Beverage balance. Thirteen focused leaderboard/personal/tracker checks, typecheck, Chromium and mobile WebKit Home/scoring-page layout checks, and Worker build pass. Built Next.js route checks verify all five single-metric views. The owner's last pre-change screenshot showed 11 PA, 8 Hits, 6 HR, 11 RBI, OBP 0.727 and Beverage 3 in credit; this clarifies the earlier reported unchanged balance of 3 as credit, not owed. No personal records, scoring formulas, database schema or auth/access settings were changed. Hosted acceptance of the new views remains open. Source bf2e663 deployed successfully through Cloudflare build 2e7906fd-83b9-4746-864e-6f3cbe2c4f73, Worker 52b40211-6b6b-4f6b-a296-36c4e9e15c89. Owner then supplied a category-leader reference for team and tournament stats: show each category's leader first, tap to see the remaining rankings, limited to the stated track. The current UI supersedes the tabs-first layout with five compact OBP%, Hits, HR, RBI and Beverage leader rows. Tied leaders show the count; one tap opens only that statistic's complete descending ranking, and Back to leaders restores focus to the selected category. Team Stats replaces the mixed table/aggregate summary with the same leader view and explicitly names the selected team, season and Overall/League/Tournament scope. The team projection rejects mismatched contexts/scopes and uses scoped authoritative totals.board rather than the separate season-wide balance. Tournament projections remain cup-only. Personal Home retains its combined account-linked summary. Fourteen focused leaderboard/personal/tracker checks, typecheck, Chromium/mobile WebKit synthetic leader/scoring/Home checks and Worker build pass. The mobile reference layout was visually inspected at 390px; long names wrap, touch targets and 320–1440px overflow checks pass. Built Next.js route checks cover team and tournament leader entry, all five one-stat rankings, return navigation and the shared footer. No new baseball category, scoring formula, schema, auth setting or personal record is introduced. Hosted acceptance remains open.",
          next: "Verify team/season/scope and selected-cup leaders, tied previews, single-stat rankings and return navigation on iPhone after publication; require explicit owner acceptance before completion.",
          kind: "work",
        },
        {
          id: "M3-14",
          group: "Beverage participation",
          title:
            "Finalize team Beverage Rules and let players opt out or rejoin",
          status: "implemented",
          evidence:
            "Owner requires one finalized team rule set, with a personal participation button; owner explicitly confirmed future at-bats only while retaining existing owed balances and credits. Current main 47812e7 and contribution boundaries were reviewed; no AGENTS.md was present. Concrete executable schema/RPC design is in supabase/proposals/team-beverage-design.md and team_beverage_rules.sql. Local private tables store immutable finalized rules, preference events and stable command receipts; server triggers capture participation at each original play boundary so later toggles/corrections cannot rewrite history. Baseball statistics, HR use, Bands and existing formulas remain. Account-linked players can change only their own choice for the selected team, across devices/seasons. Existing records remain participating; no team values are silently finalized. The local UI adds Opt out/Participate on Beverage and one-time rules finalization in team management; new-game setup uses canonical team values internally and removes the per-game editor when the approved capability exists. Disposable SQL tests pass for credits, future-only changes, stats/HR consumption, corrections/voids/replay, self ownership, team/season isolation, archived history, inactive denial, conflicts/retries and ACL/RLS. Owner explicitly instructed Apply push publish deploy. Canonical migration 20261014022554_team_beverage_rules is applied once and enables the capability. Hosted rollback-only synthetic noncaptain RPC checks pass for finalization, self-only choices, credits, opted-out stats/HR/OLHR, rejoin, stale/late retries, corrections/replay, team/season denial, archived/inactive/anonymous denial. Follow-up reads confirm fixture teams/seasons absent; no personal game records were edited or team rules automatically finalized. Live RLS, anonymous/direct-write denial, fixed search paths and reviewed function hashes pass. Advisor differences are expected private-table/unused-index INFO notices; the prior password warning and five unindexed foreign keys remain. UI 4bd093b was published with Worker 1787c168; rollout record f0bb1fa deployed with Worker f33ad218. Owner now confirms seeing Opt out, opting out with unchanged balance, and refresh preserving opt-out. Owner reports a subsequent synthetic Test Player strikeout added no Beverage adjustment, then confirms opting back in with the balance remaining 3. A participating at-bat charge, explicit rejoin refresh, cross-device behavior and one-time team rule finalization remain unaccepted. M3-14 and M3-5 stay incomplete. Owner also identifies the primary bottom menu missing from secondary pages and requires it everywhere; that fix is tracked in M3-15.",
          next: "After the shared navigation fix, resume a participating synthetic at-bat and verify its established Beverage adjustment, rejoin refresh and cross-device persistence. Guide one-time team rule finalization separately. Do not mark M3-14 or M3-5 complete without their remaining explicit acceptance.",
          kind: "work",
        },
        {
          id: "M3-15",
          group: "Navigation",
          title: "Show the primary bottom menu on every app page",
          status: "implemented",
          evidence:
            "Owner reports Home, Games, Stats, Beverage and More missing from secondary pages and requires the menu everywhere. Current main f0bb1fa, CONTRIBUTING.md and project tracker were inspected; no AGENTS.md was present. The bottom menu was implemented separately inside PlayerDashboard and the legacy Workspace, leaving competition, scorebook, team/account, practice/review and auth pages without it. One shared root-layout menu now covers app pages, including loading/error/auth screens, at phone and desktop widths. Page-local copies are removed. URL context carries only team, season, scope and explicit sample/shell choices; game/setup/management commands and auth tokens are excluded. Auth entry clears sample context; review links stay synthetic. Team/season selection survives secondary-page client navigation, with existing authenticated loaders retaining authority. Body space and scroll padding keep final controls accessible above the fixed menu. Menu destinations load when tapped instead of speculatively fetching every section, avoiding WebKit prefetch errors on not-found pages. Nine focused navigation/tracker/sign-out tests pass. Chromium/mobile WebKit Home and scoring modes pass with the shared footer, and actual built Next.js pages pass for Home, league/tournament details, Stats, Beverage, More/alibis, practice/review, status, login/reset request and not-found routes. Checks cover exactly one menu, active tabs, context through links/Back, token exclusion, cleared sample selection on account entry, readable 44px targets and 320–1440px layout. Final controls scroll above the fixed menu. Typecheck and Worker build pass. No scoring, schema, auth security, rules, records or bindings are changed. Navigation source 915b0bd deployed as Worker 2583a7e9. Owner confirms the bottom menu appears on the hosted tournament page. Scoring-page, profile/team, preserved-context and final-control phone acceptance remain open.",
          next: "After publication, guide hosted iPhone confirmation of the bottom menu on the selected tournament and scoring page, preserving selected team/season and keeping controls reachable. Resume the participating-at-bat Beverage adjustment test; keep M3-14 and M3-5 incomplete.",
          kind: "work",
        },
        {
          id: "M3-16",
          group: "Beverage management",
          title:
            "Move Beverage Rules under More with creator-controlled changes and lock attribution",
          status: "implemented",
          evidence:
            "Owner requests current Beverage Rules and who locked them in under More, with Change beside the rules for the team manager. Owner explicitly chose the account that created the team as manager, then approved live application, push, publication and deployment. Current main 7864068, CONTRIBUTING.md, tracker and existing schema/functions were reviewed; no AGENTS.md was present. More has a scoped Beverage Rules page; club management and game setup link there. The active creator alone can finalize or replace defaults; checked server metadata supplies canEdit and the locker’s own-team roster name/server time. Members retain read access and their own opt-out/rejoin; the captain self-tag grants no management or exclusive scoring permission. The immutable command journal captures previous/new amounts, actor, server time and revision. Live/finished games retain their saved rules and balances; new games use new defaults. Canonical migration 20261014115637_manager_beverage_rules is applied once, with its executable body verified against the reviewed proposal and local filename matched to hosted history. Hosted rollback-only manager-permission/default/history tests and the full prior Beverage participation/credit/scoring/correction regression pass using random synthetic identities without emails. Follow-up reads confirm no named fixture teams/seasons remain; no personal game records or team rule amounts were changed. Private RLS/direct-write denial, public invoker wrappers, anonymous denial, fixed search paths and reviewed installed function hashes pass. Existing scoring start, evaluation and season-read definitions are unchanged; advisor counts match baseline. Disposable PostgreSQL, five transport checks, Chromium/mobile WebKit controls and built Next.js routes, Chromium Home/scoring layouts, legacy Beverage SQL, typecheck and Worker build pass. Implementation source was committed locally as 88b0c1c before the explicit live approval. Hosted iPhone acceptance, M3-14 and M3-5 remain incomplete. Historical deployment receipt supplied by owner: source e16b80c, Cloudflare Worker 2361de15-da30-4c5a-9d91-18a73cc2032c; no fresh provider/deployment verification was performed for this acceptance check. Earlier read-only phone observation, preserved as history: the synthetic creator saw the unfinalized-rules message and Set Rules before approval to finalize; no UI failure was established at that checkpoint. October 14 latest owner-reported iPhone acceptance on the confirmed synthetic creator account/team: owner explicitly approved finalizing the seven reviewed amounts and reports finalizing them, with those rules displayed under Current Rules. Reviewed values: strikeout +1, solo fence HR +1, solo fence HR with Band -1, grand slam -1, over-limit HR +1, inside-the-park HR -1 and multi-run HR 0. Owner reports Locked by Test Player, matching the expected synthetic creator, and a visible Change button that opens the amount editor. Cancel returns to Current Rules. Failed owner-reported case: pressing Save with no amount changes shows a could-not-save message instructing refresh/check team access. Cause is unverified; no application fix was implemented and no additional save/retry was requested. Saved-rule reload persistence and actual changed-value replacement were not separately tested. Non-creator visibility remains untested because the owner's other existing app account does not list this synthetic team; no membership was added. M3-16 stays implemented with acceptance incomplete. Separate proposed fix: recognize an unchanged form and show No changes to save without issuing a rule mutation; verify separately that actual creator changes save correctly while member denial, new-game defaults and immutable existing-game history remain intact. This proposal does not authorize application, schema or live-service changes. Double Plays +1 is only a proposed future rule; it is not among the finalized seven amounts and was not implemented. Follow-up local implementation and verification: Local unchanged-save fix approved and prepared after the owner report: the form compares all seven numeric amounts with its last loaded finalized rules before generating a command or calling the save action. Unchanged values close the editor and announce No changes to save. Creator, offline and pending-request guards remain; first finalization and actual replacement still use the original checked save path. Database source explicitly rejects identical replacements with SQLSTATE 22023; the previous form submitted that replacement and mapped it to the generic failure message. The browser regression reproduced the missing-message failure before this fix. Chrome and WebKit now pass unchanged defaults, numeric formatting, custom saved values and changed-then-restored edits with no write/revision/attribution changes, plus actual replacement, cancellation, member/legacy capability fallback, offline/conflict and retry/duplicate behavior. Existing nine Beverage transport/tracker tests, disposable manager-permission/history/credit SQL, typecheck and local Worker build pass. Browser checks wait for rendered offline state and viewport reflow without weakening the disabled-control or no-overflow assertions. No database, authentication, team rules, credits, membership or Double Plays implementation changed. These checks were local at that checkpoint. October 22 read-only reconciliation confirms subsequent commit/delivery of the unchanged-save fix as 1435811; current deployment is dd2dff4 with Worker prefix 6235a541. Real-phone no-change-save acceptance remains open.",
          next: "The unchanged-save fix is already committed/delivered as 1435811; do not repeat publication based on the superseded local-only handoff. Guide one owner iPhone unchanged-save check on the confirmed release and retain non-creator visibility as untested until an existing authorized synthetic member is available. No new rule finalization, real changed-value test or membership change is authorized merely for acceptance. Preserve the seven finalized amounts, prior game rules, credits, audit, authentication and team isolation. Double Plays +1 remains an unapplied proposal requiring a separate charged-player/outcome definition and implementation decision. Keep M3-16, M3-14 and M3-5 incomplete.",
          kind: "work",
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
          evidence:
            "Authentication released. Owner accepted dashboard sign-out to login, signed-out Back/refresh and protected /club after e9fb665/ab2ac0e. Scorebook button visible; its logout flow was not separately accepted.",
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
        {
          id: "M4-29",
          group: "M4.5 Social/integration",
          title: "Write, generate, edit and privately save personal alibis",
          status: "in_progress",
          evidence:
            "Editor and session-verified service implement write/generate/edit/save, reopen/copy/share/edit/delete, revision conflicts and uncertain-save retries. New account-owned persistence SQL passed disposable owner/nonowner/anonymous/forged-owner/retry/conflict/delete/cascade tests in GitHub validation; React editor save/reopen/edit/copy/share/delete tests passed with synthetic transport. No live alibi table exists and no proposal has been applied. Saving stays disabled until setup is available.",
          next: "Approve the exact reviewed persistence proposal before live application, verify live grants/RLS/advisors with isolated synthetic accounts, and complete cross-device saving/deletion and phone copy/share acceptance.",
          kind: "work",
        },
        {
          id: "M4-30",
          group: "M4.5 Social/integration",
          title: "Approve private alibi persistence and security scope",
          status: "blocked",
          evidence:
            "Proposal specifies account-only RLS and explicit grants, invoker RPCs, no team/game links, ownership immutability, revision checks, deletion semantics and provider backup/privacy limits. Community features remain deferred.",
          next: "Review supabase/proposals/personal_alibis.sql and README.md plus disposable test results before authorizing the exact live migration.",
          kind: "decision",
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
          status: "in_progress",
          evidence:
            "October 22: owner approved the recommended fixes. Leaked-password protection alone was enabled in the Diamond Alibi Supabase Email provider; saved dashboard readback and a fresh security-advisor result confirm the disabled-protection warning is removed. Existing Pro entitlement supports it. No accounts, passwords, schema or other auth settings were changed. This verifies configuration, not hosted authentication behavior.",
          next: "Complete separately approved isolated weak-password rejection and strong-password/sign-in/recovery acceptance using only synthetic identity data; see RELEASE-READINESS.md. No account creation, reset email or password mutation is implied by configuration verification.",
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
          status: "in_progress",
          evidence:
            "October 22 read-only dashboard check confirmed seven daily database backups (October 16-22) under Pro; PITR is not enabled and Storage objects are excluded. A bounded synthetic recovery proposal is prepared in RELEASE-READINESS.md. No backup download or restore rehearsal was performed.",
          next: "Owner to approve RPO/RTO, isolated rehearsal target, data handling and cost cap before execution. Prove totals/audit/rules/command-id recovery and team isolation; actual production-backup restorability remains unverified.",
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
            "Sign-out source e9fb665 and build trigger ab2ac0e on main; owner screenshot reported active Worker d40cf3c5. PR #2 source 39d7170 passed automated build/browser/security checks; main Git delivery remains distinct from hosted owner acceptance. Main 97d4251 reported Worker 3a3dcc93-df97-4b18-9ae1-edec2b5ee17b; redeploy ace4ad6 reported Worker 16aa34b5-4b2b-4772-8752-7584792c897a. Compact setup source 6c03520 passed complete CI including mobile WebKit/Chromium, scoring and Worker build. Main 773a8ca merged the fix; Cloudflare build b02beff4-b6d2-4fa6-bdf7-b1cc80643bc9 failed without error annotations. The unchanged-UI retry on main 2909ee8 succeeded as build 34c94f14-e80c-45aa-9986-196a3ae0b0e3, reporting Worker c225bfb2-29d1-46cb-933b-6db55d5d59ea. No further failed-build log is needed for deployment progress; phone acceptance remains open. Live schema proposal remains unapplied.",
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
          status: "in_progress",
          evidence:
            "October 23 pre-merge checkpoint: owner approved bounded completion of PR #9 with no live release. Full validation passed for 9bf13f4 (run 39953093040). Active main-validation ruleset 25721453 requires PRs, resolved discussions, up-to-date code and GitHub Actions validate, with no bypass and force-push/deletion blocked. Saved Cloudflare main command uploads inactive versions; Previews Base and this PR branch use dry-run validation with Preview URLs disabled. A branch upload attempt failed destination validation after compilation; no check was bypassed. RELEASE-READINESS.md preserves hosted, security, recovery, capacity and support gaps.",
          next: "Verify final PR-head checks, approved merge, merged-main checks and inactive upload receipt; record them in the PR handoff. Keep live traffic unchanged. Complete separately approved fail-closed rehearsal, hosted acceptance, support ownership and recovery/pilot decisions before requesting an exact-version live release.",
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
      title: "Double Plays Beverage adjustment +1",
      reason:
        "Owner is considering +1. It is not an approved rule or implementation scope and is not in the finalized seven amounts. Define the charged player and eligible outcome before any scoring/schema change.",
    },
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
      title: "Local unchanged Beverage Rules save fix",
      status:
        "Approved locally after owner failure: unchanged numeric amounts show No changes to save and return to Current Rules without a write. Chrome/WebKit regression, nine transport/tracker checks, disposable permission/history/credit SQL, typecheck and Worker build pass. Existing permission/retry behavior retained. Local fix plus owner acceptance evidence awaits new exact commit/push/automatic-preview approval; iPhone retest and non-creator visibility remain open",
      milestone: "M3",
    },
    {
      title:
        "Beverage Rules finalization and unchanged-save failure — October 14",
      status:
        "Owner finalized the seven reviewed amounts and reports Current Rules, Locked by Test Player, creator Change editor and Cancel return. Unchanged Save fails; proposed fix is recorded separately. Non-creator visibility, reload persistence and changed-value replacement remain untested. Latest published tracker/build receipt retained; this local acceptance update is not published. Double Plays +1 remains an unapplied proposal. M3-16 stays incomplete",
      milestone: "M3",
    },
    {
      title: "Beverage Rules partial iPhone acceptance — October 14",
      status:
        "Owner confirmed the synthetic creator sees the unfinalized-rules message and Set Rules. Saved amounts, lock attribution, finalized creator Change and non-creator controls remain untested; no failure established and no rules changed. Historical e16b80c / Worker 2361de15 receipt recorded without a fresh deployment check or republishing. M3-16 remains incomplete",
      milestone: "M3",
    },
    {
      title: "Compact first and next tournament game setup",
      status:
        "Implemented after owner phone screenshot: competition/game heading, compact status, opponent/start first, grouped settings and date containment. Local typecheck, 22 focused checks, Chromium layout/validation, scoring regression and Worker build pass. Mobile WebKit and the full GitHub suite also passed on source 6c03520. UI fix merged via PR #3. A main Cloudflare attempt failed; unchanged-UI retry 2909ee8 succeeded and reported Worker c225bfb2. Hosted phone acceptance remains open; M3-5 remains incomplete",
      milestone: "M3",
    },
    {
      title: "Personal dashboard, profile, competitions and private alibis",
      status:
        "Implemented with 55 local focused checks and all GitHub checks passing on source 39d7170, including 66 unit checks, disposable RLS, React/Next.js browsers, scoring regression, typecheck and Worker build. Hosted acceptance pending; private persistence proposal remains unapplied",
      milestone: "M3",
    },
    {
      title: "Sign-out and paused tournament acceptance corrections",
      status:
        "Owner accepted dashboard logout; scorebook logout untested. M3-5 separate-account synthetic setup recorded with 2-game guarantee and HR limit 2; acceptance remains paused and incomplete. Morgan's login-code failure belongs to M2 reviewer acceptance",
      milestone: "M3",
    },
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
