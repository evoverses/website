# EvoVerses website BETA

Combined development branch: **`dan-dev`**. This branch started from `main`, merged `dev`, and adds the Nursery, Evoros Store and local Epic/player-account integration. Updated **8 October 2026**.

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
| Profile / inventory | One inventory combines owned store items and Evos, with search, type filters and sorting. Pro adds NFT Evos/eggs from every verified linked wallet, with shortened wallet labels on cards and a wallet filter. Indexed details are checked against current C-Chain ownership before display. Standard mode shows only Evos and items. Pages load 48 NFT entries at a time; filters/sorts apply to loaded entries. Errors/metadata delays remain explicit. This read-only view grants no NFT gameplay rights. |
| Local wallet account links | Pro Profile supports multiple independently verified external wallets per Epic trainer, shared links across family accounts, encrypted address storage and confirmed per-account unlinking. Five-minute single-use session-bound signatures prove control. Linking alone grants no NFT gameplay rights. |
| Development tooling | Focused Nursery/account/payment tests; signed-out auth/payment checks and an isolated injected-wallet browser regression. Ownership-checked local service start/stop scripts prevent two PGlite owners. Separate production-check output avoids overwriting the running preview. |

## Contract and data boundaries

This is the **website repository**. Solidity changes are in `evoverses/contracts`; this branch contains the Bertha/Hermann ABI snapshots and integration, not a deployment.

- Existing Avalanche collection: `0x4151b8afa10653d304FdAc9a781AFccd45EC164c`.
- EVO token: `0x42006Ab57701251B580bDFc24778C43c9ff589A1`.
- Expected treasury: `0x9F64C4bECa7BBda647B9A755B29F7F9687bc4303`.
- Bertha/Hermann addresses must be deliberately configured after contract approval/deployment; blank or invalid settings disable spending. The UI verifies reciprocal wiring, token/collection/treasury and pause state; it has no fallback to Brenda/Harry.
- Contract economics remain authoritative. Parent cost is `500 EVO × 2^generation × (1 + totalBreeds)`; Gen0 pricing caps at four previous breeds, giving 2,500 EVO maximum per parent. Gen0 lifetime breeds remain unlimited; other generations allow five. Cooldown is `max(1, 7 - generation)` days. Treatment costs 250 EVO. See the detailed Nursery notes for async VRF and payment semantics.
- Nursery and game-account databases are distinct. Existing indexed NFT metadata/ownership is read for display; local player balances, ordinary Evos/items and account sessions live in the isolated player database.
- Connecting alone is not a verified Epic association. The local Profile now supports separately signed, encrypted wallet links and per-account unlinking, including shared family wallets. The local game inventory projection is connected; local PvBot now uses whole-team exclusive practice reservations with fresh ownership/link checks. Hosted recovery and trusted multiplayer/result settlement remain unimplemented. See [wallet linking](docs/wallet-account-linking.md).

## Local setup

Use **Node 22+**, **pnpm 10.12.3**, and one consistent operating-system dependency installation. This working preview uses native Windows Node. Do not reuse Linux-only optional binaries with Windows Node or reinstall the whole shared dependency tree while other work is running.

```powershell
cd D:\documents\GitHub\evoverses-website
pnpm install --frozen-lockfile
cd apps\website
# Create ignored .env.local using .env.example as a guide, not as live credentials.
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1
pnpm dev:beta
```

Open **http://localhost:3100** on this machine. Local Epic/payment mutations accept the exact `localhost:3100` Host/Origin; LAN URLs are not registered authentication origins.

