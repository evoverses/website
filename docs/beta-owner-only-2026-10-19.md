# Beta owner access - 2026-10-19

Redirect beta.evoverses.com visitors to the same path and query at https://evoverses.com, except the verified DanMancs player account. The exception compares the authoritative player session result to the deployment setting EVOVERSES_BETA_OWNER_PLAYER_ID. It does not trust display names, wallet addresses, query parameters or browser flags.

The outer Cloudflare Worker gate runs before page, nursery, download, quote and other API handlers. Exact sign-in/OAuth/logout routes remain reachable for owner session recovery; public Next static/image resources remain available to render sign-in. An anonymous visitor, another authenticated player, invalid session or unavailable identity service is redirected. GET/HEAD use 302; blocked writes use 303 to prevent mutation replay at the destination. Decisions and owner responses use private/no-store and Vary: Cookie. No permanent redirects or session-bearing URLs are created.

The gate applies only to the exact beta hostname. This release publishes only the beta Worker. Main website and account-service deployments are unchanged. Nursery contracts, network configuration, wallets and contract permissions are unchanged.

Validation: ten targeted worker tests cover verified owner access, another player, anonymous/invalid/expired sessions, missing configuration, duplicate cookies, endpoint coverage, recovery routes, safe redirect methods, caching and main/local behavior. Focused lint and TypeScript checks pass. The Linux Worker bundle reuses the previously verified Next build and unchanged assets. Isolated Cloudflare runtime checks verify anonymous redirects, blocked POST behavior and working sign-in recovery. Live acceptance and version identifiers are recorded in docs/evidence/beta-owner-only-20261019.json.

To recover beta access after expiry, open https://beta.evoverses.com/signin and use DanMancs' Epic account. To roll back the gate, redeploy the previous Worker version recorded in the evidence file.
