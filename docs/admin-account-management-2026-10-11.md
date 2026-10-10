# Account deletion and bulk administration

## Behaviour

The beta administration table supports row checkboxes and selection of up to 50 accounts on the current page. Search, sorting and pagination retain their existing behaviour; refreshing or changing page clears selection.

Bulk actions: approve/revoke beta access, ban/unban, revoke administrator permissions, grant Evoros, grant items/unopened packs and delete. **Make admin remains an individual action.** Ineligible accounts are excluded before confirmation, and the dialog lists affected names. Reward amounts apply to each account.

Delete permanently closes the account, revokes website/game sessions, removes its wallet links and pending link challenges, and hides it from the account table and count. The Epic identity remains closed and cannot register again. It does not physically erase financial, inventory, identity or audit history. Shared-wallet links belonging to other players are preserved. Deletion requires a reason and typing `DELETE`.

Administrators cannot delete themselves or an active administrator. Revoke an ordinary administrator's role first; protected master roles cannot be revoked. Active battle reservations or unresolved trusted battles block deletion.

## Implementation

- Website: `beta-admin.tsx`, strict request/response validation in `beta-admin-handler.ts`, and handler tests.
- Account API: targeted changes to `beta-administration.cjs` and `beta-admin-http.cjs`.
- Migration **018_account_deletion.sql** extends the action constraint only. Migration 017 belongs to concurrent Ranked experience work and is preserved.
- Each account is processed in its own authenticated transaction and receives an immutable receipt. This is deliberately not an all-or-nothing batch.
- A request ID is generated once per account. If confirmation is uncertain, processing pauses; retry uses the original payload/ID and skips completed accounts. Definitive rejections are reported individually. Do not reload the page during an uncertain operation: the pending queue is held in this page's memory.
- Source snapshots of the account API modules, migration and regression tests are included under `docs/evidence/admin-management/backend/` for the website source checkpoint. They are not imported by the website.

## Evidence

- 27 account administration tests passed: authority, protected accounts, stale status, idempotency, session revocation, retained rewards/audit, shared-wallet cleanup and active reservation protection.
- Three tests against the current hosted composition passed, including seven-day sessions, Epic login, encrypted wallet linking, starter grants, unavailable unauthorised paths and database configuration guards.
- 10 website API tests passed, including strict deletion payloads and safe closed-account receipts.
- Headless browser test with synthetic accounts passed: multi-select reward, partial success then uncertain confirmation, identical retry without duplicate rewards, protected admin exclusion, required deletion confirmation and removal from the list.
- Browser checks used synthetic accounts only. No production accounts were deleted or rewarded during testing.

## Rollout

The account image is based on the current Ranked runtime `febb5d811e509f7f259a0824da9aa13066881a92dfe7fad2bc14c64d230aec5f`, preserving its other runtime files and migrations. The administration modules and additive migration are changed. A final composition regression caught the newer image restoring 15-minute sessions; a narrow two-line fix retains the agreed seven-day policy while preserving Ranked v2 and its XP tables. Existing AWS configuration and Worker secrets are retained.

Cloudflare Worker: `0014575b-f721-4f48-aabe-b442d0eee215`.

AWS account API image: `sha256:01e001557c48bd9d3d6c95b3f90fb89b2230c921fdda66aa0e08abbbbc6113c7`; AWS task definition `evoverses-beta-accounts-api:17`, CloudFormation `UPDATE_COMPLETE` and ECS rollout `COMPLETED`, one healthy running task. Migration 018 applied successfully; no production accounts were mutated.

Live smoke checks: sign-in, Store, Marketplace and admin page returned 200; both unauthenticated admin interfaces rejected access with 401. Next.js and OpenNext production builds passed.

**Recommended next step:** use the beta admin table to review and select obsolete test accounts, then confirm deletion. Avoid deleting genuine testers merely because they are not beta-approved.

## Table layout correction

Account table text and row actions no longer wrap. Action buttons retain their width and remain in one row; the existing horizontal scroll container handles narrower screens. Account-ID and suspended-status secondary labels retain their intentional second lines. This is a presentation-only correction; administration behaviour is unchanged. Production build and Worker rollout evidence follows below.

Next.js and OpenNext builds passed. Published Worker `d530b146-1739-4265-b3aa-1ce97108d30d`; the live admin page responds successfully and its published bundle contains both no-wrap layout rules. Recommended next step: refresh Beta Admin and check the rows at your usual window width.
