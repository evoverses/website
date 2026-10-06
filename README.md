# EvoVerses website BETA

Combined development branch: **`dan-dev`**. This branch started from `main`, merged `dev`, and adds the Nursery, Evoros Store and local Epic/player-account integration. Updated **7 October 2026**.

**Terminology:** *Evos* are creatures; *EVO* is the Avalanche token; *Evoros* are account-based game currency.

## Implemented features

| Area | Behaviour and source |
| --- | --- |
| Navigation / Pro mode | Pro mode defaults off and persists as a browser preference. It hides Marketplace, Nursery, Liquidity and wallet controls, including bookmarked wallet pages. It does not grant authentication or transaction permission. Marketplace and Nursery remain adjacent. Smaller screens use the Links menu. |
| Account menu | One dropdown provides Epic sign-in/profile/sign-out plus Pro wallet connect, selection and disconnect. Wallet addresses are shortened. No separate redundant wallet button. |
| Menu balances | Evoros uses the verified game account; EVO reads the connected external wallet on Avalanche and appears only in Pro mode. Balances refresh on focus/interval; account balance also updates after Checkout refresh. Missing login/wallet, loading, genuine zero and errors are distinct. Account balance queries are excluded from persisted browser query storage. |
| Nursery landing | Marketplace-style cards for Breeder Bertha and Hatcher Hermann, using the revised game-themed character artwork. |
| Breeder Bertha | Loads wallet Evos, selects parents sequentially, restricts the second parent to compatible creatures, explains individual/combined EVO costs and the separate AVAX randomness surcharge, requests breeding and collects the ready egg. Uses canonical contract previews and rechecks wallet, ownership, wiring and payment limits before signing. |
| Hatcher Hermann | Finds owned eggs directly from the collection/registry, with indexed metadata/artwork. Supports treatment, three-day incubation, hatch request and final hatch. Unindexed eggs and pending requests remain discoverable. Treatment is locked once hatch randomness is requested. |
| Nursery metadata | Subsquid event processing writes canonical Hermann traits/history into a transactional metadata overlay. Website/API/marketplace queries share that overlay. Hash-pinned reads, replay handling, rollback tests, an up/down migration and legacy-writer guards are included. No production migration was applied. |
| Evoros Store | Six bundles: 250, 500, 1,000, 2,500, 5,000 and 10,000, with approved currency artwork. Non-Pro mode has no payment-method selector; card is implicit. Pro mode shows **FIAT / EVO**, defaulting to FIAT. EVO is disabled until an external wallet is connected; disconnect resets to FIAT. Actual EVO purchases remain disabled. |
| Test pricing | Card: **US$0.01 per Evoro**. EVO estimate: **90% discount** against a validated market-price snapshot. Amounts display as integers at 100 EVO or more, one decimal below. Quotes expire after five minutes and fail without a fabricated fallback. These are approved test prices only; the spot quote is not authorised settlement pricing. |
| Stripe test Checkout | Requires server-verified Epic sign-in. Browser supplies only bundle ID/request UUID. The server reserves an immutable order and uses hosted Checkout with a stable idempotency key. Signature-verified webhooks re-fetch paid session/line-item details; the account service independently verifies the receipt and transactionally credits the reserved player's durable ledger once. Return URLs never grant currency. |
| Epic login | Game-themed Arena sign-in page; confidential server-side OAuth exchange, browser-bound single-use state and explicit new-account confirmation. Web/game clients share the reviewed identity namespace. HttpOnly local session cookies, backend expiry/revocation and profile/inventory revalidation remain authoritative. Local incoming callback logging and Sentry capture are disabled. |
| Direct wallet connection | Thirdweb v5 external wallets: MetaMask, Coinbase Wallet, Rabby, Trust Wallet and WalletConnect. New Pro connection uses the owner's existing wallet, without smart-account wrapping or wallet-based game login. It reconnects previously authorised wallets when Pro is enabled and supports switching/disconnection. Uses only a public client ID in the browser. |
| Profile / inventory | Shows verified trainer name, player XP, Evoros and game inventory. Standard-mode UI calls the creatures simply “Evos” and does not describe Pro/wallet features. In Pro mode a separate gallery shows connected-wallet NFT Evos/eggs: live collection count plus paginated indexed details filtered by chain, collection and owner. RPC/indexer failures remain errors, not a false zero. Displaying wallet assets does not permanently link them to Epic or grant in-game rights. |
| Development tooling | Focused Nursery/account/payment tests; signed-out auth/payment checks and an isolated injected-wallet browser regression. Ownership-checked local service start/stop scripts prevent two PGlite owners. Separate production-check output avoids overwriting the running preview. |

## Contract and data boundaries

This is the **website repository**. Solidity changes are in `evoverses/contracts`; this branch contains the Bertha/Hermann ABI snapshots and integration, not a deployment.

