# Nursery metadata synchronization

Status: implemented locally on website branch **dan-dev**, 2026-10-05. This completes the missing indexing/read-model implementation; it is not deployment approval or evidence of a live contract-to-browser journey.

## What players should see

The contracts already decide breeding eligibility, price, counters, treatment and hatch results. This change copies their recorded results into the website's searchable data. It does not calculate another offspring or increment another breed count.

| Contract action | Website result |
| --- | --- |
| Import an existing adult into Hermann | Its canonical species, generation, gender, elements, nature, rarity, stats and current breed history appear in the existing wallet/marketplace/metadata queries. Existing settled XP and original dates are retained. |
| Collect an egg | The actual minted token appears with its species, generation, parents and creation time. Both parents refresh to their actual contract counts and last-breed times. |
| Treat an egg or request hatching | Treatment and egg status refresh without changing the token, owner or offspring history. |
| Finish hatching | The same token becomes an adult with the exact traits/stats returned by Hermann, including Epic rarity. The metadata image URL changes so an old egg image is not permanently cached. |
| Transfer an Evo or egg | The existing NFT transfer indexer determines its current owner. The metadata handler never assigns ownership. |
| Replay an event or roll back an orphaned block | Replays assign the same contract values; they do not add another breed. Subsquid's tracked database writes restore the previous metadata or remove an orphaned new row. |

The direct Nursery wallet discovery remains available while the indexer catches up. Species names/artwork still require the existing curated species mappings; this change does not invent creature artwork or unverified traits.

## Data flow and important boundaries

1. The processor watches five events from the configured Hermann address: AdultImported, EggRecorded, EggTreated, HatchRequested and EggHatched. It also handles single-token MetadataUpdate from the configured Evo collection.
2. Events are ordered by block/log position and duplicate touches are combined. EggRecorded also refreshes both parents.
3. Each state read is pinned to that event block's hash using EIP-1898 and requireCanonical. Wrong chain, wrong Hermann-to-collection wiring, unavailable historical state and missing egg history stop processing; no fallback to latest state is used.
4. A small custom TypeORM model, **squid.nursery_evo**, stores canonical metadata by full NFT identity: chain, collection and token. It is saved through the same Subsquid Store transaction as NFT events, rather than through a separate database connection.
5. **metadata.evo_metadata** merges that overlay with the existing metadata record. Existing XP is retained; a new token starts with zero XP. Imported original birth/hatch dates are not guessed.
6. The shared function serves both metadata.get_evo and metadata.evos_aggregated_view. Wallet/marketplace lists and the JSON/image API therefore consume the same traits.

