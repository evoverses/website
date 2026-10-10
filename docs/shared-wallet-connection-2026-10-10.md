# Shared wallet connection - 10 October 2026

Epic is the game-account sign-in. The legacy Thirdweb wallet-authentication embed was removed from `/signin`; it created a separate wallet session and required a server signing key absent from the beta. Wallet connection and signed account linking remain available through the Profile menu in Pro mode.

`/liquidity` previously mounted a second Thirdweb provider and query client through its layout. That isolated its active account from the menu. The layout now retains the root provider, so balances, transaction drawers and the connection control use the same active wallet as Profile, Store and Nursery. Its existing external-wallet connection button remains available when no wallet is connected and hides after connection. Switching/disconnecting through Profile updates the shared context; no legacy wallet login is required.

Epic-backed Profile now includes Liquidity in its Pro navigation without requiring a separate wallet-authentication cookie. Legacy-only Assets navigation retains its existing access path. Role, account-link and purchase/contract gates are unchanged.

Validation: production Next build (including TypeScript), OpenNext adaptation and public page checks are recorded after publication. A real connected-wallet check should confirm that Liquidity displays the same wallet's balances and responds to switching/disconnection through Profile; automated checks do not sign wallet transactions.

## Publication

Production build, TypeScript and OpenNext adaptation passed. Published only to the beta Cloudflare Worker, version `207dcf39-bc43-4833-906e-632e339edb5e`. The installed Thirdweb implementation confirms each nested provider creates a separate connection manager; removing the Liquidity wrapper restores the root manager. No API/database migration or credential change was needed. Next: verify balances using the already connected wallet, then switch/disconnect it through Profile and check Liquidity follows that selection.

## Profile Liquidity navigation follow-up

The sidebar linked to `/profile/liquidity`, but middleware exempted only `/profile` and `/signin` from legacy wallet authentication. Epic-only accounts were redirected before the profile layout could validate their game session. Added the exact Liquidity route to that exemption; the existing profile layout still validates the account and redirects unauthenticated visitors. Assets and other wallet-protected subroutes retain their checks. Removed the duplicate Liquidity entry from the top navigation; Pro-mode Profile retains its sidebar entry and the shared root wallet connection.

Added two middleware regression tests covering the intended routes and preservation of unrelated route protection. Both pass. Publication and live checks recorded below.

Published beta Worker `b5a5bf8d-0215-48e8-a782-d7671498fa5f`. Next.js production build and OpenNext packaging passed. Live Home and Liquidity routes returned 200 without resource errors, and Home no longer contains the top Liquidity link. An anonymous `/profile/liquidity` request contains the expected server-streamed `/signin` redirect from the profile layout. An authenticated Epic/wallet click remains for user confirmation; no wallet transaction was performed.
