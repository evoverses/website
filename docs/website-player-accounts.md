# Local website Epic player accounts

## Current BETA update - 7 October 2026

The verified player balance appears in the menu and Profile. Standard-mode inventory calls creatures “Evos” and makes no references to Pro or wallets. Pro adds a connected-wallet Evos/eggs gallery with an on-chain collection count and chain/collection/owner-filtered indexed details. The account dropdown contains wallet connect/switch/disconnect with shortened addresses. Displaying those assets does not yet create a permanent Epic/wallet association or grant game rights; signed linking and encrypted association storage remain unimplemented. Strict website TypeScript checking now passes. See the root README and Stripe testing notes for the verified purchase and final checks.

## Purpose and current scope

The game and website must identify the same permanent player, so a player sees the same Evoros balance, ordinary game Evos and items in both places. A wallet is optional and separate. Connecting a wallet does not yet prove a wallet-to-player link or add NFT Evos to this account.

Implemented locally on `Dan/website-player-accounts`, based on `dan-dev`. The sign-in background is the user's `Arena.png`, copied unchanged from `I:/Shared drives/EvoVerses/Marketing/Photos` into `apps/website/public/signin/arena.png`. No GitHub push, AWS/deployment change, contract transaction or real payment was made.

## What the player does

1. Open `http://localhost:3100/signin` on the main machine and choose **Sign in with Epic**. Pro mode is not required.
2. Sign in/consent on Epic's own screen. EvoVerses does not collect the Epic password.
3. The website exchanges the one-use authorization code on the server and submits the resulting access-token JWT to the existing player service. That service verifies its signature, issuer, intended client, app/product/sandbox/deployment context and expiry, then resolves the permanent Epic account ID to one player. Browser-selected player IDs, names and wallet addresses do not determine the account.
4. An existing player goes to Profile. A genuinely new Epic player must choose **Create account** before the backend creates a zero-balance, empty-inventory account. The confirmation expires after one minute and revalidates provider evidence.
5. Profile shows the verified trainer name, player XP, Evoros balance and ordinary inventory. The Store shows that player's sign-in/balance, but its purchase buttons and server fulfillment boundary remain disabled.
6. **Sign out** revokes this website session in the backend and clears its browser cookie. The game has a separate session and is not signed out. Epic's browser/Launcher sign-in is independent; a new password prompt is not guaranteed. The UI states this. If backend revocation fails, the browser cookie is still cleared and the page reports the connection problem; the server session expires independently.

## Local setup and commands

Use Windows Node, matching the existing website dependencies. The local `.env.local` is ignored and contains the website OAuth credentials, feature flags and local paths. Keep it private and never put credentials in a `NEXT_PUBLIC_` variable:

```dotenv
EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN=1
NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN=1
EVOVERSES_LOCAL_EPIC_RUN_ROOT=D:/documents/GitHub/evoverses-beta-account-bridge/Saved/EpicAccountLocal-8bb710d070f047de90e266c231af0157
AUTH_EPIC_ID=YOUR_WEBSITE_CLIENT_ID
AUTH_EPIC_SECRET=YOUR_WEBSITE_CLIENT_SECRET
```

Both switches must be enabled **and** Next must be in development mode. Production ignores them. The website selects the dedicated **Website Authentication** client, not the game client. The backend explicitly approves both client IDs, requiring the already reviewed issuer and all four signed app/product/sandbox/deployment claims. Both clients use the same permanent Epic-account namespace, so a verified Epic account maps to the same player regardless of which approved client logged it in. The website requires the running service's readiness record to approve its configured client ID before enabling login.

The website credentials are read only in server code and are not printed, copied into game configuration or passed to client components. The game private INI is no longer read by the website. Restart the local website and account service after changing these credentials; Next hot reload was observed to retain the old route configuration. A production website still requires reviewed hosting, TLS and server-side secret management.

From `D:\documents\GitHub\evoverses-website\apps\website`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1
pnpm dev --hostname 0.0.0.0 --port 3100
```

The launcher reopens the existing reviewed isolated PGlite database and starts only the account service. It starts no Unreal/editor process. It checks for another service using the same run directory and records process ownership before offering a Stop mode. Do not open that database with a second game launcher while this service owns it; the game client can use the **same running API**, rather than a second database instance.

The service closes after two hours, closes the database and revokes local sessions. Restart the launcher when it expires. To stop it early:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1 -Mode Stop
```