The custom model lives outside generated schema.graphql models; retain its model/index.ts export when regenerating other models. See [Subsquid's TypeORM Store documentation](https://docs.devsquid.net/sdk/resources/persisting-data/typeorm/) for the persistence mechanism. Automated tests exercise the actual Store change tracker and rollback SQL, not only a simulated counter reset.

Hermann uses zero-based trait codes. Gender 0/1 becomes female/male; nature 0 through 20 follows the existing game ordering. Rarity 0 is ordinary (the legacy API value unknown), 1 is chroma, and 2 is Epic. Epic is accepted in the canonical JSON/API type without changing the old metadata.evo PostgreSQL enum. Normal/chroma/Epic remain distinct. Gen0 metadata reports unlimited remaining lifetime breeds; other generations retain five. No contract prices, caps, cooldowns, genetics, treasury, roles or addresses were changed.

## Configuration before release

All three Nursery settings must be provided together, or all left absent to keep the new handler disabled. Partial/invalid settings fail startup. No deployment address is guessed.

| Setting | Purpose |
| --- | --- |
| CHAIN_ID | Must be 43114, Avalanche C-Chain. |
| NURSERY_HERMANN_ADDRESS | The approved deployed Hatcher_Hermann registry address. |
| NURSERY_EVO_ADDRESS | Must be the approved existing Evo collection: 0x4151b8afa10653d304fdac9a781afccd45ec164c. |
| NURSERY_FROM_BLOCK | The registry's deployment block, as a non-negative integer. |
| NFT_ADDRESSES | Must include that collection so its mints and transfers are indexed. |
| BREEDING_BACKEND | Must not be legacy-brenda when Hermann is enabled. |

These are indexer settings, separate from the Nursery website's public contract-address settings. Their collection and Hermann addresses must agree with the approved contract artifacts and deployment plan.

The ABI snapshot is taken from the website's checked-in contracts snapshot at contracts dan-dev **d13f8f6**. It includes only the five relevant events and read methods. Regenerate its facade using the repository's locked evm-typegen version after any ABI change.

### History must be present

Configure the watcher before the first AdultImported/EggRecorded event is processed. The processor watermark must still precede those events. Incubating eggs have no adultOf result; EggRecorded supplies their original species/generation. EggHatched supplies the hatch timestamp.

**Applying the migration does not backfill blocks an existing processor has already passed. Do not reset its cursor and replay NFT transfers into a populated database:** that could apply existing transfer balances again. If events were missed, first design and test a separate metadata-only replay against a database copy. Changing registries also requires explicit history reconciliation.

The RPC must support hash-pinned reads for the entire required history. A read-only check of the public Avalanche endpoint accepted a current-block hash-pinned read on the existing collection; that does not prove historical availability for a future deployment.

### Retire the old writer

The legacy Lambda breeder now fails before reading credentials or opening external services unless BREEDING_BACKEND=legacy-brenda is explicitly selected. It also refuses to run when a Hermann address is present. Stop/disable any previously deployed legacy worker when rolling out the new backend; changing this source does not stop an old deployed binary.

The legacy SQL parent-update function rejects parents already represented by the canonical overlay. The new path never uses off-chain Math.random, MAX(token_id)+1 or website-side breed-count increments. The retained legacy worker/function are not a newly validated alternative breeding system.

## Reversible migration

Migration: apps/squid/db/migrations/1791158400000-NurseryMetadata.js.

Its frozen up/down SQL creates/removes the overlay and installs/restores the shared metadata readers and legacy guard. Keep the immutable migration snapshots; editing the live SQL source later must not silently change this migration. Apply through the existing migration tooling only against an explicitly selected local/rehearsal database until release is approved.

The migration, real wallet/single-Evo queries and down/re-apply were exercised in an isolated in-memory PostgreSQL engine. No production database was connected or migrated. A rollback removes canonical overlay rows and restores legacy readers; it cannot recreate missing legacy offspring rows. Pause the new writer during a rollback and retain a backup/recovery plan before a live migration.

## Validation and reproducible commands

On a clean platform-consistent Node 22+ / pnpm 10.12.3 installation, from the website repository:

    pnpm --filter squid... install --frozen-lockfile --ignore-scripts
    pnpm --filter squid build
    pnpm --filter squid test:nursery
    pnpm --filter website test:nursery
    pnpm --filter squid plan:nursery

The plan command prints public configuration and prerequisites. It does not connect to RPC/database or perform writes. The test runner transpiles fixture code for execution; a separate strict TypeScript check is still required. PGlite 0.3.14 is a pinned **test-only** dependency, not the production database.

Fresh results:

- **30/30 new tests passed:** canonical imports/eggs/treatment/hatch, trait decoding, parent updates, trusted-address filtering, hash-pinned RPC, duplicate/out-of-order events, failure atomicity, actual database readers, ownership, XP preservation, legacy guards, migration down/re-apply and real Store rollback.
- **23/23 existing website Nursery tests passed.**
- Full Squid source compiled strictly with the locked direct dependency versions in an isolated local dependency directory: zero current or baseline errors.
- Changed-source lint: zero errors; nine warnings also present in HEAD, zero introduced warnings. New source has no lint warnings.
- Website full TypeScript check retains the same six pre-existing profile/liquidity address-type errors; no new Nursery errors.
- The API route/helper contextual type check introduces no errors; an existing recursive SVGProps declaration remains. The ordinary API check cannot pass with its missing local workspace dependencies.
- The normal frozen install accepted the lockfile but hit an existing mixed Windows/Linux node_modules permission problem at turbo-linux-64/package.json. Validation used an ignored isolated dependency/output directory to avoid disrupting the running preview. A clean platform-consistent install/full build remains necessary before release.

For this Windows/WSL checkout, the new tests were run with native Node and NURSERY_TEST_OUT set inside Node to node_modules/.nursery-validation/test-lib. The isolated dependencies and compiler output are ignored, not committed. The checked-in lockfile adds only the pinned test dependency, without unrelated dependency upgrades.

## Recommended next step

Rehearse one complete **local** contract → indexer → metadata JSON/image → wallet-list journey using mock VRF, fixture species and a disposable database. Include delayed fulfillment, completion retry, transfer, restart and rollback. The current tests cover those layers separately, not a deployed full-stack journey.

In parallel, map independent contract-review findings into tests/changes. Before enabling real spending, approve the final artifacts, import/history/species data, collection mint permissions, treasury/roles, address wiring, real-wrapper/callback checks, permanent VRF failure policy and release rollback/support procedure. Nothing in this sprint pushes, deploys or authorizes production writes.
