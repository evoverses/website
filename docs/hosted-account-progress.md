# Hosted account preparation - 9 October 2026

The user requested a public beta release. Anyone with the address may browse and create/sign into an Epic-backed account. Tester approval controls the once-only 5,000-Evoros reward; it is not an invitation requirement. Payments and Nursery transactions stay disabled. Nothing in this sprint was deployed.

## Implemented

### AWS and Cloudflare execution checkpoint - 9 October 2026

- Dedicated player PostgreSQL database and restricted application/migration roles are now provisioned in AWS Ohio. Migrations 001–013 completed successfully, including encrypted wallet links. Existing NFT metadata tables were not migrated or replaced.
- AWS account API is running at `https://beta-accounts.evoverses.com`: verified HTTPS liveness 200, unauthenticated profile and fabricated Epic login 401, payment-order route 404. The wallet-capable API update reached UPDATE_COMPLETE with a healthy load-balancer target.
- Public-beta origin handling now covers wallet actions as well as account, inventory and administration routes. Wallet signing uses the exact HTTPS beta domain; Pro inventory reuses current NFT ownership readers. Local preview retains localhost guards.
- Website production build and OpenNext adaptation passed with real public image/API/client-ID settings, no credentials in the build. Worker `evoverses-beta` is published only on `beta.evoverses.com/*` in the EvoVerses Cloudflare account, with workers.dev and preview URLs disabled. No Cloudflare subscription was created or changed.
- User confirmed the API DNS CNAME and Epic beta callback are configured. Cloudflare OAuth publishing access is established.
- After explicit destination approval, the existing Epic website secret and AWS website-service credential were transferred through official `asm-exec` and Wrangler stdin into encrypted Worker secrets. Values were not printed or included in source/build files. Beta-only routing was activated; the production domain was not changed.
- Latest tests: backend hosted auth/runtime **15/15**, native PostgreSQL **44/44**, website wallet handler **7/7**. Full production build includes TypeScript checking. Payments and breeding transaction guards remain disabled.

The live Stripe checkout endpoint returns 403 `PURCHASES_PAUSED`. Public checks returned 200 for Home, Sign-in, Store and Nursery; unauthenticated Profile redirects to Sign-in and `/api/player/me` returns 401. Static CSS loads. Initial Epic handoff exposed Workers incompatibility with fetch `redirect: "error"`; the fix uses `manual` and explicitly refuses 3xx responses. A redirect-regression test was added.

Clean release version `20397b86-9b25-4cc4-989d-42afb8dc6c3a` removed temporary diagnostics. Public Epic start now returns 303 to `www.epicgames.com/id/authorize`, with the exact beta callback and a Secure cookie. The website auth suite passed **23/23**, including the redirect regression; the isolated Linux run passed 22 tests but lacked the sibling database fixture, so the complete suite was rerun successfully from the real Windows checkout. Production build and OpenNext adaptation passed again.

Next: complete real Epic login, then pin the verified administrator and check tester/reward grants. These steps do not deploy a battle server or mainnet contracts. Detailed infrastructure evidence is in the game repository's `Documentation/aws-beta-release-progress.md`.

Earlier sections below record preparation-stage evidence and limitations; this execution checkpoint supersedes their deployment status.

- Added an explicit production `EVOVERSES_HOSTED_BETA=1` account adapter. Local development switches cannot enable it. Configuration must provide a fixed HTTPS API origin and the reviewed Epic website client, application and deployment IDs. No credentials were read or provisioned.
- OAuth redirects use `https://beta.evoverses.com/api/player/auth/epic/callback`. State, confirmation and session cookies are HttpOnly, SameSite=Lax and Secure on the beta domain, with no shared parent-domain cookie. Mutations require the exact beta Host and Origin; redirects are not derived from forwarded headers or client input.
- Hosted login cannot fall back to process-local Maps. The website uses an authenticated server-to-server OAuth RPC. Service credentials are sent only to the configured account origin, never Epic or the browser. Account API calls retain independent player-session authorisation.
- Added private account migration `012_web_oauth.sql` and a shared PostgreSQL transaction store. State lasts five minutes; account confirmation lasts one minute, measured by database time. Only hashes of state/browser binding/context are stored. Confirmation proofs use AES-256-GCM with authenticated context and a separately supplied 32-byte key. Atomic deletion makes callbacks/confirmations one-use across instances. Expired rows are pruned on insertion or explicit cleanup.
- Added service-authenticated, bounded OAuth routes to the explicit account-service composition. Read-only API factories do not register these routes. These are backend endpoints, not browser APIs.
- Adapted account profile, inventory and Beta Admin HTTP origin handling for the beta domain while preserving localhost preview behavior. Existing account suspension and administrator permission checks remain; no tester admission gate was introduced.
- Added a source-only backend exporter that includes authored catalogue/progression/combat definitions and numbered migrations. Its 45 exported files load from a temporary directory without sibling checkout imports. It excludes local records, secrets, backups, fixtures and launchers. It is deliberately labelled **libraries only; runtime not yet packaged**.

