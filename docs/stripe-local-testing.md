# Local Stripe test purchases

Updated 7 October 2026 (work began 6 October). Current local branch: `dan-dev`; initial payment work began on `Dan/website-player-accounts`.

The Store now opens hosted Stripe Checkout for a signed-in Epic player. Stripe confirms the simulated payment to the local webhook; the account service independently checks the payment and credits the same durable Evoros balance used by the game. A browser redirect alone cannot add currency. A wallet is unnecessary for card purchases. EVO purchases remain disabled.

This uses **Evoverses Inc's existing test-mode account**, `acct_1UN0wpI8Ec1gWS2X` (connector `test ac`). It does not claim a separate isolated Stripe sandbox. Its six existing products are now active, at the agreed **US$0.01 per Evoro**: $2.50, $5, $10, $25, $50 and $100. No live Stripe objects/settings/payments were changed.

## Start the local test

Run commands in Windows PowerShell from:

```powershell
cd D:\documents\GitHub\evoverses-website\apps\website
```

The account launcher needs the existing `evoverses-beta-account-bridge` checkout and reviewed `Saved\EpicAccountLocal-8bb710d070f047de90e266c231af0157` directory. Do not run another database owner against that directory. The dependency is explicit local development reuse; a hosted release will need a separately deployed account/payment service.

1. Keep the test API key as `STRIPE_SECRET_KEY` in **`apps\website\.env.local`**, which Git ignores. Use a test key, preferably restricted to the needed Product/Price reads and Checkout Session reads/writes. CLI forwarding also requires its supported permissions. Never put a key in a command argument, browser variable, Git or chat. The runtime key passed catalogue/CLI checks and the genuine test Checkout rehearsal.
2. Keep this terminal running:

   ```powershell
   node scripts/start-stripe-sandbox.cjs
   ```

   It verifies all six existing test prices, generates a private local service token, and captures the CLI webhook signing secret into the ignored environment file. It prints only safe status messages. The Windows Stripe CLI v1.53.0 binary lives in ignored `node_modules\.stripe-cli`; it was installed from the official GitHub release and its published SHA256 digest was checked. If absent, install a reviewed current Windows CLI at that path. This is not a global install or permanent public webhook destination.
3. After forwarding reports ready, start the account service in another terminal:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1
   ```

   If already running with older settings, stop it first with the same command plus `-Mode Stop`. Stopping revokes local sessions; sign in again afterwards. It automatically closes after **two hours**. It owns the only PGlite connection to this run and exposes its payment bridge only on loopback with a private service token. It starts no Unreal/editor process.
4. Start/restart the website so it reads the newly captured signing secret:

   ```powershell
   pnpm dev --hostname 0.0.0.0 --port 3100
   ```

5. Open `http://localhost:3100/store`, sign in with Epic, select the **250-Evoros / $2.50** pouch, and click **Pay by card - Test checkout**. Use Stripe's test Visa `4242 4242 4242 4242`, any future expiry and a three-digit CVC. Use fictional test details, never a real card. [Stripe test cards](https://docs.stripe.com/testing#cards).
6. The return page checks the signed-in player's order status. Confirm it shows 250 added and the balance rises by 250, once. Refreshing must leave the balance unchanged. The user's prior local display grant was 10,000 test Evoros; it was not a payment or revenue.

Keep forwarding, account service and website running throughout the rehearsal. Restarting the CLI may change its signing secret; restart the account service and website afterwards. This development listener has no persistent hosted webhook delivery infrastructure. If forwarding is interrupted, an order can stay pending; refresh alone does not fulfill it. Reconcile/resend the test event using Stripe before treating it as complete. Refunds/disputes and failed-payment support remain release requirements, not silently implemented rules.

## What was implemented

- The Store posts only bundle ID and request UUID. The server revalidates the Epic player session, chooses the fixed approved price and reserves a durable order. Browser-supplied player, balance or price fields are rejected.
- Stripe uses a stable order idempotency key. Retries reuse the attached Checkout session. The order fixes recipient, units, price and expiry; a different session cannot replace it.
- `scripts/local-store-payments.cjs` adds a private server-to-server bridge to the same account-service process/database. Browser Origins and missing/incorrect service credentials are rejected. No anonymous grant endpoint or second database owner was added.
- `src/lib/store/stripe/player-service.ts` connects server-verified website sessions to that bridge. `runtime.ts` rejects live mode and has no production adapter.
- The webhook verifies Stripe's raw-body signature with a 1 MiB body limit, rejects wrong-mode events, and acknowledges failed/unrelated events without credits. Successful completion and delayed success re-fetch the session and line item; the account backend independently fetches/revalidates the same payment before crediting.
- Existing transactional `PlayerEconomy.creditOnce` supplies the durable order/receipt/ledger uniqueness and balance-history checks. Repeated/concurrent deliveries grant once. Paid obligations go to their reserved recipient even if they sign out before the webhook.
- `/api/store/stripe/order` requires a verified session and returns only its owner's status/units. The return URL merely starts bounded status polling; it cannot credit Evoros.
- Card remains the default. Signed-out users cannot buy. Pro mode/wallet gating continues to hide crypto details from ordinary players. Local test mode is clearly labelled.

## Verification and work log

