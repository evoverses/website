# Evoros website store — local beta

## Scope and status

Website repository: `evoverses/website`. Local branch: **Dan/evoros-store**, based on `dan-dev` commit `496bf3f`. Preview: http://localhost:3100/store.

The store presents the six accepted bundles using the unchanged revision-2 currency artwork from `evoverses/Design/ItemStore/Currency` and source thread `01a109ca-a77f-7962-a16b-cb69d612fe05`. Source checksums and dimensions are in [evoros-assets.json](evoros-assets.json).

| Bundle | Evoros received |
| --- | ---: |
| Pocket Pouch | 250 |
| Trail Satchel | 500 |
| Token Canister | 1,000 |
| Supply Case | 2,500 |
| Treasure Chest | 5,000 |
| Grand Vault | 10,000 |

The user chose **prices pending for beta**. No cash prices, EVO exchange rate, bonuses or EVO discount have been invented. Every purchase button remains disabled. This is a reviewable storefront and payment foundation, not a working paid top-up service.

Store follows Nursery in the menu. Marketplace and Nursery remain adjacent. Tablet widths use the existing compact Links menu to avoid overflowing navigation.

## What a player can do now

Select any bundle and see its artwork, name and quantity in the purchase summary. Switch between EVO and Card. Both show pending prices.

The EVO option connects an ordinary supported wallet and reads its EVO holdings on Avalanche C-Chain. This does not create a smart wallet, sign a login, approve spending or transfer tokens. Balance errors offer Retry rather than displaying a fabricated zero. Holdings are formatted without rounding up. Changing accounts uses a separate balance cache key.

The Card option explains hosted Stripe Checkout. It does not require a crypto wallet. Both payment options will need a verified linked game account to receive the purchased Evoros. No account linking, payment or balance credit is simulated on the page.

EVO purchases are not implemented in this sprint. A future implementation must validate the payment and credit the same server-owned game ledger.

## Stripe preparation

Pinned official `stripe@23.0.0` SDK. No Stripe-hosted infrastructure, subscriptions or Projects resources were provisioned.

- `POST /api/store/stripe/checkout`: disabled by default; requires the configured origin, authenticated game session and a strictly validated bundle/request ID. Prices and recipient come from the server, not the browser.
- `POST /api/store/stripe/webhook`: disabled by default; validates the signature against the untouched raw body, re-fetches the Stripe session and checks paid status, price, quantity, amount, currency, mode, order and recipient before requesting a credit.
- Browser return URLs never grant Evoros.
- Orders have a fixed expiry and Stripe idempotency key. Retries reuse attached sessions. A stable integration identifier distinguishes this checkout flow in Stripe.
- Currency fulfillment must be atomic and durable so repeated/concurrent webhooks cannot grant twice.

**The real game-service adapter is intentionally missing:** `src/lib/store/stripe/player-service.ts` returns null. Adding keys alone cannot enable checkout. The tests use a mock player service; they do not prove a production database ledger exists.

Hosted Checkout is the selected integration approach. Stripe Projects groups providers and development credentials; it is not needed just to use Checkout. Do not blindly pull Projects environment values over the website environment.

### Required game-service contract

Implement `StorePlayerService` with the real account system:

1. Authenticate the server-verified game session independently of wallet connection. Never accept a player ID supplied by the browser as authority.
2. Reserve an immutable order for that player and request UUID, with approved bundle quantity/price and an expiry. Enforce uniqueness on the player/request pair; replay must return the original order or fail on changed purchase details.
3. Attach one Stripe session using compare-and-set. A different session must never replace it.
4. In one database transaction, enforce unique order/session fulfillment, increment the player's persisted Evoros and mark the order credited. A timeout/retry must recover without duplicate currency.
5. Return authoritative balances to both game and website. Add integration tests for concurrent webhook delivery, restart, attachment failure and credit failure using the real persistence layer.

Before revenue activation, define refunded/disputed purchase handling, receipt/support procedures and tax configuration. The current foundation fixes totals, disables promotion codes/adaptive pricing and automatic tax. That is a disabled development assumption, not an approved tax policy. Update price/tax verification together if tax changes totals.

## Stripe account check — 2026-10-05

Stripe access is confirmed through two connections: **test ac** returns Evoverses Inc with `livemode=false`; **Primary** returns the same account with `livemode=true`. This proves test-mode access, not a separate isolated general sandbox. Use the test connection for this catalogue; a separate general sandbox is preferable for future independent development/CI isolation.

