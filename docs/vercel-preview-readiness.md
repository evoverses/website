# Vercel beta preview readiness

Assessment: 9 October 2026 (Brisbane). Target: `https://beta.evoverses.com`, repository `evoverses/website`, branch `dan-dev`.

**Planning only. No deployment, domain/provider configuration, AWS provisioning or database migration is authorised by this document.** The [saved hosting plan](beta-hosting-plan.md) remains paused. This assessment supersedes its historical readiness statements, not its deployment approval requirement.

## Current position

The website production build succeeds locally. Inventory now displays account-service HP, PP, recovery and equipped moves for account and NFT Evos; future move names remain hidden. HP follows the agreed species/level curve. Nursery, Store, Epic login, wallet links and Stripe sandbox UI are already in this branch.

A working localhost beta is not yet a working hosted beta. Account login is deliberately disabled in production, and the connection adapters require local Windows readiness files and loopback services. Uploading the website or copying its environment variables will not make these services work on Vercel.

| Area | Verified state | Required before functional hosted beta |
| --- | --- | --- |
| Website build | Next.js 15.3.3 production build passes locally | Upgrade to a currently patched supported Next/React combination, update the lockfile and verify the Linux/Vercel build. |
| Automatic deployment | Both `vercel.json` files disable Git deployment of `dan-dev` | Preserve this block while preparing. Deploy a reviewed commit manually only after approval. |
| Epic/account access | Development gate, localhost-only requests, local readiness files, process-local OAuth Maps | Explicit hosted adapter, beta HTTPS origin and durable one-time OAuth/confirmation state. |
| Backend/database | Account code and data live in the separate game checkout; local PGlite/database files are not website source | Package and review the backend independently; host an HTTPS account API and a separate PostgreSQL player database. |
| Wallet links/inventory | Local private bridge, encrypted shared links, authoritative metadata and ownership checks | Hosted authenticated bridge, configured encryption, beta-bound signatures and fresh ownership checks; preserve shared links and exclusive Evo reservations. |
| Card payments | Sandbox integration exists; fulfillment adapter calls the local account bridge | Hosted transactional order/ledger service, permanent signed webhook and beta return origin. |
| Tester management | Once-only starter flow exists; 5,000-Evoros beta grant and Beta Admin are not implemented | Add invited-tester admission and unique audited grants; minimum protected management controls from the saved plan. |
| Vercel account | No linked `.vercel/project.json` or dashboard settings verified | Inspect the existing team/project, Git access, root, environment, plan, domain and protection settings. |

