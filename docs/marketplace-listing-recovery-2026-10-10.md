# Marketplace listing recovery - 10 October 2026

## Confirmed incident
Krokon #4503 was successfully listed twice on Avalanche marketplace `0x888BEB2C914657B1eA2cCC91555C5800eecdD4c0`: listings #3 and #4, quantity one, 20,000 EVO each. The supplied transaction `0x829616bcf0f799430cb1b21fc837d017ec350e32118b133b0c248e7677cbb53c` is a successful createListing transaction for #4, not merely an NFT approval. Both records have CREATED status. No transaction was sent or cancelled by this repair.

The metadata GraphQL service returned no listings for this Evo. AWS ECS `infra-cluster/indexer` desired count was one but running count zero: CannotPullContainerError referenced deleted digest `sha256:f49a70bf555d19f3cb108cebce41890d9e01aa156b635b9bed424eab45e7589c`. GraphQL remained running and therefore served stale data.

## Website correction
The listing drawer now checks the marketplace directly before approval and again before listing, including scheduled records. Matching creator/collection/token, unexpired CREATED status and positive quantity block duplicate submissions with listing IDs. RPC failures stop submission. Reads use inclusive pages of 100 with a 1,000-record safety ceiling; exceeding it stops listing until a scalable lookup is implemented. This is a UI safeguard, not a contract prohibition or atomic cross-tab lock. Direct contract callers can still create duplicates.

Confirmed success links to the Avalanche transaction receipt and warns about indexing delay. Approval alone does not trigger listing success. Existing marketplace economics and contracts are unchanged.

## Verification
Seven marketplace tests passed, covering duplicate IDs, scheduled listings, inactive records, pagination, empty history and failed/excessive reads, alongside existing query validation tests. Production Next.js build and OpenNext adaptation passed. Website published as Worker version `a041b1e3-a5ad-4f3e-b39d-11fd595b2981`.

## Indexer recovery
An unchanged-service force deployment retained the deleted digest and failed. Recovery therefore pins the available original dev image `sha256:ad282cb1f0790e2b67bab29c667bd7ff35823229be9e7956bf4d3edbfc7fe871` in a new task revision, preserving CPU/memory, commands, environment and Secrets Manager references. It does not deploy dan-dev Nursery indexer changes. Operational validation is recorded below when confirmed. CDK reconciliation of the image pin remains follow-up work.

### Operational result and remaining blocker
Task revision 2 registered and pulled the pinned dev digest successfully. Startup connected to the metadata database, found no pending migrations, and resumed from last processed block 65,545,961. It then failed on archive authentication: HTTP 403 CREDENTIALS_INVALID from the legacy Subsquid gateway. This is a second, independent cause of stale listings. The image problem is repaired; indexing is NOT restored and listing visibility remains unresolved.

Official SQD guidance states that self-hosted v2 archives require an API key since 19 May 2026. The recommended keyless alternative is migration to the public Portal, which requires processor/data-source changes, SDK packages and field/context verification. See https://docs.sqd.dev/en/sdk/squid-sdk/evm/guides/migration/gateway-api-key and https://docs.sqd.dev/en/sdk/squid-sdk/evm/guides/migration/gateway-to-portal . No keys were read, no schema/state was reset, and no broad SDK migration was deployed during this incident.

The canonical live Evo route `/assets/evo/4503` returns HTTP 200. Incorrect guessed plural/marketplace-detail routes were rejected; these were diagnostic URL guesses, not introduced application routes.

Recommended next step: prepare and test the narrow public-Portal migration against isolated metadata state, retaining all marketplace handlers and the existing processor checkpoint. Publish only after verifying catch-up and duplicate display. Existing duplicates need explicit wallet cancellation by the owner if desired; the UI guard cannot cancel them or enforce uniqueness against direct contract calls.

## Portal migration follow-up
The approved keyless migration is deployed to the existing indexer as task revision 4, with finalized-only checkpoint compatibility and no application schema migrations. It is running and replaying the backlog. See [migration evidence and current status](marketplace-portal-migration-2026-10-10.md). Krokon listing visibility remains pending catch-up; neither listing was cancelled.
