# Consolidated player inventory

Local website `dan-dev` sprint, 7 October 2026. No push or hosted deployment.

## Player behaviour

The Profile has one **Your inventory** section. Items and Evos use the same search, type filter and sort controls. Item cards show quantities; Evo cards show their own XP. Standard mode calls the creatures simply **Evos** and contains no NFT or wallet controls.

Pro mode adds an **NFT Evos & eggs** panel inside that inventory. It combines holdings from **all verified wallets linked to the signed-in trainer**, including independently verified shared family wallets. A connected browser wallet is not required to view existing links. Every NFT card shows its shortened wallet label, for example `0x1111…1111`. The Wallet filter selects all inventory, the game account, or a particular linked wallet. Ordinary account inventory remains visible when Pro is switched off.

Search matches name, species, category, token number and shortened wallet label. Type filters select all inventory, items, Evos, or Pro-only NFTs/eggs. Sort options are name A–Z/Z–A, highest XP and highest quantity. Sorting operates within the displayed sections. Items of different catalogue revisions retain separate owned stacks.

NFT details load in pages of 48 across the linked wallets. **Filters and sorting apply to loaded entries**; the page explicitly offers Load more when more indexed entries exist. Refresh rechecks account inventory and holdings; periodic and window-focus refreshes keep displayed data current. This is not an exhaustive search across unloaded pages.

## Sources and authority