The shared backend and player database schemas are already versioned in [`evoverses/evoverses`, `Dan/2026_BETA`](https://github.com/evoverses/evoverses/tree/Dan/2026_BETA/Prototypes/player_economy), verified on GitHub at `e2b45d6` on 7 October. Schema files `001_player_economy.sql` and `002_account_lifecycle.sql` create the player economy and account lifecycle structure. Website-side bridges/payment scripts are included here. Actual player records, balances, sessions and runtime credentials are excluded from Git and require separate private backups. No hosted backend deployment is performed by this push.

The account launcher imports the account/economy modules from the sibling **`evoverses-beta-account-bridge`** game checkout and opens its explicitly reviewed `Saved\EpicAccountLocal-…` database. It starts no Unreal/editor process. It stops after eight hours and revokes sessions on shutdown. No test fixture creates players in the real local database. See [account setup](docs/website-player-accounts.md) for reviewed context and process ownership.

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
pnpm test:wallet:local # Same backend requirement; separate temporary test database
pnpm test:inventory    # Consolidation, filtering, privacy and ownership checks
pnpm exec tsc --noEmit
node scripts/check-beta-wallet-ui.cjs
node scripts/check-player-preview.cjs
node scripts/check-store-sandbox.cjs
pnpm check:beta-build
```

Browser checks require the local website; the account check requires the reviewed local service. Playwright resolves from the bundled runtime or `EVOVERSES_TEST_RUNTIME_PACKAGE`. Browser wallet fixtures forbid signatures/transfers. `test:store:local` can use `EVOVERSES_ACCOUNT_TEST_DIR` for a different account-backend path.

The production-check script sets flags inside Windows Node, writes only `.next-beta-check`, disables source-map upload for that check and performs no deployment. A standard production build still uses `.next` and normal hosting configuration.

Earlier validation checkpoint (retained as historical evidence):

- **79 automated website tests passed:** 23 Nursery, 21 player account/auth, five preview auth, four balance formatting and 26 pricing/payment/webhook/persistent-ledger tests.
- Strict website TypeScript checking passed after correcting the six pre-existing legacy address annotations. Those corrections do not change contract destinations or transaction behaviour.
- Targeted lint and the Pro/non-Pro wallet browser regression passed: real connection controls, injected external-wallet connection/disconnection, EVO balance, no signatures/transfers and responsive menu at desktop/tablet/mobile widths.
- The user's real local Stripe test purchase added **500 Evoros**, taking the balance from **10,000 to 10,500**. Two locally replayed signed confirmations returned `already_credited`, leaving the balance unchanged.
- The user confirmed a real connected wallet in the Pro menu. The final NFT Profile gallery still needs a visual check with that wallet; metadata can lag the chain count.
- The isolated production build passed compilation, type checks, page generation and build tracing. Existing repository lint warnings remain. No successful full-stack live Nursery journey or production deployment is claimed.

## Remaining release work

1. **Nursery:** complete independent contract review and the contract → indexer → API/image → wallet rehearsal; approve/import history and species mappings; approve addresses, mint roles, VRF configuration, failure recovery and deployment. Apply the metadata migration/watcher deliberately, without replaying transfers into a populated database.
2. **Accounts:** deploy the shared account/payment service with TLS, durable PostgreSQL, proper secret storage and shared OAuth/session state. Local sign-in is not a hosted account release. Validate shared-wallet game access across real sessions. Local game inventory and PvBot reservations are connected; hosted key custody/rotation, multiplayer admission and recovery remain required.
3. **Payments:** delayed confirmation, interrupted forwarding and recovery tests; stable hosted webhooks/reconciliation, refunds/disputes/support, production pricing and tax decisions. Test-mode Checkout is not revenue activation. EVO settlement needs a reserved quote and manipulation-resistant pricing policy, plus verified on-chain fulfillment.
4. **Game economy:** reviewed item/Evo catalogue and prices, purchase/use effects and gameplay validation. A displayed balance alone does not prove every gameplay spending path is deployed.

Nursery release and game/store revenue are concurrent streams. Neither mainnet deployment nor AWS/database migration is authorised by this GitHub push.

## Documentation and work log

- [Nursery UI/economics](docs/nursery.md)
- [Nursery metadata/indexer/migration](docs/nursery-metadata.md)
- [Store pricing/assets/payment foundation](docs/evoros-store.md)
- [Stripe local setup and verified purchase](docs/stripe-local-testing.md)
- [Encrypted local wallet links and game access gate](docs/wallet-account-linking.md)
- [Consolidated inventory, filters and linked-wallet holdings](docs/consolidated-inventory.md)
- [Epic/local accounts and earlier work log](docs/website-player-accounts.md)
- [Local preview/native dependencies](docs/local-preview.md)

**7 October:** removed the non-Pro method selector; made Pro FIAT/EVO explicit; enabled direct external-wallet connection with the supplied public client ID; added menu currency balances; consolidated wallet controls into the account dropdown and kept shortened addresses; added separate wallet NFT Profile gallery and standard-mode “Evos” wording without references to Pro; corrected legacy TypeScript address annotations; added this combined BETA README and final checks. Nursery contracts/economics and other game/animation work were not changed.

During verification, a WSL environment flag failed to reach Windows Node and a production-check attempt touched the active `.next` output, causing an internal-server error. Stopped only the website preview, cleared its disposable build output and restarted it; Store returned HTTP 200. The account database was untouched. After replacing dependency junctions, restarted the website preview again to clear stalled Turbopack state; `/store` and `/signin` returned HTTP 200. `check-beta-build.cjs` now sets isolation flags in the Windows child process itself and restores Next’s temporary TypeScript include change only if no independent config edits occurred. Missing locked Rollup/Sharp Windows optional packages were installed only in ignored `node_modules`, with package SHA512 checked against the existing lockfile; no dependency version change or broad reinstall was made. Windows-inaccessible Linux symlinks in the locked Sharp/BIP dependency graphs were replaced with Windows junctions. The final isolated production build passed compilation, type checking, generation of all 27 static pages and build tracing; existing unrelated lint warnings remain.

**7 October, payment failure checks:** the user completed a cancelled Checkout and a declined-card Checkout. Read-only Stripe/local-order checks confirmed both remained unpaid and uncredited, with the balance unchanged at 10,500 Evoros. The payment suite passed 27 tests, including a new signed unpaid/failed/expired notification check against the temporary SQL ledger. Added a read-only negative-attempt verifier; see the [testing log](docs/stripe-local-testing.md). These follow-up test/documentation changes remain local. Recommended next sprint: interrupted webhook forwarding and recovery.

**7 October, wallet linking:** added a Pro Profile section for verified multi-wallet links, shared-wallet associations and individually confirmed unlinking. Addresses and pending address challenges are encrypted in the same local player database; signed proofs are session-bound, expiring and single-use. The service restart retained one player and 10,500 Evoros and revoked old sessions. No game source, inventory, payment, contract or hosted resource changed. 17 wallet tests and 21 account tests passed; strict types and the isolated production build passed. The user confirmed two genuine wallet links; the browser unlink flow remains to be checked. Account-linked NFT gameplay access stays disabled pending server-side per-Evo reservations. These changes are local and unpushed.

**7 October, consolidated inventory:** replaced the connected-wallet-only gallery with one account inventory for owned items, Evos and Pro-only linked-wallet NFT Evos/eggs. Added shared search/type/sort controls, wallet filtering, shortened wallet labels, bounded pagination and current-chain ownership checks. Corrected item-ID validation and excluded private inventory/link queries from persisted browser caches. Added 11 inventory tests, one SQL-backed projection test and a safe auth-diagnostics test; all 51 inventory/wallet/player tests passed. Strict types and the isolated production build passed; remaining lint warnings are existing repository warnings. The user reported sign-in hanging: the owned Turbopack preview had panicked. Restarted only that preview with standard Next compilation and reloaded only the owned account service for the new projection. The database/balance were preserved, with 10,500 Evoros; the user confirmed a fresh Epic sign-in works. The signed-out browser auth regression also passed after compilation completed. First visits are slow with the standard compiler (Store: 56 seconds cold, 133 ms warm); warmed sign-in pages took 0.1–0.5 seconds, and the account backend 27 ms. Use `pnpm dev:beta`; see the inventory log for diagnostic and performance limits. These changes remain local and unpushed. See [inventory notes](docs/consolidated-inventory.md) for pagination limits and next steps.

## Monorepo structure

`apps/website` is the Next.js frontend; `apps/squid` contains the NFT indexer/metadata migration; `packages/database`, `packages/evoverses` and `packages/ui` provide shared schemas, game types/components and UI styles. Other existing apps/infra remain in the repository; this sprint does not deploy or reconfigure them.


### Local game inventory bridge (2026-10-07)

The owned local player service now supplies authenticated purchased inventory plus linked-wallet NFT display data to the game account client. Website and game share the same ownership loader and read adapters. Wallets stay encrypted in storage; only shortened labels enter the game DTO. The game retains its themed Evo grid and adds Items/All views. Account-owned and verified wallet-owned Evos share one game collection, presentation and profile count; Pro controls, wallet labels and ownership-source distinctions are website-only. This is an editor-only, read-only integration; per-Evo reservations are required before NFT gameplay. See [consolidated inventory](docs/consolidated-inventory.md) and the sibling game account bridge's documentation. No push or deployment is included in this sprint.


### Local whole-team game admission foundation (2026-10-07)

Added the server-only `createGameTeamVerifier` adapter, reusing current linked-wallet/live ownership checks for the sibling backend's atomic whole-team reservation service. Named conflicts identify the selected Evo and slot without revealing another trainer or wallet. Eight shared feed/verifier checks passed; the backend's reservation and native concurrency suites passed. No website UI/route or running database/service was changed. Battle-start/lifecycle integration is the next local step; reservations do not activate gameplay or XP. See [inventory log](docs/consolidated-inventory.md).


### Website checkpoint - 7 October 2026

Prepared the current `dan-dev` account, encrypted multi-wallet linking, consolidated inventory and game-feed adapters for GitHub backup at the user's request. Nursery and the Evoros Store remain together on this branch. Wallet links can be shared between separately verified accounts; unlinking affects only the requesting account. NFT game use still requires trusted per-Evo admission and combat verification.

Before this checkpoint, the inventory, wallet, player, preview, game-feed/team-verifier and local Stripe payment tests passed. Local Stripe checks use synthetic receipts and disposable databases; they do not charge cards. The isolated production build and strict TypeScript check also passed; existing repository lint warnings remain. Local configuration, encryption keys, payment/provider credentials, session files and database contents are excluded from Git. This checkpoint does not deploy the website or activate live payments.


### Optional local game Store integration - 8 October 2026

Added explicit Store composition on the existing owned account API, with a restorable database backup before additive migration, once-only new-account starter packs and unchanged wallet/Stripe adapters. It is disabled by default; local activation preserved the existing 10,500-Evoros account. No hosted deployment or gameplay effects were activated. Game code/data remain in the separate local `Dan/beta-account-bridge` checkout. See [local Store integration](docs/game-store-local.md) for flags, ownership, backup, restart and testing requirements.


Validation for this integration: 93 selected website tests passed, including backup restoration, wallet/account security, inventory, private game feed/team verifier and synthetic local Stripe receipts. The production build and strict types had passed at the preceding website checkpoint; no frontend TypeScript was changed by the optional Store-service wiring. Fresh genuine Epic/game purchasing on the enabled service remains a human check.


## Game account inventory details - 8 October 2026

Profile displays generated account Evo serials, level, remaining/max HP, current/level-100 stat projections, genetic ratings and equipped/locked moves. It reads the same local account service used by the game’s Epic login; separate client sessions resolve one player. Packs use the existing game artwork and stay in inventory until opened in-game. [Data contract, local setup and limitations](docs/game-account-inventory-details.md). Local only; no new deployment/payment activation.


## 8 October 2026 - NFT presentation and compact inventory follow-up

See [NFT inventory presentation repairs](docs/nft-inventory-presentation-fixes.md) for the typed NFT trait bridge, common level restrictions, 50 HP baseline, tooltip repair, retained purchase balance, compact inventory sizing and validation. All work is local. The owned account service was subsequently backed up/restarted and the game reopened after the user resumed work. Saved inventory/balance counts matched; a real-account visual check remains pending.


## 8 October 2026 - responsive inventory and hover details

Wallet links now precede inventory in Pro mode. Item columns pair with smaller Evo columns; minimum-width cards and filters wrap as their containing panel narrows. Stats and Moves opens a wider responsive panel for all Evos, including NFT Evos, supporting hover, focus, tap and Escape. [Changes, measurements, validation and remaining work](docs/nft-inventory-presentation-fixes.md#responsive-inventory-and-floating-details---8-october-2026). Local `dan-dev` only; no push/deployment.


### Local beta follow-up: account team persistence

The website-owned account service now prepares the game's schema 006 team/equipped-move preferences, with a gzip database backup before first migration. These are authenticated account preferences, not inventory or battle authority. The local preview safety timeout is eight hours; a restart revokes existing sessions and requires fresh Epic sign-in. No AWS or production migration is included. Game implementation and validation: `../evoverses-beta-account-bridge/Documentation/account-teams-and-pvp-navigation.md`.


### Local PvBot account-team service - 8 October 2026

The explicit local game-store composition now adds authenticated practice reserve/renew/release routes, using the existing SQL team-reservation service and fresh linked-wallet ownership verifier. Before adding missing schema 003 tables, startup saves a verified gzip database backup. Account-only API composition has no practice routes. These leases coordinate local PvBot use; they cannot settle rewards, HP, items or XP. Unsigned requests are rejected with 401 / INVALID_SESSION. No hosted database or infrastructure changed.

The linked-inventory compiler uses a separate ignored output directory per process to prevent concurrent tests/service compilation truncating shared JSON. Eight website feed/verifier checks and 36 sibling backend practice/store/reservation checks passed. Game Settings, team-to-bot handoff and rendered validation are documented in `../evoverses-beta-account-bridge/Documentation/pvbot-account-teams-and-settings.md`. The shared working service was backed up/restarted; sessions require fresh Epic sign-in. Local only; no push or deployment.


## GitHub snapshot - 8 October 2026

This website snapshot includes compact responsive inventory cards, Pro-only linked wallets above inventory, shared Stats and Moves hover/focus/tap panels, all 68 configured species in the display reference, pack artwork and validated saved-Evo trait parsing. The explicitly enabled local account service also wires account-backed team/move preferences and whole-team practice reservations from the sibling game backend, with private backups before additive local schemas. No gameplay authority is granted by website metadata.

Validation for this snapshot: 55 account/preview/wallet/game-feed tests, 16 inventory tests, 27 Nursery/pricing/balance tests and 27 payment/ledger tests passed (125 total). The isolated Next production build passed, including TypeScript checking; existing repository lint warnings remain. Responsive evidence uses synthetic accounts and wallets only. Credentials, working databases, backups, runtime logs and build outputs remain excluded from Git.

**Deployment hold:** `vercel.json` at repository and website roots disables Git-triggered deployment for `dan-dev`, covering either configured Vercel project root. This implements the explicit request to push without deploying. Remove that branch hold only after deployment is authorised. See [Vercel's documented branch deployment setting](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled). No other hosting action or production database migration is performed by this snapshot.

**Next step:** check hosted account/economy service availability, production login configuration and payment mode before approving a beta deployment. The local launcher relies on the separate game backend checkout; pushing this website does not publish that service. Nursery still requires contract review/approved addresses and metadata rollout. Stripe remains sandbox-only, and EVO settlement remains disabled.


## 9 October 2026 - inventory move unlock visibility

Locked moves display only their unlock level; names and PP remain hidden until unlocked for all Evos. Fixed valid move IDs above 10,000 being rejected by the combat display parser. The 68-species source audit found no truncated website lists: 25 original learnsets finish by level 50. [Changes, evidence and the separate native migration backlog](docs/inventory-move-unlocks.md). Local only; hosting remains paused.

### HP progression update — 9 October 2026

Evo HP now begins at the species' old Level 10 HP at Level 1 and grows linearly to its old Level 100 HP. Inventory, HP previews and NFT asset maximum use derived/confirmed variable HP; genes and unrevealed moves are preserved. The companion account service supplies the mutable maximum separately from immutable birth records. Native game/backend work and schema 010 remain local on `Dan/beta-account-bridge`; this website work is prepared for GitHub on `dan-dev`. Twenty inventory checks and TypeScript passed. See `evoverses-beta-account-bridge/Documentation/evo-hp-progression.md` for the shared rule, database backup and battle checks.

### GitHub sync and Vercel readiness — 9 October 2026

Website inventory/combat updates were pushed to `dan-dev` at `ae1b50b`; the separate game backend and local databases are not included. The production build and inventory/game-bridge/account/wallet checks pass. See [Vercel preview readiness](docs/vercel-preview-readiness.md) for concrete deployment blockers and setup order. Hosted account adapters and a framework security update are required before a functional public beta. No deployment or provider configuration was performed; automatic `dan-dev` deployments remain disabled.

### Local beta administration and release preparation - 9 October 2026

Next/React were upgraded and the production build passes. Beta purchases and breeding transactions are disabled; Nursery browsing remains available and Stripe stays on standby. Local Beta Admin supports once-only 5,000-Evoros tester approval, revocation and audited repeat rewards of Evoros, consumables and unopened packs. Future verified milestone rewards have a disabled extension point. DanMancs is selected as the local operator. [Completed work, test evidence and remaining release steps](docs/beta-preparation.md). Nothing has been deployed; hosted account connections and enforced invitation admission still require implementation.

### Cloudflare compatibility - 9 October 2026

Hosted beta deployment is now underway: a separate AWS player database is migrated, and its HTTPS account API responds successfully. The Cloudflare website Worker is published at `https://beta.evoverses.com`, with its two approved server-side credentials in encrypted Worker secrets. Public pages and unauthenticated guards pass; real Epic login and administrator reward checks remain to be completed. Wallet links use encrypted storage and HTTPS beta signing context. See [current hosted release checkpoint](docs/hosted-account-progress.md); the older local-only entries below describe their original sprint state. Purchases and breeding transactions remain disabled by source-controlled release gates.

The clean Linux Next/OpenNext build and local Workers page/API smoke checks pass. A reproducible `pnpm --filter website check:cloudflare` command builds a temporary source copy without local credentials or data and dry-runs bundling. No hosting/DNS changes were made. [Measured bundle size, runtime evidence and the remaining hosted-account work](docs/cloudflare-compatibility.md).
# Hosted beta account work

The beta is public to anyone with its address. Epic sign-in protects personal account actions; tester approval controls rewards, not admission. Hosted login preparation, verification evidence and remaining release blockers are recorded in [hosted account progress](docs/hosted-account-progress.md). Payments and breeding transactions remain disabled pending their separate approvals.

### Beta wallet signing and Store previews - 10 October 2026

Wallet challenge validation now accepts the matching HTTPS beta page while keeping localhost and cross-origin protections. Pro users can select FIAT/EVO to preview pricing; purchase submission remains disabled. The database-backed Beta Admin page exists at `/beta-admin`, with role-checked tester approval and audited Evoros/item/pack rewards; hosted Danmancs administrator membership still needs verified identity pinning. See [repair details and verification](docs/beta-ui-fixes-2026-10-10.md).

### Persistent account administration - 10 October 2026

`/beta-admin` now verifies administrator access before rendering. A searchable/sortable account table exposes tester status, XP, administrator role and Evoros balance, with confirmed role and reward actions. Administration is independent of beta approval; protected masters are assigned through a verified private operator job. Docs/About navigation links are hidden. [Role rules, database safeguards and verification](docs/account-administration-2026-10-10.md).

### One wallet connection - 10 October 2026

Removed legacy wallet sign-in from the Epic sign-in page. Liquidity now uses the root wallet context shared with Profile/Store/Nursery, and Epic accounts can reach it through Pro navigation. [Changes and validation](docs/shared-wallet-connection-2026-10-10.md).

### Landing portal intro - 10 October 2026

Replaced the YouTube carousel with a responsive 2.8-second plasma-whirlpool portal animation using the supplied EvoVerses logo. Plays once and leaves the logo visible; reduced-motion users see a static logo. [Implementation and desktop/mobile visual evidence](docs/landing-portal-intro.md).

### Marketplace data connection - 10 October 2026

The AWS indexer now uses SQD public Portal in finalized mode, preserving its checkpoint and database. Its historical backlog is still catching up; listing visibility is not yet confirmed. See [migration and evidence](docs/marketplace-portal-migration-2026-10-10.md) and [duplicate-listing safeguards](docs/marketplace-listing-recovery-2026-10-10.md).

### Marketplace toolbar placeholders - 10 October 2026

Settings and Insights are hidden behind `SHOW_UNFINISHED_MARKETPLACE_TOOLS = false` in the shared collection filter bar. Their original markup remains for later reinstatement once behaviour is defined. Applies to Marketplace and the older Profile Evo collection screen; sorting, layouts, filters and banner statistics remain available.

Published to `beta.evoverses.com` as Worker version `abe88af1-3c4e-4223-8ba4-a5e7e34af126`. Production Next/OpenNext builds passed. Headless live-marketplace check found neither placeholder button, retained all five layout choices, and loaded 18 Evo cards. Check: `docs/evidence/marketplace/check-toolbar.cjs`. Recommended next step: verify the delayed marketplace listings after indexer catch-up.

### Marketplace card alignment and navigation - 10 October 2026

Added asset-detail Back navigation and a shared proportional Evo card layout: raised, contained artwork and a smaller information island with aligned text. Desktop/compact/mobile screenshot and geometry checks pass. See [changes and evidence](docs/marketplace-card-layout-2026-10-10.md).

Published to `beta.evoverses.com` as `0c0b6df9-908a-478c-bb7b-5c643f48b0cb`. Live checks pass six desktop/mobile card views and both Back navigation paths. Blank/external history entries use the marketplace fallback.

Card panel polish: slightly wider stat spacing, content-sized island with equal side padding, and a small downward adjustment clear of the Evo number. Published beta version `869a0f50-4a1f-40a5-8990-cb08dc7cae9b`; six live desktop/mobile checks pass. Recommended next step: review the refined spacing on beta.

Rounded lower-left card panel: three rows of two stats, full-width breed count and 70% background opacity. Compressed the original panel height by about 30% through tighter line/row spacing, with unchanged font sizes. Published as `6baac3cb-4cdb-4e2c-af74-cc007688f1a7`; all six live visual/layout checks pass. See the card-layout log for screenshots and measurements. Next: review the compact panel on beta.

Frame alignment polish: panel centred between the inner border and generation-bar tip, bottom aligned with that bar; all four frame-bar labels and the owner footer vertically centred. Published beta version `5ddae49c-24d8-4ce6-8c1c-e3c862e05fa7`; production builds and six live layout checks pass. Screenshots/log refreshed. Next: visual review on beta.

Evo artwork centring: lowered artwork within the available area above the stats panel, retaining size and horizontal alignment. Published beta version `34bf350c-f8aa-4f2a-89f5-e04c4247430d`; production builds and six local/live desktop/mobile checks pass. Evidence and work log refreshed. Next: visual review on beta.

Current-level card HP: removed fixed 50 from on-page and share-image cards; calculate HP from species and XP using the existing L1-to-L100 interpolation shared with inventory. This represents HP at the current level, not battle damage. All 68 species across 100 levels and six local/live card views pass. Published beta version `b755ef5a-a04f-480a-a0df-57e6c6f65a67`. Next: visual check on beta.

## GitHub source checkpoint - 10 October 2026

The accumulated hosted beta, marketplace/indexer recovery and UI updates are saved together on `dan-dev`. The current Cloudflare Worker is `b755ef5a-a04f-480a-a0df-57e6c6f65a67`; deployment remains separate from GitHub source storage. Push preparation passed 160 regression tests and the 68-species HP checks. Local secrets, databases and generated builds are excluded. See [sync evidence](docs/github-beta-sync-2026-10-10.md). Next: continue beta review from this checkpoint.

## Seven-day sessions, moderation and special-skin accents - 11 October 2026

Deployed to the hosted beta: seven-day website/backend sessions with revocation, Ban/Unban admin controls, preserved beta/role/inventory state, violet Chroma/gold Epic frames and subtle profile artwork glows. Temporary account-service errors no longer return a signed-out account. 119 tests and production builds pass. AWS account API and Cloudflare Worker rollout completed after explicit approval; migration 016 preserves the concurrent Ranked migration 015. See [implementation and rollout log](docs/account-policy-and-skin-accents-2026-10-11.md).
