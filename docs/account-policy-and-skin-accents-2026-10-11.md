# Sessions, account bans and special-skin accents - 11 October 2026

Status: deployed to the existing AWS account API and Cloudflare beta website after explicit approval. Existing account balances, inventory, DNS and contracts are preserved.

## Seven-day sign-in

The hosted account composition and genuine local Epic account service issue sessions lasting 604,800 seconds. The website accepts that server expiry and sets its independent HttpOnly, SameSite=Lax cookie for no longer than seven days; Secure remains enabled on HTTPS. Database time, revocation and active account status remain authoritative. Explicit logout still revokes the token. Longer session policies are refused. Low-level fixture defaults remain 900 seconds.

This is seven days from sign-in, not a sliding seven-day renewal. Existing 15-minute cookies are not upgraded or resurrected: a fresh login is required once after rollout. Provider proof is still freshly verified at login. No Epic refresh token is stored in the browser.

Temporary profile-service failures now propagate as page errors that can be retried, rather than returning a signed-out/null account. Confirmed INVALID_SESSION still returns signed out. Cookies are not cleared by this read path.

## Ban and unban

The admin account table has Ban/Unban with confirmation and an audited reason. The server validates administrator authority, current target status, idempotent request ID and payload. Ban sets the existing account status to suspended and revokes all current sessions atomically. Backend login and authenticated game/account operations then reject it. This also disables website account access; public pages remain available. Unban restores active status but does not revive old sessions.

Beta tester approval, permanent administrator membership, XP, balances and item/Evo inventories are preserved. Administrators cannot ban themselves, a master administrator or the last active administrator. Closed accounts cannot be reopened. The additive `016_account_bans.sql` migration expands the allowed immutable moderation receipt actions; it does not rewrite or delete existing account records. Friendly/offline game clients still require their existing account/admission integration to enforce server denials; this is not a new client-side anti-cheat system.

## Chroma and Epic presentation

Special-skin accents use a shared appearance mapping: chroma -> violet, super/Epic -> gold, ordinary -> existing silver. Marketplace cards tint the existing metallic frame instead of depending on missing alternate CDN frame assets. Profile NFT Evo artwork receives a faint radial glow using the same mapping; ordinary Evos, items and eggs receive none. Metadata rarity is preserved in the private inventory projection as a fallback. Skin artwork URLs, card geometry, fonts and combat/ownership rules are unchanged.

## Evidence

119 automated checks passed: 48 account/moderation/hosted-composition, 46 website auth/admin/marketplace, 2 session-failure/appearance, 21 inventory, 2 genuine local-service checks. Production Next/OpenNext builds and the Linux account container build passed. Headless desktop/mobile border fixtures confirm ordinary, Chroma and Epic filters; screenshots and fixture details are in `docs/evidence/account-policy`. The visual fixture changes only local read responses and substitutes common art for missing special-skin artwork; it writes no metadata. An authenticated profile visual check remains for rollout.

## Deployment sequence after approval

1. Push the built account image to the existing ECR repository. Pin its digest in the existing database-job and API CloudFormation templates; preserve resource sizes, policies and secrets.
2. Update the migration job definition, run the explicit migration task and verify the additive migration succeeds.
3. Roll out the API image and verify readiness, sign-in session duration, invalid-session denial and ordinary-user admin denial.
4. Publish the already built Cloudflare beta website. Check the public UI and ask an administrator to verify the confirmed Ban/Unban flow on a dedicated test account, then fresh sign-in and profile accents.
5. Save the source/evidence checkpoint to the relevant GitHub branches without including secrets or unrelated game work.

Recommended next step after rollout: fresh Epic sign-in, check profile accents and confirm Ban/Unban on a dedicated test account.

## Concurrent deployment reconciliation

The first migration attempt detected an already-applied `015_ranked_friends.sql` and rolled back on its checksum guard. No schema change occurred. The release was rebuilt on the exact current API image `sha256:0192d6a456c372971fb4c4b237c14c3948c86bebcbaaab84753f85158eadf78b`, preserving its Ranked routes, runtime wiring and all 15 applied migration files. Moderation is migration 016. The rebuilt composition passed all three integration checks; the renumbered account/moderation suite passed 45 checks. Existing Ranked drain/readiness settings are retained.

## Published checkpoint

- Account API image: `sha256:a96de198cd55b17c62c8ff29e6699f9aea0b9d6a81d80a1d726c03659b74eeb5`, task definition `evoverses-beta-accounts-api:8`; API and database-job stacks reached UPDATE_COMPLETE.
- Migration task applied only `016_account_bans.sql`, database version 16, exit code 0. Existing migration 015 is retained byte for byte.
- Worker version: `2f21dfdd-9099-4110-8185-6127a039408f`, route `beta.evoverses.com/*`. Rollback Worker: `b755ef5a-a04f-480a-a0df-57e6c6f65a67`; rollback API image is the current Ranked base identified above. The additive migration can remain during rollback.
- Live HTTP checks: API health 200; unauthenticated API admin request 401; website sign-in, Store and Marketplace 200; same-origin unauthenticated website admin request 401. Cross-origin admin requests remain denied.
- Live desktop/mobile border fixtures pass ordinary/Chroma/Epic rendering; read responses are substituted only in the test browser, without changing metadata. Evidence is in `docs/evidence/account-policy/live-*`.
- The exact four-file API patch plus migration is saved in `docs/evidence/account-policy/account-api-live-integration.patch`, against the current Ranked image. The combined source/image retains its Ranked runtime changes, gated modes and catalogue semantics; this avoids deploying the older local composition over it.
- No production accounts were banned or unbanned to test this release. Fresh real Epic sign-in, authenticated profile glow and a dedicated test-account Ban/Unban check remain human acceptance steps. Old cookies do not automatically gain seven days.

## Brighter profile accents

Following visual feedback, Chroma and Epic profile artwork now uses a brighter layered radial halo (48% centre opacity, 28% inner spread, fading outward), a low coloured floor glow and two soft silhouette drop shadows. Chroma stays violet, Epic stays gold; common artwork has no special glow. Card dimensions, skins, typography and marketplace frame filters are unchanged. Appearance mapping and production Next/OpenNext builds passed. `docs/evidence/account-policy/brighter-glow-examples.png` compares previous/new artwork in light/dark layouts, rendered from the actual InventoryArt component with fixture rows. The same common Kitsul artwork is deliberately used in every example to isolate lighting; these are presentation examples, not changed NFT metadata or account records.

Published brighter accents in Worker `884fe112-0329-4bcb-9e88-1a34ed11048a`; public Marketplace HTTP check passed. No account-service deployment or database change was needed.
