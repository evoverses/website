Current BETA implementation, setup, test commands and release boundaries are documented in the [root README](../../README.md). The environment table below describes older integrations, not the new Epic-only local login requirements.

# EvoVerses Website

## Contributing

### Environment Variables

| Variable                             |     Purpose      | Required |
|--------------------------------------|:----------------:|:--------:|
| VERCEL_URL                           |      Static      |    ➖     |
| NEXT_PUBLIC_VERCEL_URL               |      Static      |    ➖     |
| AUTH_URL                             |  AuthJS - Core   |    ➖     |
| NEXT_PUBLIC_AUTH_URL                 |  AuthJS - Core   |    ➖     |
| AUTH_SECRET                          |  AuthJS - Core   |    ✅     |
| AUTH_REDIRECT_PROXY_URL              |  AuthJS - Core   |    ✅     |
| AUTH_GOOGLE_ID                       | AuthJS - Google  |    ✅     |
| AUTH_GOOGLE_SECRET                   | AuthJS - Google  |    ✅     |
| AUTH_GITHUB_ID                       | AuthJS - Github  |    ❌     |
| AUTH_GITHUB_SECRET                   | AuthJS - Github  |    ❌     |
| AUTH_DISCORD_ID                      | AuthJS - Discord |    ❌     |
| AUTH_DISCORD_SECRET                  | AuthJS - Discord |    ❌     |
| DISCORD_GUILD_ID                     | AuthJS - Discord |    ❌     |
| AUTH_TWITCH_ID                       | AuthJS - Twitch  |    ❌     |
| AUTH_TWITCH_SECRET                   | AuthJS - Twitch  |    ❌     |
| AUTH_EPIC_ID                         |  AuthJS - Epic   |    ❌     |
| AUTH_EPIC_SECRET                     |  AuthJS - Epic   |    ❌     |
| PLAYFAB_TITLE_ID                     |     PlayFab      |    ✅     |
| PLAYFAB_SECRET_KEY                   |     PlayFab      |    ❌     |
| OPENSEA_API_KEY                      |     OpenSea      |    ✅     |
| WALLETCONNECT_PROJECT_ID             |  WalletConnect   |    ✅     |
| NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID |  WalletConnect   |    ➖     |
| DATABASE_URL                         |     Postgres     |    ❌     |
| ENGINE_ACCESS_TOKEN                  |       API        |    ❌     |
| ENGINE_BASE_URL                      |       API        |    ❌     |
| ENGINE_FACTORY_MANAGER               |       API        |    ❌     |
| ENGINE_ACCOUNT_FACTORY               |       API        |    ❌     |

## Ranked league update — 12 October 2026

See [ranked league implementation and release preflight](../../docs/ranked-leagues-and-pro-entry.md). Wins/losses now rank trainers. Monthly Pro requires an all-NFT team and verified monthly EVO entry; fee publication, bonus, cancellation/refund and payout audit controls are implemented locally. Real entry payments and deployment remain paused.

## Deployed beta release — 12 October 2026

Owner authorized deploying the website and matching account service. Applied migrations 021–026 transactionally; the live ledger now contains 26 entries, all matching canonical Git checksums. AWS account API stack reached UPDATE_COMPLETE; ECS API task revision 25 is serving healthy traffic. Backend source: `d4673532224ace754ba2b7d97c13934e50214b62`; image digest: `sha256:98bdf6b001dece7bd40e30ad7f3b7aa0dc3ff9f0acdd4bccf9734b37426cee5f`. The migration job used the same schema from the immediately preceding source checkpoint.

Published website `dan-dev` source `ed5b8a16ad94b3e92bc52004c0ae556cd7726451` to Cloudflare Worker `evoverses-beta`, version `5fc69284-4497-4352-a8e1-77703f915be1`, at https://beta.evoverses.com. Existing bindings, secrets and payment/breeding beta controls were retained.

Owner separately approved removing the extra global Pro payment block: availability now requires published, non-cancelled monthly terms; intent creation still enforces the UTC registration window and account/wallet checks. No fee or bonus was published and no payment was made. Current-month public Pro response has no configured pool.

Live checks: homepage, sign-in, Store, leaderboard and account-admin pages return HTTP 200; Day/Week/Month/All-time, Pro and past-winner APIs return valid public responses. Private Pro administration and entry return 401 without a session. Epic authorization start returns 303 to Epic with a browser-bound cookie. No account impersonation, grants, purchases or competition finalization was used in verification. Signed-in administrator interaction and full Epic credential entry require human review.

No game ZIP, game-server image, provider matchmaking configuration or DNS change was published. Rollback: restore the previous compatible API image and Cloudflare Worker version, retaining the additive schema and immutable ledgers; do not remove migrations. Next: review the leaderboard and beta-admin controls while signed in on beta.evoverses.com. Ranked-dropout resolution and matching game/provider release remain separate.