- Existing Avalanche collection: `0x4151b8afa10653d304FdAc9a781AFccd45EC164c`.
- EVO token: `0x42006Ab57701251B580bDFc24778C43c9ff589A1`.
- Expected treasury: `0x9F64C4bECa7BBda647B9A755B29F7F9687bc4303`.
- Bertha/Hermann addresses must be deliberately configured after contract approval/deployment; blank or invalid settings disable spending. The UI verifies reciprocal wiring, token/collection/treasury and pause state; it has no fallback to Brenda/Harry.
- Contract economics remain authoritative. Parent cost is `500 EVO × 2^generation × (1 + totalBreeds)`; Gen0 pricing caps at four previous breeds, giving 2,500 EVO maximum per parent. Gen0 lifetime breeds remain unlimited; other generations allow five. Cooldown is `max(1, 7 - generation)` days. Treatment costs 250 EVO. See the detailed Nursery notes for async VRF and payment semantics.
- Nursery and game-account databases are distinct. Existing indexed NFT metadata/ownership is read for display; local player balances, ordinary Evos/items and account sessions live in the isolated player database.
- A connected wallet is not a verified permanent Epic association. Signed ownership challenges, encrypted private linking, unlink/recovery rules and the authoritative game NFT projection are **not implemented**. Do not advertise encrypted wallet linking yet.

## Local setup

Use **Node 22+**, **pnpm 10.12.3**, and one consistent operating-system dependency installation. This working preview uses native Windows Node. Do not reuse Linux-only optional binaries with Windows Node or reinstall the whole shared dependency tree while other work is running.

```powershell
cd D:\documents\GitHub\evoverses-website
pnpm install --frozen-lockfile
cd apps\website
# Create ignored .env.local using .env.example as a guide, not as live credentials.
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1
pnpm dev --hostname 0.0.0.0 --port 3100
```

Open **http://localhost:3100** on this machine. Local Epic/payment mutations accept the exact `localhost:3100` Host/Origin; LAN URLs are not registered authentication origins.