All six agreed bundle products were created through **test ac**, inactive and without prices. A fresh product listing verifies names/quantities, bundle metadata, test mode, inactive status and no default prices. A fresh price listing returns zero prices. The product IDs are recorded in [evoros-stripe-test-products.json](evoros-stripe-test-products.json). Deterministic product IDs allow a repeated setup to detect/reuse the same objects instead of creating duplicates. Do not blindly recreate or overwrite them.

No live product, price, payment, key, webhook, account setting or subscription was changed. No website spending gate was enabled. Stripe account access in this chat does not provide a website runtime API key.

The last verified live-account state is US/USD, payments/payouts enabled, card payments active and identity-document requirement cleared. Only the business-model verification form remained currently due. This does not approve the store's selling currency. The account owner completes actual business/identity requirements in Dashboard; personal details and credentials are not recorded here.

Approved prices remain pending. Products must be deliberately activated and assigned approved one-time prices during the later test-checkout setup.

## Environment and activation

Keep these values server-only, out of git and out of chat:

| Variable | Meaning |
| --- | --- |
| `EVOROS_STRIPE_ENABLED` | Defaults off; only `true` enables configuration, and a real player adapter is still required |
| `EVOROS_STRIPE_MODE` | `test` for sandbox rehearsal; live requires a later explicit release decision |
| `STRIPE_SECRET_KEY` | Prefer a sandbox restricted API key (rk_test_) from secure local/deployment secret storage; matching-mode secret keys are also supported |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the specific sandbox webhook destination or CLI listener |
| `EVOROS_STORE_ORIGIN` | Approved origin; localhost HTTP permitted only in test mode; live requires HTTPS |
| `EVOROS_STRIPE_PRICES` | Server JSON map of all six bundle IDs to approved `priceId`, `currency`, `unitAmount` in Stripe minor units |

The website key should be restricted to the Price reads and Checkout Session reads/writes needed by the gateway. Confirm exact permission dependencies in sandbox; do not grant account management, transfers, payouts or broad write access for runtime checkout. This chat connection is distinct from the website runtime key.

No public/publishable key is needed for redirecting to hosted Checkout in this design. Never use test fixtures as account credentials or real prices.

Next activation steps:

1. Test-mode access and six inactive, unpriced products are complete. Keep approved prices pending; activate products only as part of the later test-checkout setup.
2. Complete the authenticated game-account ledger adapter and verify its real database guarantees.
3. Agree cash selling currency/prices, EVO pricing/discount and tax/refund rules.
4. Configure sandbox prices/secrets, webhook listener/destination and enable only a local test checkout path.
5. Rehearse successful, declined, cancelled, delayed and repeated payment events; prove Evoros arrive once in the correct game account. Test refunds/disputes according to the agreed policy.
6. Resolve normal website build errors, review both payment paths and make a separate release decision. Never accept live payments while fulfillment remains unavailable.

Nursery is paused. This branch changes no breeding contracts, Nursery behavior or game assets.

## Validation

Run from `apps/website`:

```sh
pnpm test:store
```

15 tests pass: four exact-balance formatting cases and eleven checkout/fulfillment/signature/configuration cases. Tests include wrong recipient/price/amount/currency/mode, unpaid sessions, redirect protection, order expiry, duplicate/concurrent delivery and interrupted session attachment. Concurrency tests use a mock atomic service; persistent ledger tests remain required.

Changed website TypeScript/TSX passes targeted ESLint with no errors or warnings. The frozen lockfile-only install check passes. Full website TypeScript compilation reports the same six existing profile/liquidity address-type errors and no new store errors. No successful full production build is claimed.

Desktop/mobile isolated Edge checks cover six bundles, selection, payment toggle, card option without wallet, disabled purchase controls and no horizontal overflow. A fixture wallet test verifies 100 EVO, switching accounts, RPC failure, Retry and a true zero balance without signatures or transactions. Default-off API routes return 503. External requests are intercepted or blocked; these checks do not access real wallets or charge money.

## Recommended next sprint

Hook the store to the authenticated, persistent game-account ledger; test-mode catalogue setup is complete. Keep monetary prices pending until agreed. The next useful proof is one sandbox purchase reaching the intended game account exactly once.