- The user approved handling **Stripe test credentials only** in the ignored local environment, with the AWS secret-handling rule remaining applicable to AWS secrets. No AWS secret APIs were called.
- The provided key had been saved as `apps\website.env.local`, outside the intended ignored file. Moved its test-key line privately into `apps\website\.env.local` and removed the misplaced single-key copy. No credential was displayed or committed.
- Verified the runtime key can read the exact six approved test prices. Activated the six existing test products through the Stripe test connector, preserving product/price IDs. Started the local CLI listener and captured its signing secret privately.
- Twenty-six Store pricing/payment tests passed, including six new integrations using the actual SQL schema, persistent PGlite database, private HTTP bridge and Checkout core. These prove rejection of unpaid/altered/live receipts, account separation, one ledger credit under concurrent retries and replay after service/database restart. The payment-provider responses in these persistence tests are fixtures; they are not an actual Checkout payment.
- Added a raw webhook-handler test for valid/changed signatures, wrong mode, failed events and oversized bodies. The existing official-SDK signature tests remain.
- `node scripts/check-store-sandbox.cjs` saves the signed-out browser regression. Local Edge checks passed: anonymous purchase disabled, sandbox wording, crypto controls hidden, Checkout 401 when signed out, hostile Origin 403, unsigned webhook 400, order status 401 and mobile layout fitting.
- Full TypeScript checking retains six existing wallet/liquidity address-type errors; no new payment error was introduced. No successful production build is claimed.
- Genuine rehearsal completed: the user bought the **500-Evoros / $5** bundle. A fresh Stripe read confirms one paid test Checkout and one matching credited local order, with 500 Evoros received and the sole player's balance increased from 10,000 to **10,500**. The forwarded webhook returned HTTP 200. This was a simulated charge, not revenue.
- Replayed that confirmed payment twice locally using signed test webhooks. Each returned `already_credited`; the balance stayed **10,500**. These were deliberate local duplicate-delivery tests, not a claim that Stripe spontaneously retried.
- `node scripts/check-stripe-sandbox.cjs` performs a read-only aggregate check of recent test Checkout sessions against this local database's saved orders. Optional `--replay-credited` replays only already-credited, paid test sessions against the local webhook. It prints status/counts only. It does not create payments or expose credentials/identities.
- Run `pnpm test:store` for standalone website tests and `pnpm test:store:local` for SQL/RPC persistence tests with the documented sibling game checkout. The latter accepts `EVOVERSES_ACCOUNT_TEST_DIR` to point to another account backend directory. Keeping this dependency out of the ordinary test command preserves standalone website CI.
- Targeted ESLint passed; the recorded TypeScript baseline still applies. No Git push/deployment took place.

## Next step

Next, rehearse interrupted webhook forwarding and recovery: a confirmed payment must eventually credit once when forwarding resumes. Successful purchase, duplicate-credit protection, cancellation and decline are verified below. Production requires reviewed hosting/TLS, secret storage, stable webhooks, account service deployment, reconciliation/refund/dispute policy, production pricing/tax decisions and separate release approval. This sprint makes no AWS deployment, GitHub push, Nursery/contract change or game-source change.

## Restart after reboot - 7 October 2026

Restarted the existing Stripe test listener, ownership-checked account service and website on port 3100, using the same reviewed database directory. The read-only payment check confirmed one player, 10,500 Evoros, one credited 500-Evoros test purchase and no pending saved payment among the checked recent sessions. `/signin` returned HTTP 200 with Epic sign-in enabled. The signed-out Store smoke check passed: purchasing disabled, crypto UI hidden, expected 401/403/400/401 API protections and mobile layout fitting. The restart created no purchases or replacement database; a test-data backup was deliberately skipped. The local account service still closes after two hours.


## Cancellation and decline - 7 October 2026

The user completed both genuine browser tests with the 250-Evoros / $2.50 bundle. Read-only Stripe API checks matched each Checkout to its saved local order:

| Test | Stripe result | Local result |
| --- | --- | --- |
| Return without paying | Checkout open, payment unpaid, no PaymentIntent | Order awaiting payment; no Evoros added |
| Declined test card | PaymentIntent requires a payment method; `card_declined` / `generic_decline`; Checkout unpaid | Order awaiting payment; no Evoros added |

The balance stayed **10,500 Evoros**. The aggregate check found the existing paid/credited 500-Evoros purchase and these two unpaid orders. Returning from Checkout does not expire the session; an open unpaid session can still be retried until it expires. These pending orders are unpaid attempts, not paid purchases awaiting fulfillment.

**27 payment tests passed.** The new test sends signed unpaid-completion, failed-payment and expired-session notifications through the actual webhook handler and private account bridge, then checks the temporary SQL database: no balance, ledger or receipt changes. Those automated tests use provider fixtures and a separate temporary database; the browser results above use genuine Stripe test-mode reads. Browser automation could not attach from this WSL session, so the user performed the Checkout actions.

To repeat the read-only checks from `apps/website`:

```powershell
node scripts/check-stripe-negative-attempts.cjs --expected-balance=10500
node scripts/check-stripe-sandbox.cjs
```

The first command reports saved unpaid attempts and safe decline status labels, and fails if an unpaid order is credited or the expected aggregate balance changes. The expected balance is specific to this rehearsal; update it after an intentional credit or purchase. Neither command creates payments, changes orders or prints player identities or credentials.

This sprint changed the local tests, read-only verification script and documentation only. No application, game, Nursery contract, AWS or live-payment change was made. These testing changes have not been pushed.