The shared backend and player database schemas are already versioned in [`evoverses/evoverses`, `Dan/2026_BETA`](https://github.com/evoverses/evoverses/tree/Dan/2026_BETA/Prototypes/player_economy), verified on GitHub at `e2b45d6` on 7 October. Schema files `001_player_economy.sql` and `002_account_lifecycle.sql` create the player economy and account lifecycle structure. Website-side bridges/payment scripts are included here. Actual player records, balances, sessions and runtime credentials are excluded from Git and require separate private backups. No hosted backend deployment is performed by this push.

The account launcher imports the account/economy modules from the sibling **`evoverses-beta-account-bridge`** game checkout and opens its explicitly reviewed `Saved\EpicAccountLocal-…` database. It starts no Unreal/editor process. It stops after two hours and revokes sessions on shutdown. No test fixture creates players in the real local database. See [account setup](docs/website-player-accounts.md) for reviewed context and process ownership.

### Configuration

| Settings | Purpose |
| --- | --- |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Real public Thirdweb client ID for direct wallet connection. Permit the intended domains in the provider's configuration. No admin/private key is needed for this connection. |
| `NEXT_PUBLIC_EVOVERSES_LOCAL_WALLET_PREVIEW=1` | Explicit development fallback for UI construction and disabling legacy wallet authentication. A valid public client ID can still enable direct external-wallet connection. Ignored in production. |
| `AUTH_EPIC_ID`, `AUTH_EPIC_SECRET` | Website-specific OAuth credentials; server-only. Existing game credentials are not substituted. |
| `EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN`, `NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN`, `EVOVERSES_LOCAL_EPIC_RUN_ROOT` | Explicit local account-service flags and reviewed run directory. Production ignores the local account adapter. |
| `NEXT_PUBLIC_BREEDER_BERTHA_ADDRESS`, `NEXT_PUBLIC_HATCHER_HERMANN_ADDRESS` | Approved deployed Nursery contracts. Leave blank until authorised. |
| Public GraphQL/image settings | Existing read-only NFT metadata endpoint and artwork delivery. |
| Stripe variables | Server-only test key, listener signing secret, approved account/prices/origin and private bridge token. See the [test setup](docs/stripe-local-testing.md). Defaults off; live mode has no implemented adapter. |
| Squid Nursery settings | Hermann/collection/deployment block, C-Chain ID and writer selection. See [metadata rollout](docs/nursery-metadata.md). These are separate from website settings. |

Keep all private keys, provider proofs, player cookies and the local database outside Git. `.env.local`, service state, build output and installed CLI binaries are ignored. The supplied public client ID is configured locally; no credentials are checked in.

## Validation

From `apps/website`:

```powershell
pnpm test:nursery
pnpm test:player
pnpm test:preview
pnpm test:store
pnpm test:store:local  # Requires the sibling local account backend
pnpm exec tsc --noEmit
node scripts/check-beta-wallet-ui.cjs
node scripts/check-player-preview.cjs
node scripts/check-store-sandbox.cjs
pnpm check:beta-build
```

Browser checks require the local website; the account check requires the reviewed local service. Playwright resolves from the bundled runtime or `EVOVERSES_TEST_RUNTIME_PACKAGE`. Browser wallet fixtures forbid signatures/transfers. `test:store:local` can use `EVOVERSES_ACCOUNT_TEST_DIR` for a different account-backend path.

The production-check script sets flags inside Windows Node, writes only `.next-beta-check`, disables source-map upload for that check and performs no deployment. A standard production build still uses `.next` and normal hosting configuration.

Confirmed before this push:

- **79 automated website tests passed:** 23 Nursery, 21 player account/auth, five preview auth, four balance formatting and 26 pricing/payment/webhook/persistent-ledger tests.
- Strict website TypeScript checking passed after correcting the six pre-existing legacy address annotations. Those corrections do not change contract destinations or transaction behaviour.
- Targeted lint and the Pro/non-Pro wallet browser regression passed: real connection controls, injected external-wallet connection/disconnection, EVO balance, no signatures/transfers and responsive menu at desktop/tablet/mobile widths.
- The user's real local Stripe test purchase added **500 Evoros**, taking the balance from **10,000 to 10,500**. Two locally replayed signed confirmations returned `already_credited`, leaving the balance unchanged.
- The user confirmed a real connected wallet in the Pro menu. The final NFT Profile gallery still needs a visual check with that wallet; metadata can lag the chain count.
- The isolated production build passed compilation, type checks, page generation and build tracing. Existing repository lint warnings remain. No successful full-stack live Nursery journey or production deployment is claimed.

## Remaining release work

1. **Nursery:** complete independent contract review and the contract → indexer → API/image → wallet rehearsal; approve/import history and species mappings; approve addresses, mint roles, VRF configuration, failure recovery and deployment. Apply the metadata migration/watcher deliberately, without replaying transfers into a populated database.
2. **Accounts:** deploy the shared account/payment service with TLS, durable PostgreSQL, proper secret storage and shared OAuth/session state. Local sign-in is not a hosted account release. Implement the separately reviewed secure Epic/wallet link and game NFT projection.
3. **Payments:** cancellation/decline, delayed confirmation, interrupted forwarding and recovery tests; stable hosted webhooks/reconciliation, refunds/disputes/support, production pricing and tax decisions. Test-mode Checkout is not revenue activation. EVO settlement needs a reserved quote and manipulation-resistant pricing policy, plus verified on-chain fulfillment.
4. **Game economy:** reviewed item/Evo catalogue and prices, purchase/use effects and gameplay validation. A displayed balance alone does not prove every gameplay spending path is deployed.

Nursery release and game/store revenue are concurrent streams. Neither mainnet deployment nor AWS/database migration is authorised by this GitHub push.

## Documentation and work log

- [Nursery UI/economics](docs/nursery.md)
- [Nursery metadata/indexer/migration](docs/nursery-metadata.md)
- [Store pricing/assets/payment foundation](docs/evoros-store.md)
- [Stripe local setup and verified purchase](docs/stripe-local-testing.md)
- [Epic/local accounts and earlier work log](docs/website-player-accounts.md)
- [Local preview/native dependencies](docs/local-preview.md)

**7 October:** removed the non-Pro method selector; made Pro FIAT/EVO explicit; enabled direct external-wallet connection with the supplied public client ID; added menu currency balances; consolidated wallet controls into the account dropdown and kept shortened addresses; added separate wallet NFT Profile gallery and standard-mode “Evos” wording without references to Pro; corrected legacy TypeScript address annotations; added this combined BETA README and final checks. Nursery contracts/economics and other game/animation work were not changed.

During verification, a WSL environment flag failed to reach Windows Node and a production-check attempt touched the active `.next` output, causing an internal-server error. Stopped only the website preview, cleared its disposable build output and restarted it; Store returned HTTP 200. The account database was untouched. After replacing dependency junctions, restarted the website preview again to clear stalled Turbopack state; `/store` and `/signin` returned HTTP 200. `check-beta-build.cjs` now sets isolation flags in the Windows child process itself and restores Next’s temporary TypeScript include change only if no independent config edits occurred. Missing locked Rollup/Sharp Windows optional packages were installed only in ignored `node_modules`, with package SHA512 checked against the existing lockfile; no dependency version change or broad reinstall was made. Windows-inaccessible Linux symlinks in the locked Sharp/BIP dependency graphs were replaced with Windows junctions. The final isolated production build passed compilation, type checking, generation of all 27 static pages and build tracing; existing unrelated lint warnings remain.

## Monorepo structure

`apps/website` is the Next.js frontend; `apps/squid` contains the NFT indexer/metadata migration; `packages/database`, `packages/evoverses` and `packages/ui` provide shared schemas, game types/components and UI styles. Other existing apps/infra remain in the repository; this sprint does not deploy or reconfigure them.
