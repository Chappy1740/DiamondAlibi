# Manager-controlled Beverage Rules under More

Status: owner explicitly approved live application, push, publication and deployment.
**Applied once as migration `20261014115637_manager_beverage_rules` on 2026-10-14.**
Target: existing Supabase project `twfyeoywjexxnhnluomv`. Current source main
`7864068` deployed with Worker `17aea7c3-376a-4f1e-b62d-d8a34ce9b9da`.

## Requested behavior and authority

Owner requested More → Beverage Rules, showing the current amounts and who locked
them in, with Change beside the rules for the team manager. Owner explicitly chose
**the account that created the team** as manager. An active membership is still
required. The self-assigned captain tag grants no management authority and scoring
remains available to all active members.

More → Beverage Rules preserves the selected team context and the shared bottom
menu. Team management links to that page instead of containing the rule editor.
The current seven established amounts, most recent locker’s team roster name and
server timestamp appear read-only. Only the server-confirmed manager sees Change
(or Set Rules before the first lock). The editor pre-fills the current amounts,
allows cancel, and explicitly states that changes apply to **new games**. A sample
view offers no fake finalized values or management capability.

## Exact database changes

Review canonical executable [20261014115637_manager_beverage_rules.sql](../migrations/20261014115637_manager_beverage_rules.sql).
The proposal pointer contains no second executable copy.

* Reuse `public.teams.created_by` plus current active membership; add no manager
  role, automatic grants, user-metadata trust or captain permissions.
* Extend the existing immutable `private.beverage_commands` journal to allow
  `replace` and add nullable `previous_rules`. Existing rows remain untouched.
  A replacement records the old rules, new rules in the checked payload, actor,
  server acceptance time, stable command ID and accepted team revision.
* Replace only three private functions: read-team-Beverage, change-team-Beverage,
  and the settings guard. The public invoker wrapper signatures are unchanged.
* The read response adds checked `management: {canEdit, lockedBy, lockedAt}`.
  Locker identity comes only from that team’s roster and the stored finalizer ID;
  no email, auth metadata or other-team profile is returned. If an old locker has
  no remaining roster record, display “Former team member”. Existing locks retain
  their original actor/time until the manager explicitly replaces rules.
* Only the active creator may first finalize or replace defaults. All members may
  still read the rules; only account-linked players may change their own existing
  participation choice. Guests, anonymous callers, unrelated teams and inactive
  memberships remain denied. Direct table writes remain denied.
* Preserve row-lock order and stable retries. Lock current membership for share,
  then the existing team settings row. Verify revision and exact command fields.
  Record the immutable receipt before changing settings. The guard requires that
  exact journal entry, previous/new amounts, manager identity and server time.
  Late retries return their old receipt without reapplying old defaults. Reusing
  IDs with different payloads is rejected; stale revisions return a conflict.
* Keep private RLS, existing table grants and fixed empty search paths. Only the
  existing authenticated private entrypoints retain execute permission; the guard
  remains revoked from clients. No new exposed table or privileged public API.

## Historical and scoring boundaries

No existing game, rule version, plate appearance, balance, Band or correction is
rewritten. The existing game-start RPC already verifies and captures canonical
team defaults. The frontend already uses the latest loaded team rules at start,
including tournament continuation. A stale start cannot bypass the current rules.
An already-live game continues using its saved version even after the defaults
change. A new game uses the new defaults. Corrections still use that game’s saved
rules and the batter’s captured original participation boundary.

Opt-out/rejoin stays future-at-bats-only and does not change existing owed amounts
or negative credit. A rule change does not alter anyone’s choice. Scoring formulas,
HR limits/Bands, tournament numbering/guarantees and scoring permissions do not
change. Existing initial-finalization checks for conflicting legacy live games
remain. Only later replacements allow live games to continue with their old rules.

## Preflight and security review

Read-only live checks confirm the creator column and these reviewed old hashes:

| Function | Existing MD5 |
| --- | --- |
| read_team_beverage | 7508ced92e5df2896df7b75ad5fdcf44 |
| change_team_beverage | 12d7dd2488ec49c2ac9b91fdecc8080c |
| protect_team_beverage_settings | 128ba24de2cd081ef3b40dd2f80c722a |

The SQL refuses unexpectedly different definitions. Client transport rejects
claimed manager/locker/actor fields, validates amounts and checked read metadata,
and fails closed for editing if the new capability is absent. Saves retain the
same command ID on uncertainty and reload on conflicts; no optimistic success.

Supabase security/performance advisors were read before application. The existing
baseline is unchanged: 11 intentional private deny-by-default RLS-without-policy
INFO findings, the pre-existing password warning, five pre-existing unindexed
foreign keys, and seven unused-index INFO findings. No unrelated auth or index
change is bundled. Remediation references:
[private RLS notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[foreign-key indexes](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Validation and application

`tests/manager-beverage-sql.cjs` applies the exact proposal to disposable PostgreSQL
matching the existing migrations. It verifies legacy non-manager locker attribution,
active creator permission, captain/member/anonymous/inactive/direct-write denial,
immutable before/after rules, guard enforcement, conflicts/retries, new-game rules,
retained live rules/negative credit, participation/rejoin and correction boundaries.
It contacts no hosted service. Transport units and Chromium/mobile WebKit React
checks cover read-only/member/legacy states, manager editing/prefill/cancel,
confirmed saves, participation retries/offline and readable 320–1440px layouts.
Both hosted rollback scripts also pass against the disposable database, including creator-only changes and the complete prior participation/history regression; no hosted execution has occurred. Typecheck and Worker build pass; built Next.js routes cover the More entry/page and
shared footer. All test records are synthetic.

Owner approved the specifically reviewed permission change on 2026-10-14. The
canonical migration was generated with the checksum-verified Supabase CLI v2.81.3,
and its executable body was checked against the approved proposal before applying
it once. The local filename now matches the actual hosted migration history.

Hosted rollback-only scripts for manager permissions/new-game rule defaults and
for the full prior Beverage participation/scoring/credit/correction regression
both pass after application. They simulate random synthetic authenticated actors
through the checked database RPCs, use no emails, and end with ROLLBACK. Follow-up
queries confirm zero named fixture teams/seasons remain. They do not establish
actual owner-account/iPhone or cross-device acceptance. No personal records were
edited, and no team values were automatically locked or changed.

Post-application verification confirms all three private tables retain RLS and no
anonymous/authenticated direct table privileges. Public wrappers remain invoker
functions; all reviewed functions keep an empty search path. Anonymous execution is
denied and the guard remains unavailable to clients. Original scoring start,
evaluation and season-read hashes are unchanged. Installed changed hashes:

| Function | Installed MD5 |
| --- | --- |
| read_team_beverage | edd87c1bb2cc488dc1ec4a6e03d1fec9 |
| change_team_beverage | 64835c3d7bc79d6af8d90272b342dc16 |
| protect_team_beverage_settings | 245cefec5bca0e405949cf5987ca89c4 |

Security/performance advisor notices and counts match the reviewed baseline.
The authorized UI is ready to commit/push/deploy through the existing Cloudflare
Git build. Preserve Access, environment bindings and public Supabase build values.
Hosted iPhone acceptance remains separate; M3-5 and this feature are not marked
done. The private saved-alibi migration remains unapplied.