## Evidence

- Website authentication/client configuration/Admin: **31/31 passed**, including hosted-origin cookies, synthetic Epic exchange, replacement website/backend instances, encrypted PostgreSQL confirmation storage, replay rejection and safe RPC response checks.
- Inventory suite: **21/21 passed**, including exact beta-origin access, ordinary inventory, linked NFT validation, hidden move names and current HP/PP projection.
- Backend OAuth/Auth/Admin: **50/50 passed** with embedded PostgreSQL. No real provider credentials used.
- Website TypeScript `tsc --noEmit --incremental false`: passed before the final origin-test additions; final production build checks it again.
- Added an eight-independent-connection native PostgreSQL test for callback and confirmation races. The initial attempt failed before container creation because the Docker socket was unavailable. At the user's request, the WSL Docker service and its socket were restarted; the native suite then passed **43/43**, including both one-winner OAuth races. Evidence: sibling game `Saved/PlayerEconomyNative/44bf906686cd/summary.json`. The owned test container and volume were removed; the existing Frigate container returned healthy. Windows Docker Desktop was not started.
- Source export validation: all 45 exported library/schema/data files copied and every CJS library imported successfully. No executable hosted service or infrastructure was started.
- Final isolated Linux Next/OpenNext/Wrangler dry-run build passed with synthetic hosted settings enabled. Evidence: `/tmp/evoverses-cloudflare-Ijjl5c`, log `/tmp/evoverses-hosted-cloudflare-check.log`. Bundle: 31,113.11 KiB uncompressed / 8,503.75 KiB gzip; 1,264 assets. TypeScript passed. Existing lint/third-party bundler warnings remain. No real account service/provider was contacted or deployment attempted.

## Configuration contract

| Website setting | Purpose |
| --- | --- |
| `EVOVERSES_HOSTED_BETA=1` | Enables hosted account routes in production; not payment functionality. |
| `AUTH_EPIC_ID`, `AUTH_EPIC_SECRET` | Website Epic OAuth client. Secret remains server-side. |
| `EVOVERSES_EPIC_APPLICATION_ID`, `EVOVERSES_EPIC_DEPLOYMENT_ID` | Exact reviewed Epic context; backend must independently verify all signed game context claims and allowed game/website clients. |
| `EVOVERSES_ACCOUNT_API_ORIGIN` | Fixed HTTPS origin of the AWS account API; no paths, userinfo, direct IP or redirects. |
| `EVOVERSES_ACCOUNT_SERVICE_TOKEN` | Website-to-account service credential for internal OAuth RPC; distinct from player sessions. |

The backend OAuth encryption key and service token must be injected through reviewed hosted secret handling. Rotating the OAuth encryption key invalidates pending confirmations; it does not alter player records. Do not reuse wallet encryption keys or expose any of these settings through `NEXT_PUBLIC_*`.

## Release blockers that remain

1. Package and test the actual account runtime against private native PostgreSQL, including pooled connections, health checks, explicit migration/version handling and graceful restart. Do not deploy the local PGlite launcher or expose its loopback bridges.
2. Adapt and test the hosted wallet bridge and its signed-message origin. It currently remains **local-only**; this sprint does not claim hosted wallet/NFT inventory readiness.
3. Apply reviewed AWS infrastructure/database permissions and secrets. The previously audited AWS state may have changed; refresh its resource IDs/capacity before applying changes. No AWS tools or the required `aws-secrets-manager` skill were available in this session. The user's exception covered local code and synthetic credentials only.
4. Obtain Cloudflare deployment access. Connected-tool and plugin discovery returned no Cloudflare integration. No CLI login or real credential handling was attempted. Configure beta-only routing, retaining the production website, and remove the current beta-to-main redirect only as part of verified cutover.
5. Register the beta Epic callback, configure Thirdweb's allowed beta origin, perform real login/logout/account/Admin/wallet smoke checks, and measure hosted Worker startup/request limits. Stripe stays on standby.

**Recommended next step:** finish the runnable native-PostgreSQL account package and hosted wallet adapter while provider access is restored; then perform one integrated staging check and publish the beta. Do not repeat the already-passing catalogue, grant or static compatibility work unless a new change requires it.

## 10 October 2026 - account administration publication

The latest role/table release supersedes older administrator-pinning blockers above. DanMancs is now a verified protected master administrator in AWS, independently of tester approval. Schema 014, guarded ordinary role changes and the searchable/sortable administration UI are deployed. Docs/About menu links are hidden. See [current administration release evidence](account-administration-2026-10-10.md). Payments and Nursery transaction gates remain disabled. The second master account has not been supplied.