- Owned items and ordinary Evos come from the existing authenticated player-account backend. Fixed item-ID validation: catalogue IDs such as `vital_dew` are identifiers, not UUIDs. Evo record IDs remain UUIDs.
- Item names/categories/icons are display mappings from the existing game ItemStore design assets. The 54-entry mapping creates no offers, items, prices or gameplay effects. New PNG copies live in `apps/website/public/inventory/items`; source game assets were not changed.
- NFT candidates come from the existing Evo metadata GraphQL query for the verified linked owners. Chain and collection are fixed to Avalanche C-Chain 43114 and `0x4151b8afa10653d304FdAc9a781AFccd45EC164c`.
- Current `ownerOf` and wallet `balanceOf` reads are pinned to the same fresh block for each page. Transferred-out assets are omitted; an asset moved between linked wallets is labelled with its current wallet. Canonical chain/collection/token identity removes duplicates. See [ERC-721 ownership](https://eips.ethereum.org/EIPS/eip-721).
- Metadata/image and RPC failures produce explicit notices, rather than claiming a confirmed empty wallet. Missing or unverified records are omitted. The indexer can lag a transfer/new mint; the chain check cannot invent missing metadata.
- NFT XP shown here is existing display metadata. No XP, balances, items, ownership or NFT game permissions are changed.

## Authentication and privacy

`POST /api/player/inventory` accepts only `{ includeNfts, page, linksVersion }`. The player comes from the existing HttpOnly session cookie, never a browser-supplied player or owner address. Exact local Host/Origin, bounded JSON bodies and sanitized errors follow the existing wallet/account adapter. The route returns `no-store` and is disabled outside the explicit development adapter.

Standard-mode reads do not decrypt wallets or contact the NFT indexer/RPC. Pro reads obtain addresses through a credential-protected loopback projection in the sole database owner. Full addresses stay on the trusted server and go only to the existing metadata/RPC services for reads; the browser inventory receives opaque link IDs and shortened labels. Encryption protects stored address fields, not information legitimately needed by those read services.

The backend validates the session and link scope before and after upstream reads. Link changes during a read or between pages reject the stale result. Linking/unlinking resets the inventory query. Account inventory and wallet-link queries are marked private, excluded from persisted browser query storage and discarded when unused; enabling Pro fetches again rather than displaying a dormant cache. A persistence version change discards older query caches that did not mark wallet-link data private; session cookies and provider wallet preferences are unaffected.

Multiple trainers may link the same wallet independently. This display does **not** grant concurrent use of an NFT in matches. Trusted per-Evo reservations remain required before NFT gameplay.

## Implementation

- `src/components/player/account-inventory.tsx`: shared toolbar, section cards, pagination, notices and Pro visibility.
- `src/lib/player/inventory/{model,nfts,handler,server,types}.ts`: display mapping/filtering, defensive NFT projection, request guard, existing service/RPC adapters and DTOs.
- `src/app/api/player/inventory/route.ts`: development inventory endpoint.
- `scripts/wallet-link/core.cjs`: authenticated internal projection; public wallet operations still deny `projection`.
- `src/components/player/wallet-link.tsx`: inventory invalidation after verified link/unlink.
- `src/lib/player/auth-core.ts`: corrected item identifier/revision validation.
- `scripts/test-inventory.cjs` and `tests/inventory/inventory.test.cjs`: isolated fixture checks; compiled test output stays in ignored `node_modules`.

No game source, Nursery contract, payment amount, account inventory or hosted resource was changed.

## Verification and work log

Implementation checks cover consolidation, filters/sorts and Pro hiding; current-owner relabelling, duplicate/foreign assets, partial ownership failures and metadata lag; authenticated masked output, hostile origins/claimed owners, bounded input and link/session changes; valid catalogue IDs and invalid revisions. SQL-backed wallet tests cover the new projection using independent generated signatures, account isolation, shared links, link-version changes and revoked sessions. Test databases are separate temporary PGlite instances, never the real local database.

The initial test runner needed CommonJS JSON-import interoperability; a fixture Evo ID was corrected to a valid UUID. Those fixes changed the harness, not account data. Image paths follow the existing artwork convention: ordinary species have no chroma path component; eggs/chroma use their established variants.

The user reported sign-in hanging during this sprint. The running Turbopack compiler had panicked (`get_multiple_mut` equal keys). Stopped only the owned website preview, cleared its disposable `.next` output and restarted it with standard Next development compilation on the same port. The account service was running; its expiry was not the cause. Reloaded only the owned account service to enable the new projection, preserving the database and revoking old local sessions. Its aggregate state remains one player and **10,500 Evoros**, with no ordinary Evos assigned. Existing encrypted links are kept; the user has since confirmed a fresh Epic sign-in works.

Verification: **11 inventory tests, 18 wallet tests and 22 player/account tests passed (51 total)**. Strict TypeScript and an isolated production build passed; targeted TypeScript lint has zero errors; existing environment-declaration warnings remain in the account server. The isolated build generates all 27 static pages and writes only `.next-beta-check`. Existing unrelated build lint warnings remain. Runtime inventory checks reject anonymous/invalid sessions with HTTP 401 and hostile origins with HTTP 403. Genuine consolidated holdings/filter/unlink visuals remain a manual user check.

### Local preview command

```powershell
cd D:\documents\GitHub\evoverses-website\apps\website
pnpm dev:beta
```

This intentionally omits `--turbopack` after the observed compiler panic. Stop the owned preview before running it again. The account launcher remains separate and closes after two hours, as documented in [player accounts](website-player-accounts.md).

The final signed-out headless browser check passed: actual Epic form redirect (provider navigation intercepted), origin/cookie controls, forged-session denial, confirmation guard and mobile layout. It did not automate a real Epic login. During initial cold builds, repeated browser checks timed out at different route/image compilation stages; passing tests required the compiled pages to finish loading.

Added development-only auth diagnostics with fixed stage/outcome/status/timing fields, no URLs, credentials, proofs or player/wallet IDs. The diagnostics cannot affect authentication; a fixture test verifies sanitization and logger failure. Local unauthenticated Profile requests explicitly redirect to sign-in.

Measured preview slowness: Store first compilation took **56 seconds**; already compiled sign-in requests took **87–488 ms**, unsigned player-me reads **10–74 ms**, and the account backend **27 ms**. Store then took **133 ms** once compiled. One public Avalanche RPC probe took **268 ms**, and a minimal metadata query **1,388 ms**. These are local spot measurements, not load tests or hosted-performance guarantees. Standard compilation avoids the observed Turbopack panic but has a large cold compilation cost. The beta preview routes are being warmed after this sprint; edits or a restart may compile them again. No broad dependency upgrade or other running project was changed.

### Next step

Check the genuine two-wallet Profile view, wallet filters, Pro hiding and unlink refresh. Then implement a trusted game inventory endpoint and exclusive per-Evo match reservations before enabling NFT gameplay. Hosted account/payment deployment is a separate release step.


## Local game inventory feed — 2026-10-07

The website-owned account service now composes a trusted linked-inventory reader into the existing game account API. It reuses `inventory/nfts.ts` and the shared `inventory/sources.ts` read adapters, rather than maintaining another ownership implementation. `scripts/game-linked-inventory.cjs` compiles these modules into an ignored local cache at service startup. It checks the encrypted link projection before and after external reads and emits only shortened wallet labels.

The game receives one indexed NFT page (maximum 48 candidates) with explicit availability/completeness flags. Purchased item/Evo data survives NFT provider outages. Display-only NFT rows do not enable gameplay or writes. No new database is opened, and no AWS or payment deployment is performed. Game-side details are in the sibling account-bridge repository's `Documentation/player-account-linked-inventory.md`.

Additional tests: `node --test tests/inventory/game-feed.test.cjs`. Existing website inventory tests and strict TypeScript checks also apply to the shared adapters.

Validation: 5 shared game-feed tests and 11 existing inventory tests passed; strict website TypeScript passed. The sibling game account build, 32 native account tests, signed loopback integration and rendered menu lifecycle passed. The website-owned service was restarted to load the reader, preserving the database and 10,500 Evoros while revoking prior local sessions.

For genuine game testing, use the sibling launcher's `-Mode Account -ReuseWebsiteService` with the reviewed local run directory. It reuses the owned API and never opens the database twice. The launcher and game work remain local on `Dan/beta-account-bridge`; website changes remain on `dan-dev`. Nothing was pushed or deployed in this sprint.

## Game presentation correction - 2026-10-07

The user confirmed that ownership source must be invisible in the game, including in-game stores. The game now combines account and linked-wallet creatures in the same retained Evo grid/details and profile count. Its Pro toggle, NFT category and wallet labels have been removed. Website Pro panels and wallet filters remain as designed. Backend identity, current ownership and future exclusive per-Evo reservations stay internal; presentation does not enable battles, item writes or XP awards. Complete pagination and authoritative stats remain release requirements.


## Whole-team game reservations - 2026-10-07

Added `apps/website/scripts/game-team-authorization.cjs`, a trusted process-local adapter for the sibling game backend's team admission service. It reuses the linked-wallet/live ownership loader, returns verified adult species/identities and rechecks exact link IDs on the caller's transaction. It is not exposed through website routes or wired into the running service. The sibling service reserves the whole team or none and returns a named conflict such as “Kitsul 2253 is already in a battle. Please choose another Evo.” Website Pro behaviour is unchanged; ownership source remains invisible in game.

`test:game-inventory` now runs eight shared feed/verifier checks. The sibling backend passed its final 18 reservation cases and 28 native PostgreSQL tests, including eight independent overlapping-team admissions with one winner and no partial losing allocations. Migration tests used disposable databases; the real player database/account/links/balance and running services were untouched. Next: connect trusted game battle admission and lifecycle using a local fake battle before real gameplay authority.