**Known deployment blocker:** Next.js 15.3.3 is affected by the React2Shell advisory. Vercel states that new deployments of vulnerable versions are blocked. Its original 15.3.x fix was 15.3.6; that is not a claim that 15.3.6 covers every later advisory. Select the upgrade against current security advisories at implementation time. [Official Vercel bulletin](https://vercel.com/kb/bulletin/react2shell).

GitHub also reported **290 dependency alerts on the default branch (22 critical, 140 high, 103 moderate, 25 low)** during the push. These are provider-reported default-branch counts, not a completed audit of `dan-dev`. Review the beta lockfile and reachable dependencies before exposure, alongside the confirmed Next.js issue. [Repository dependency alerts](https://github.com/evoverses/website/security/dependabot).

## Code work before hosting

1. Patch the framework and related dependencies in a separate reviewed commit; retain the existing UI and APIs. Run the production build and account, inventory, wallet, Store and Nursery checks.
2. Introduce hosted connection configuration in `apps/website/src/lib/player/server.ts`. Keep the local adapter for development. Account, wallet and Stripe adapters must call a fixed authenticated HTTPS backend; never allow a browser-selected backend URL or player ID.
3. Replace the fixed localhost origin in `lib/player/auth-core.ts` and the local-only Host/Origin guards in account, wallet and inventory handlers with explicit environment-bound configuration. Use Secure, HttpOnly, host-only cookies and exact mutation-origin checks. Do not set `NODE_ENV=development` or remove checks to make Vercel work.
4. Replace the process-local OAuth state/pending confirmation Maps with durable, expiring, single-use transactions. Verify callback/confirmation replay, concurrent callbacks, multiple web instances and restarts. Keep the existing Epic-to-game account identity mapping and session revocation.
5. Package the backend currently imported by `scripts/player-accounts-local.cjs` from `evoverses-beta-account-bridge/Prototypes/player_economy`, including authored Store/progression/combat data and schema migrations. Remove sibling checkout and Windows path dependencies from the hosted package. Preserve existing catalogue revisions, purchase receipts and PP keyed by move identity.
6. Implement the invited-beta and once-only 5,000-Evoros grant/admin slice locally. A repeated login or invitation cannot repeat a grant. Test permissions, revocation and audited adjustments.

The website push does not publish or back up the separate game backend's uncommitted work or local database. Secure a reviewed backend revision before preparing a hosted image. Do not upload real local account data, backups or ignored configuration to GitHub/Vercel.

## AWS backend proposal, still unprovisioned

Reuse the existing AWS account in Ohio (`us-east-2`) and, if fresh capacity checks permit, a separate logical database `evoverses_player_beta` on the existing private RDS instance. NFT metadata remains in its existing database/read service. Start with the saved small ECS/Fargate API proposal, not a game combat server; refresh networking, capacity and incremental cost before choosing it.

Required package: reproducible container, explicit PostgreSQL connection/pooling/TLS, limited database role, migration procedure through the current schema, health checks, backup/restore evidence and rollback-compatible releases. Verify actual PostgreSQL transactions and concurrency, not only local PGlite fixtures. Use reviewed IaC for infrastructure. Complete the required AWS Secrets Manager skill workflow before configuring AWS credentials or secret values. No AWS secrets were inspected in this assessment.

## Vercel project settings to confirm

| Setting | Intended value/action |
| --- | --- |
| Isolation | Dedicated beta project or an explicitly isolated beta environment; do not change the main site's production domain or environment. |
| Git | `evoverses/website`, approved `dan-dev` commit. Confirm the existing production branch separately before choosing deployment environment. |
| Framework/root | Next.js, `apps/website`. Include source outside the root so `packages/*`, workspace configuration and lockfile remain available. |
| Install | Frozen pnpm workspace install; repository pins pnpm 10.12.3. |
| Build/output | App build `pnpm build` from the app root (direct `next build`); normal output `.next`. Confirm command/root behaviour in the project. Do not set the local isolated-build flag on Vercel. |
| Node | Select a supported runtime consistent with repository `>=22`, and verify that exact major in the clean build. Local success used Node 24.19.0. |
| Domain | Assign `beta.evoverses.com` to the intended beta/preview branch/environment, configure the DNS records returned by Vercel and verify HTTPS. |
| Access | Invited testers plus appropriate preview protection. Ensure Epic callback and Stripe webhook delivery are compatible with protection; do not make every preview public to bypass a callback issue. |
| Variables | Beta/Preview scope only; never overwrite production values or bulk-copy the local `.env.local`. |

Vercel supports branch previews and assigning a custom domain to a branch. The stable beta domain avoids registering changing generated preview URLs with Epic. The exact project's permissions, configuration and DNS records still need dashboard verification. [Git deployment documentation](https://vercel.com/docs/git), [monorepo root guidance](https://vercel.com/docs/monorepos/monorepo-faq).

If the project uses the repository's Turbo build instead of the direct app build, update `turbo.json` environment allowlists for the new account/Stripe settings and validate cache behaviour. The current `website#build` list does not include those settings.

## Provider/environment checklist

Names below describe configuration requirements, not secret values or proof that provider settings exist.

- **Epic:** register `https://beta.evoverses.com/api/player/auth/epic/callback` for the website client; preserve the game product/application/sandbox/deployment binding. Review tester access. Existing `AUTH_EPIC_ID`/`AUTH_EPIC_SECRET` are server configuration; no provider secret enters browser bundles.
- **Accounts:** add hosted origin/API configuration as part of the adapter implementation. Names such as `PLAYER_WEB_ORIGIN` and `PLAYER_ACCOUNT_API_URL` are proposed, not currently recognised settings. Choose authenticated service transport and store durable OAuth/session data in the account service.
- **Thirdweb:** configure the real `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`, `NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN` and beta domain permissions. Explicitly reconcile legacy Thirdweb wallet-cookie authentication with Epic account login: either configure its server-only verifier where still used, or disable the legacy path through a reviewed hosted implementation. A public client ID alone is not a replacement for its existing server signer requirements. Never publish an admin key.
- **Inventory/assets:** provide the intended `NEXT_PUBLIC_EVOVERSES_GRAPHQL_URL`, `NEXT_PUBLIC_BASE_API_IMAGE_URL` and `NEXT_PUBLIC_API_IMAGE_SUFFIX`; check metadata availability and image routes from the hosted site. Ownership verification must remain separate from metadata.
- **Stripe:** sandbox-only `EVOROS_STRIPE_ENABLED`, `EVOROS_STRIPE_MODE=test`, `EVOROS_STORE_ORIGIN=https://beta.evoverses.com`, approved `EVOROS_STRIPE_PRICES`, and private runtime key/webhook configuration. Align the account service's sandbox account/price allowlist. Register one permanent HTTPS webhook at the selected fulfillment host; a localhost forwarding listener is not hosted fulfillment. Do not enable both services to credit independently. Retain signature verification and once-only transactional crediting.
- **Wallet encryption:** server-only account-service key management and rotation/backup plan; preserve masked wallet labels and independent shared-account proofs. Do not reuse or publish the local encryption file/key as a deployment shortcut.
- **Existing integrations:** inventory public pricing, GraphQL/database consumers and error monitoring need a scoped environment inventory. Confirm only the dependencies used by beta routes, without moving legacy admin/engine/game credentials into browser configuration.

## Release sequence and evidence

1. Patch dependencies and test the hosted adapter/backend package locally.
2. Prepare reviewed infrastructure, PostgreSQL migrations, provider callbacks, environment inventory and a cost/rollback plan. No provision/deployment until separately authorised.
3. On approval, start the isolated account API/database, configure providers and the Vercel beta project, then manually build the reviewed commit in the intended Preview/beta environment.
4. Verify Epic creation/re-login/logout; website and game read the same account; once-only starter/5,000 grant; wallet link/unlink/shared inventory; confirmed HP/PP and hidden future moves; sandbox purchase credit exactly once; callback and webhook access; revoked accounts/admin denials; restart persistence.
5. Check responsive cards, Pro visibility, masked addresses, live balance refresh and metadata failure states. Keep Nursery transactions disabled pending contract review and real EVO/card settlement disabled. Neither a ranked combat server nor casual battle simulation is required to host this website beta.
6. Release invited access only after checks pass. Keep a previous tested website deployment for rollback; backend/schema changes must remain compatible with that revision. A website rollback alone cannot undo a destructive database migration.

## Evidence from this push

- Isolated Next.js production build passed, using `.next-beta-check`; the running preview was not replaced.
- 20 inventory tests passed; 12 game-feed/team/bootstrap checks passed; 40 account/login/wallet checks passed; 20 Store/Stripe checks passed.
- Updated the integration fixture's retired 50-HP expectation to Kitsul's level-curve 25 HP, and taught the authentication test harness to load the new real combat parser.
- No live provider configuration, Vercel deployment, database migration or hosted sign-in test was performed. The local build used ignored development configuration; it is not evidence of a clean Vercel build or functional hosted account access.

**Recommended next small sprint:** update Next/React to a currently patched compatible release and rerun these checks. Then implement hosted-ready account configuration and durable OAuth locally, before any AWS/Vercel setup.
