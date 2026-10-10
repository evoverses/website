# Beta wallet signing and payment previews - 10 October 2026

## Changes

- Wallet linking previously generated a valid HTTPS beta challenge, then rejected it in the browser because the signing checks were hardcoded to localhost. The browser now binds the challenge to its current, allowlisted page origin: HTTPS beta or HTTP localhost. Chain, wallet address, request identity and expiry checks remain required before the wallet is asked to sign. Foreign origins and cross-origin challenges remain refused.
- Pro Store FIAT/EVO selectors are available for preview; EVO still requires a connected wallet. Purchase buttons and server-side purchase gates remain disabled. Card stays the default. Non-Pro mode still hides EVO references.
- Beta Admin RPC and the token-specific NFT metadata lookup now use Workers-compatible manual redirects. Redirect responses are refused; credentials are never forwarded. Stripe's standby account RPC uses the same policy; purchases remain paused.

## Administration

The deployed `/beta-admin` page and authenticated database-backed API support searching players, approving/revoking tester status, granting the initial 5,000 Evoros once, and awarding additional Evoros, items or unopened Evo packs. Actions require an administrator role, reason and idempotent request ID, with immutable audit receipts. No browser action can promote itself to administrator. Future automated rewards have a disabled extension point.

Danmancs's hosted administrator membership is not yet provisioned. The verified Epic identity must be pinned separately; a display name alone is not an administrator credential. This repair does not promote accounts, grant currency or alter the database schema.

## Verification

- Wallet challenge/handler tests: 10/10, including beta/local origin matching, wrong wallet/chain/URI/scheme, expiry and mismatched challenge identity.
- Administration handler tests: 5/5.
- Store regression: 22/22; inventory regression: 21/21. Public deployment evidence is recorded below after publishing.
- React review: event-triggered signing uses the current browser origin only after client interaction; query/pending state and wallet-change checks remain; payment selectors retain accessible labels/pressed states; transaction guards remain independent of preview selection.

Recommended next step: verify the wallet signature prompt on the public beta, then finish hosted administrator identity pinning and one-time tester/reward checks.

## Public release evidence

Published clean Worker version `b0ffa91b-801c-48d4-a723-5ed4efad895a`. Production build (including TypeScript) and OpenNext adaptation passed. Profile and Store JavaScript served by the public beta match the release SHA-256 hashes. Store and Beta Admin pages return 200; Stripe checkout returns 403 `PURCHASES_PAUSED`. The page is public, but unauthenticated admin operations return 401. No credentials, database roles, tester rewards or production-domain routing were changed.

A real connected-wallet signing prompt remains a human check. The repair is deployed and its origin validation is covered by the automated tests; no actual wallet signature or grant is claimed from this run.
