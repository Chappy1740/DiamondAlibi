# Diamond Alibi — Screen handoff index

**Start with [01 — Home](01-home.md).** All handoffs are ready for an owner brief; no screen redesign has been implemented by this pack.

Read [the working standard](00-WORKING-STANDARD.md) once at the start of a screen task, then its individual handoff. Each file identifies actual routes, existing components/tests, preserved behavior, focused acceptance and a completion receipt.

One screen active at a time. Choose a different order if the owner prefers. These are 30 handoff documents, not 30 newly created chats.

| # | Screen | Route / view |
|---|---|---|
| 01 | [Home](01-home.md) | `/` |
| 02 | [Games](02-games.md) | `/games` |
| 03 | [Leagues list](03-leagues-list.md) | `/leagues` |
| 04 | [League details](04-league-details.md) | `/leagues/<existing-league-id>` |
| 05 | [Tournaments list](05-tournaments-list.md) | `/tournaments` |
| 06 | [Tournament details](06-tournament-details.md) | `/tournaments/<existing-tournament-id>` |
| 07 | [New-game setup](07-new-game-setup.md) | `/club/score?team=<id>&season=<id>&setup=1[&tournament=<id> or &league=<id>]` |
| 08 | [Live scorebook](08-scorebook.md) | `/club/score?team=<id>&season=<id>&game=<existing-game-id>` |
| 09 | [Game details and history](09-game-details.md) | `/club/score?team=<id>&season=<id>&game=<existing-game-id>&manage=1` |
| 10 | [Stats](10-stats.md) | `/stats` |
| 11 | [Beverage Board](11-beverage-board.md) | `/beverages` |
| 12 | [More menu](12-more.md) | `/more` |
| 13 | [Team Beverage Rules](13-beverage-rules.md) | `/more/beverage-rules?team=<id>&season=<id>` |
| 14 | [Team management](14-team-management.md) | `/club` |
| 15 | [Roster and invitations](15-roster-invitations.md) | `/club — Roster and Private invitations panels` |
| 16 | [Seasons](16-seasons.md) | `/club — Seasons panel` |
| 17 | [Bio and profile](17-profile.md) | `/more/profile` |
| 18 | [Account settings and logout](18-account-settings.md) | `/more/settings; shared ProfileMenu sign-out entry` |
| 19 | [Personal alibis](19-personal-alibis.md) | `/more/alibi` |
| 20 | [Sign in and registration](20-sign-in.md) | `/login — existing AuthForm modes` |
| 21 | [Forgot password](21-forgot-password.md) | `/forgot-password` |
| 22 | [Reset password and callback states](22-reset-password.md) | `/reset-password; /auth/callback is a non-screen redirect handler` |
| 23 | [Practice scorebook](23-practice.md) | `/practice` |
| 24 | [Review hub](24-review-hub.md) | `/review` |
| 25 | [Next-feature owner review](25-next-feature-review.md) | `/review/next` |
| 26 | [Sample scoring review](26-scoring-review.md) | `/review/scoring` |
| 27 | [Sample history review](27-history-review.md) | `/review/history?route=<supported-sample-route>` |
| 28 | [Reviewer feedback form](28-reviewer-feedback.md) | `/review/feedback` |
| 29 | [Owner feedback inbox](29-owner-feedback.md) | `/owner/feedback` |
| 30 | [Project status](30-project-status.md) | `/status; /api/project-status is its data endpoint, not a separate screen` |

## How we will use this

Tell the agent the screen number/name and the change you want. It should read that handoff and preserve the other screens. Review the result, finish the agreed verification/delivery stages and record the receipt before switching screens.

**Suggested first message:** “Start 01 — Home. Read its handoff. I want to change: [describe the change or attach a screenshot]. Keep the other screens and existing scoring/data behavior intact.”

The index is a planning reference. Existing canonical tracker IDs remain authoritative; source, live version, permissions and prior evidence must be refreshed as needed.
