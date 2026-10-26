# Regular roster players and later account membership

## Result and reuse
All roster entries are team players. Account status is separate: No account / Account linked. Add player reuses the existing authorized roster-save RPC; the internal legacy is_guest field is retained for database compatibility. Scoring setup no longer labels unlinked players as guests.

A player-specific membership invitation links an authenticated account to the exact existing roster player ID. It retains the roster name, saved plays, rules, lineup references, statistics and signed BEV history. No name matching, automatic claiming, account impersonation or history merge is performed. Existing accounts already on this team cannot claim another player; removed memberships cannot reactivate through this path. Review such conflicts separately rather than merging records silently.

Reuse existing ClubForm, private invite code generation/hash/expiry/throttling, member authorization, audit events and redeem RPC. No new dependency, authentication-provider configuration, service, spending or email delivery. Existing member invitation authority is retained; a captain tag adds no access. An external library would add maintenance without replacing any missing platform capability.

## Account-link authorization and privacy
An active member explicitly chooses one unlinked player and confirms that the recipient gains team access, including scoring. The code is a high-entropy bearer invitation, not an independently verified legal-identity check. Share it manually only with that player; no email lookup, automatic sending or public access. One account can redeem it, within the existing seven-day expiry. A current issuing membership is required at redemption. Revoked, expired, used, cross-team and missing-identity requests fail closed. Existing valid same-account retries do not consume another use or duplicate audit events. Concurrent claimants lock the target roster row; one actor's attempt-counter row serializes that actor's redemptions.

The UI separates invitations for an existing roster player from general new-teammate invites, which retain legacy behavior and create a separate record. Private invitation history labels the target and Used/Expired/Revoked states. Missing/unapplied player-invite metadata hides new linking controls and warns rather than falling back to a generic code. No raw codes or hashes are returned by metadata RPCs; codes only appear in the immediate creation response.

## Local database proposal
Unapplied CLI-created migration: supabase/migrations/20261026214921_roster_player_membership.sql.

Adds nullable player_id to private.team_invites, a team/player composite foreign key, a single-use constraint and a covering partial index. Adds member-scoped private creation/list functions with invoker public wrappers and explicit authenticated-only grants. Updates the existing redeem implementation, preserving its signature, public wrapper ACLs, generic invite semantics and throttle. RLS and direct-write denial stay intact. A transaction and current create_invite/redeem_invite definition-hash guards reject source drift before changes. No backfill, deletion or existing roster/default changes.

Source and live catalog hashes match: create_invite ecaba0543eff0655d8db770e41a98993; redeem_invite 34f0f50bb3cc825bd90bf63f2cdace55. This was a metadata-only hosted read; no users, invitations or roster data were read or changed.

## Validation and limits
- Typecheck, 105 existing unit tests and Worker build pass (existing Windows/experimental adapter warnings unchanged).
- Focused disposable PostgreSQL test applies actual membership/scoring migrations and proves the same existing player ID/name, game evaluations, totals and BEVs before/after linking. Checks retries, audit/use counts, same-name isolation, generic compatibility, second-account takeover denial, existing/inactive account denial, issuer revocation, expired/revoked codes, throttling, cross-team/anonymous/direct-write denial and transactional drift rejection. pgcrypto is unchanged in production; the disposable fixture uses explicit test doubles because that extension is unavailable there. This does not establish hosted crypto or independent transaction concurrency acceptance.
- Isolated real server-action tests cover fresh auth, UUID validation, exact scoped RPC, no client-supplied account authority, truthful failure and unchanged general invite dispatch.
- Chromium/WebKit actual roster/invitation components pass confirmation/cancel/keyboard, exact-player payload, labels, add-player, legacy invite separation, statuses, unavailable capability, failure/no false code, 320-1440px and large-text checks. WebKit viewport measurement waits for animation frames; no CSS workaround masks overflow.
- Existing Home and scoring suites run against shared consumers. Automated WebKit is not a physical iPhone or phone/laptop account handoff.

Local-only preparation from deployed main f736b87175a1cc985acb9d1b9209b60449ad4c92 on codex/regular-roster-membership. No live player addition, invitation creation, account creation/link, migration application, email, commit, push or deployment. The owner explicitly approved commit, push, this membership database update and deployment on October 26, 2026. Protected validation, migration guards and actual activation verification remain required.

## Release sequence and rollback
After approval: commit exact reviewed files, protected PR/exact-head CI; recheck function guards; apply the reviewed migration and record its exact version; run advisors/grant checks; merge and verify main validation and matching inactive Worker upload; activate and verify authenticated hosted controls without creating real invitations to test layout. A named synthetic hosted linkage/permission test needs its own data/action scope. Physical owner/test-crew acceptance remains pending.

Additive schema is compatible with the prior app and old two-argument redeem signature. An older app cannot mint new player-specific invitations, but redemption still retains player identity on the server. Retain linked IDs/history; never unlink accounts, delete player data or fabricate merges as a rollback. Forward-fix UI/metadata issues with compatible code.

## Explore audit addendum
| Screen area | Classification | Gap/dependency |
| --- | --- | --- |
| Read-only roster/account-status presentation | Needs Demo Data | Fictional players with mixed account states; clear Demo/Exit labels; anonymous read authorization and API write denial acceptance |
| Add player / create or revoke invitation / redeem membership | Not Suitable for Demo | Real mutations and membership access; disable/deny at API/database boundary in any future Explore implementation |

No Explore or payments implementation. The existing canonical tracker is unchanged; this local work does not close membership, mobile pilot or capacity gates.