The required Epic redirect URL is:
`http://localhost:3100/api/player/auth/epic/callback`.

The website now uses its dedicated Website Authentication client. The displayed portal redirect has been checked against the exact URL sent by the live local website.

This integration accepts only `Host: localhost:3100` and, for mutations, `Origin: http://localhost:3100`. Next may internally construct its request URL using the wildcard bind address; that internal address is not used for redirects or authorization. LAN sign-in and hosted HTTPS are deliberately outside this local configuration.

## Security and implementation

- Server-only configuration: `src/lib/player/server.ts`.
- Framework-independent flow and bounded transport: `src/lib/player/auth-core.ts`.
- Host/Origin/cookie/redirect handlers: `src/lib/player/handlers.ts`.
- Node API routes: `/api/player/auth/epic/start` (POST), `/callback` (GET), `/confirm` (POST), `/api/player/auth/logout` (POST), `/api/player/me` (GET).
- Cryptographically random state and a separate HttpOnly browser-binding cookie; exact matching, five-minute TTL, one-use consumption before upstream exchange, bounded transactions and concurrency. Confirmation proof stays in server memory for at most one minute.
- Exact origin checks on mutating routes. Wrong-host/cross-site requests cannot issue **or clear** cookies. Backend calls use only a fixed configured loopback address and explicit bearer proof/session; no incoming cookies or headers are forwarded.
- Fetches reject redirects, disable caches, limit response sizes and use a five-second deadline. Provider refresh tokens are discarded; no delegated Epic data APIs are used.
- `ev:player-session` is an HttpOnly, SameSite=Lax, path `/` cookie capped at 15 minutes and the backend's session expiry. It contains a random backend session token, not an Epic token. Backend session hashes/revocation remain authoritative. Plain HTTP/no Secure flag is for localhost only; this is not a hosted authentication configuration.
- Existing wallet authentication stays independent. The exact `/profile` and `/signin` game-account pages validate the player cookie server-side; wallet-only profile subroutes retain their wallet-auth guards. Cookie presence or Pro mode never grants either kind of permission.
- OAuth callback responses use no-store/no-referrer. Next incoming-request logging is disabled to avoid codes appearing in URLs in logs. Sentry/Spotlight/error replay are disabled in the explicitly flagged local player-login mode. Handler errors are safe fixed status labels; provider responses, tokens and credentials are not logged.
- OAuth transactions live in bounded single-process memory, so a website restart invalidates in-progress callbacks and confirmations. Permanent players and backend sessions use the durable local database. Production needs an appropriately secured shared transaction/session design, TLS, reviewed client configuration and server-side secret storage before deployment.
- The local account service pins the reviewed Epic issuer, both explicitly approved clients and all four signed context claims. A web token with a different issuer/context fails closed; do not loosen those checks based on browser/token input. Confirm a genuine token and explicitly review any necessary trusted configuration extension.
- No wallet linking or identity-field encryption is implemented here. Do not yet claim the Epic-to-wallet association is stored encrypted; no such association is created by this work.

## Verification and work log - 6 October 2026

- Seventeen focused website player-auth tests passed: endpoint/state construction, browser binding, replay/expiry, explicit new-player confirmation, cancellation, invalid evidence, session hydration/revocation, bounded responses/budgets, CSRF cookie protection, cookie flags, duplicate query rejection, logout, production-disabled configuration, actual fractional backend timestamps and bounded integer session-cookie lifetimes.
- Five existing preview authentication tests passed alongside those tests.
- Local Edge checks passed: Arena loads, Epic button ready, anonymous player API returns 401, hostile Origin returns 403 without Set-Cookie, OAuth start uses the registered callback and HttpOnly state, invalid callback is refused, forged player cookie cannot enter Profile, mobile layout fits. No provider sign-in/password/consent was automated in these checks.
- Full TypeScript checking retains the six previously confirmed address errors in legacy wallet/liquidity components; new player-auth code adds none.
- Genuine website Epic sign-in is now observed after the client repair: the successful-login and verified-name counters increased while one player and identity were retained. Visual profile comparison and browser sign-out/relogin remain user checks. Automated tests do not replace those checks.

## Recommended next step

