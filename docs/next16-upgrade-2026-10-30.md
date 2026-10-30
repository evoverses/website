# Next.js 16 website upgrade - 30 October 2026

The user authorised the upgrade, testing and production deployment after the
Profile crash repair. This release builds on that repair and preserves the
deployed nursery and marketplace fixes.

## Changes

- Next.js and its lint packages: 16.4.3.
- OpenNext Cloudflare adapter: 1.20.14, including its Next.js 16 concurrent-render
  request-context fix.
- React and React DOM: 19.3.1, with consistent 19.3.0 React types across packages.
- Sentry: 10.78.0; NextAuth: 5.0.0-beta.32, both declaring Next.js 16 support.
- Production and compatibility builds select Webpack. The existing Edge
  middleware convention preserves the deployed authentication boundary; renaming
  it to `proxy` would select the Node.js runtime.
- The lint command uses the ESLint CLI because Next.js 16 removed `next lint`.
- Two existing authentication test loaders now handle the learned-move JSON
  import used by the Profile repair. Their assertions remain unchanged.
- A packaged-Worker check exercises 24 concurrent renders and verifies that each
  response includes the complete HTML document.

The earlier support warning came from the older adapter's two-year cutoff.
Next.js has extended version 15 security support through 31 January 2027.
Next.js 16 is the current Active LTS release. This build does not use OpenNext's
unsupported-version override.

Sources: [Next.js support policy](https://nextjs.org/support-policy),
[Next.js 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16),
[OpenNext releases](https://github.com/opennextjs/opennextjs-cloudflare/releases).

## Verification

- 263 account, OAuth, wallet, Store, nursery, marketplace, leaderboard and preview
  regression tests passed.
- 33 inventory tests passed, including the real local account service and SQL.
- Website TypeScript check passed. ESLint reported zero errors and 101 warnings.
- A fresh Linux install verifies the locked production dependencies without the
  stale React type link left by the first incremental Linux install.

Source checkpoint: `1f0f0f267907dac8005a58e5e6479947febe6dee`.
The clean Linux production build and OpenNext adaptation passed without the
unsupported-version override. The packaged Worker passed ten runtime checks,
twelve stale-cookie page checks and 24 concurrent renders with complete HTML.

After deployment, eighteen live HTTP checks passed, including anonymous access
controls and hostile-Origin rejection. Eight concurrent live renders completed,
and the Profile JavaScript SHA-256 matches the tested release.

I reloaded the existing signed-in Chrome Profile, opened account and NFT move
cards, loaded all 49 NFT holdings, and navigated to the signed-in Store and back.
The Profile retained four account Evos and six item types; Dawnbrew Elixir shows
quantity two. The move cards retain learned names and PP. The browser reported
no console errors during these checks and no broken images among 62 image
elements. I did not repeat a new Epic OAuth login, submit a payment or wallet
transaction, or change live account state. The regression suite covers OAuth
exchange, durable transactions, session isolation and wallet authorization.

## Deployment and rollback

Target: existing `evoverses-production` Worker and `evoverses.com/*` route.
Preserve dashboard variables and encrypted secrets with `--keep-vars`.
Previous healthy version: `a68628cf-c434-409a-96ca-75fd24a8907f`.
Deployed version: `ac41e66b-6ca2-4be8-a612-fa3e9f7279ee`, verified at 100% traffic.
No database, account-state, contract, payment, API-service or game release changes
are included. Beta is outside this production rollout.

Artifacts and deployment receipts: `release-next16-20261030/`. Browser screenshot:
`output/playwright/next16-profile.jpg`. The machine-readable hosted checks are in
`docs/evidence/next16-upgrade-live-20261030.json`.