Complete the local genuine Epic rehearsal: same account as the game, matching player identity/name/balance/inventory, sign out, confirm the old website session cannot read inventory, then sign in again. After that, build the optional signed wallet-link challenge and encrypted private association, followed by authoritative NFT ownership projection. Local Stripe test Checkout is now connected; see [stripe-local-testing.md](stripe-local-testing.md). Keep live purchases disabled pending review and hosted payment rehearsal.

Primary protocol reference: [Epic Auth Web APIs](https://dev.epicgames.com/docs/web-api-ref/authentication), read in the browser on 6 October 2026. The documented confidential authorization-code flow returns an access-token JWT and uses the registered redirect plus state; PKCE and a forced-login prompt are not claimed or invented for this provider.

### Real form submission repair

The first user click returned `ORIGIN_NOT_ALLOWED`. The sign-in page's `no-referrer` document policy caused a real HTML form POST to send `Origin: null`; the earlier API-request browser check explicitly supplied Origin and missed this difference. Changed the **sign-in document** policy to `same-origin`, so its start/confirmation forms send the genuine localhost Origin while cross-origin referrers stay hidden. The **callback/API responses** still use `no-referrer`, and null/foreign Origins remain rejected. Added a real-button browser check with Epic navigation intercepted before leaving the machine; it confirms the actual form sends `Origin: http://localhost:3100` and reaches the Epic redirect without the local error. The first attempt did not issue a player session.

Reference for browser behaviour: [MDN Referrer-Policy and Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy#effect_on_the_origin_header).

### Final local checks

The real-form regression is saved as `apps/website/scripts/check-player-preview.cjs`. With the local services running, run `node scripts/check-player-preview.cjs` using Windows Node. It uses Playwright from the bundled Codex runtime (override `EVOVERSES_TEST_RUNTIME_PACKAGE` if that runtime lives elsewhere). It intercepts Epic navigation locally; it does not enter credentials or automate user consent.

Seventeen player-auth tests, five preview-auth tests, four Store balance tests and nineteen Store pricing/payment tests passed (45 total). The Pro mode browser regression also passed after the account integration. The genuine account-service counters remain unchanged until the user completes the real Epic sign-in; these checks do not manufacture a player session or grant inventory.

The first origin failure is fixed and the user has been asked to refresh the sign-in page and retry. The genuine Epic → shared-player → sign-out/relogin rehearsal remains the next required validation before calling the website login fully verified.


## Epic redirect registration check - 6 October 2026

The user screenshot shows Epic's **Invalid Client: Redirect URL is not known to the client** screen. This happens before the website callback or player-session creation. Source inspection confirms the authorization request uses the exact callback above and the reviewed client ID `xyza78914jtYp1AO4tkY93GkpzcvTu8f`. Register that callback on the matching client in the Epic Developer Portal and retry from the local sign-in page. A redirect registered only on a different WebsiteClient would not cover this request; that possibility has not been verified against the portal. Do not change the game's existing redirects or weaken local origin checks. No portal setting was changed in this check, and genuine website account sign-in remains pending.

Follow-up: the user still sees the same Epic redirect error. A live local POST to the start endpoint returned HTTP 303 to Epic `/id/authorize`, with the same reviewed client ID and exact callback URL listed above. No authentication code, state, cookie, client secret or provider response body was logged. Matching portal registration remains unverified; request a view of that client's redirect setting before changing code or other portal settings.

Screenshot comparison: the portal client is named **Website Authentication**, uses policy **WebsiteClient**, and already lists the exact local callback (twice). Its public client ID differs from the reviewed game client used by the website. The screenshot therefore confirms a client wiring mismatch, rather than a missing URL on the displayed website client. The website's ignored `.env.local` has no `AUTH_EPIC_ID` or `AUTH_EPIC_SECRET` configured. Next: obtain the website client's exact ID and secret through that local file, then explicitly allow its signed application/product context in the account service and select those server-only credentials for website OAuth. Preserve the existing game configuration. The masked secret in the screenshot cannot supply the required credential; no secret was extracted or printed.


## Website client wiring repair - 6 October 2026

The user provided Website Authentication credentials in the ignored local file. Changed website server configuration to use those credentials and require a matching `websiteClientId` in the service readiness record. Created a website-owned account-service launcher that imports the existing game's account, verifier, HTTP and PGlite modules; no game source or private configuration changed. Its allowlist adds only the configured website client alongside the original game client, with identical issuer/application/product/sandbox/deployment restrictions and player namespace. The process receives local paths on its command line, never credentials. Ownership checks prevent a second instance opening the same database and preserve precise Stop behaviour for the old and new owned launchers. The same thirty-minute expiry, local-only API and disabled payments remain in effect.

The original service had already expired. Started the new owned service and restarted only the website preview to remove stale route configuration. A live local start request now sends the Website Authentication client ID `xyza7891pYyJBBWl9JM5GaAOt7zWIaiK` and the exact registered callback. Added configuration rejection/readiness tests and an isolated, RSA-signed shared-account test: game and website resolve one player, unapproved client/wrong context/issuer/forged signature issue no sessions, and website logout leaves the separate game session valid.

Twenty-one player-auth tests and five preview-auth tests passed (26 focused tests in this repair). Full TypeScript checking still reports only the six previously recorded legacy wallet/liquidity address errors. The local real-form/Origin/cookie/CSRF/forged-session/mobile browser regression passed after the restart. An optional `EVOVERSES_TEST_EPIC_CLIENT_ID` assertion checks the client actually sent by the HTML form. These tests use synthetic signed evidence or intercept Epic navigation; genuine Epic sign-in and token acceptance remain pending user verification. No GitHub push, deployment, payment or Epic portal change was made.

Launcher lifecycle checks also passed: attempting a second start refused to open the same database; the ownership-checked Stop closed the service; restart reused the existing database. Confirmed `.env.local` is ignored by Git and the website remains on `Dan/website-player-accounts`.


## Local Evoros display grant - 6 October 2026

At the user's request, credited the sole existing active Epic player with **10,000 test Evoros** in the isolated local player database. The offline operator script is `apps/website/scripts/grant-local-test-evoros.cjs`; it requires the reviewed run directory and closed-service marker, creates no player/session, and is not imported into any HTTP route. Existing schema supports only payment credits/store debits, so this uses the existing synthetic test-receipt mechanism with explicit `mode=test`, scope `acct_local_manual_test_evoros_grant`, and `cs_local_manual_grant_`/`price_local_manual_test_only` references. These are local fixtures, not evidence of an actual Stripe payment, token transfer or revenue. No external payment service is contacted. The balance and matching ledger are credited through `PlayerEconomy.creditOnce`.

Grant operation UUID: `1e7eb9de-544d-4d50-a1f0-63d44c58ff8d`. The first completed run returned `credited`, amount/balance 10,000. Repeating the same operation returned `already_credited` and balance stayed 10,000; the existing balance-versus-ledger check passed. An initial uncredited draft used an invalid test-scope prefix; removed only that operation's pending local draft with no receipt/ledger/session association and corrected the scope before the successful grant.

Stopped only the owned local account service before opening PGlite and restarted it afterwards. Stopping revokes local sessions, so the user must sign in again to see the new balance on Profile and Store. Their preceding genuine website login had incremented the service's successful-login counter while retaining one player/identity and applying the verified Epic display name. Genuine website login is therefore now observed; visual balance display and sign-out/relogin remain user checks. Purchases remain disabled.

After restart, service status confirms one player, one identity and total Evoros 10,000. The next user check is to sign in again and review the balance on Profile and Store; no purchase flow was enabled by this grant.


## Stripe local purchase integration - 6/7 October 2026

Connected the signed-in website account to the existing account service's durable payment-order/Evoros ledger through a private loopback bridge. No game source or production infrastructure changed. Six existing Stripe test products were activated and CLI forwarding was started with private local secrets. The account service's test lifetime is now two hours. Live and EVO purchases remain disabled.

The user's genuine **500-Evoros / $5 test purchase** was paid in Stripe and credited to its reserved existing player; balance changed from **10,000 to 10,500**. Two signed local duplicate confirmations returned `already_credited` and left the balance unchanged. Thirty unique Store/payment tests passed, including persistent SQL/RPC retry/restart cases; anonymous browser security/mobile checks passed. See [Stripe local testing](stripe-local-testing.md) for setup, commands, limits and next steps. Next recommended step is cancellation/decline testing, then delayed confirmation/recovery.
