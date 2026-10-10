# Marketplace data connection migration - 10 October 2026

## Purpose and scope
Restore the existing AWS metadata indexer after its legacy SQD archive began requiring a key. Use the public Avalanche Portal instead. Hosting remains AWS for PostgreSQL/indexing and Cloudflare for the beta website. No blockchain transactions, NFT transfers, cancellation, database reset, historical rebuild from genesis, or application schema migration are included.

Automated RDS backups are enabled with seven-day retention. No additional backup or database copy was created. Database access for validation used a disposable, empty local PostgreSQL instance containing only synthetic checkpoint fixtures; it was removed after testing.

## Source and operational artifact
Development source changes are limited to the Portal builder/field selection, runner/context adapter, processor types and finalized database adapter. Existing marketplace/NFT handlers are retained. Portal selects only fields the existing handlers consume, including successful transaction status, transaction/log relationships and block timestamps. Timestamp units remain milliseconds before the existing normalization utility.

The live image is built from original deployed source commit `be38ae642b7ba88aea4718d87267428f8bc17483` plus the narrow adapter patch saved in `docs/evidence/marketplace/portal/baseline-migration.patch`. It excludes new Nursery handlers and migrations. Local dan-dev source retains those development features, which were separately type-checked without deploying them.

Dependencies added: @subsquid/evm-stream 0.1.5, @subsquid/evm-objects 0.0.3 and @subsquid/batch-processor 1.1.0. The old processor package is retained for existing utility/type dependencies. Existing TypeORM store 1.5.1 and its checkpoint tables remain in use.

## Checkpoint compatibility
The new stream skips blocks without matching events. The old adapter's hot-block transaction requires consecutive heights and rejected sparse batches on the first live attempt. Indexing was paused while the corrected finalized-only adapter was tested.

`FinalizedPortalDatabase` presents the saved finalized checkpoint to the runner rather than its provisional tail. The existing TypeORM transaction rolls back provisional writes and replays them from finalized data atomically. There is no manual checkpoint modification or deletion. Processing finalized blocks introduces a small finality delay rather than exposing provisional state.

## Evidence
- Isolated baseline compilation passed; local development source including Nursery code also type-checked.
- Public Portal checkpoint block 65,545,961 hash matched Avalanche RPC.
- Listing #4 block 97,164,188 log topics/data matched the supplied transaction receipt exactly.
- Existing event decoder produced Krokon #4503, quantity one, 20,000 EVO and listing ID four.
- Production-container read checks passed without a production database connection.
- Disposable PostgreSQL and production-container checks at 512 MB passed: sparse finalized batches, checkpoint preservation, provisional-tail rollback, restart persistence and atomic rollback after an injected error.
- Portal transient overload responses were retried successfully. They are not interpreted as empty results.

Read-only probe: `apps/squid/scripts/check-portal.cjs`. Synthetic checkpoint test: `apps/squid/scripts/check-portal-checkpoint.cjs`; it requires local host 127.0.0.1 and database portal_check and intentionally drops only its own fixture schema.

## Deployment and rollback
AWS ECS infra-cluster/indexer uses task revision 4, immutable image digest `sha256:a31ca2f2416b8ba92bfa02e72324d5ba9ebc86a363ba51c3e84fdf9c2394ce82`, tag 20261010-portal-v2, one task, 256 CPU units and 512 MB memory. DB_NAME, checkpoint-schema slug, database settings, roles and Secrets Manager references were preserved. Startup runs compiled main directly, without migration:apply. No new paid service or instance was created.

Previous task revision 2 is retained as the rollback reference. Its legacy archive remains unavailable without a key; rollback would restore the old software but not cure that existing upstream failure. Pause the service if a new consistency error occurs, preserve the database/checkpoint and investigate rather than resetting state.

Infrastructure source now supports `indexerImage` context and records PORTAL_URL. Any future CDK indexer deployment must set `-c indexerImage=sha256:a31ca2f2416b8ba92bfa02e72324d5ba9ebc86a363ba51c3e84fdf9c2394ce82` to retain this immutable image; the fallback dev tag remains legacy. No full CDK stack deployment was performed.

## Completion check
The migration is not considered complete merely because a task launches. Confirm continuing checkpoint progress, both Krokon listings through GraphQL, ownership against Avalanche, and stable service operation. Append those live results below when verified.

### Live verification so far
Corrected task f6386b766dbb4638899e5cbcf2f2bdb1 is running on revision 4; service desired/running/pending counts are 1/1/0 and deployment failed-task count is zero. The prior hot-mode task stopped. Durable progress advanced from block 65,545,963 through 65,672,194 while the finalized chain head was approximately 97,167,590. No further chain-continuity errors appeared in the corrected task. SQD intermittently responds 529 (overloaded); SDK backoff is working and progress resumes afterward. Early runner estimates fluctuate around hours, so no completion time is promised.

The metadata API still returns no listings for Krokon #4503 because replay has not reached its listing blocks yet. This remains an outstanding completion check; do not label Marketplace synchronization complete. Existing on-chain duplicate guard remains deployed and all seven marketplace tests still pass.

Recommended next step: after catch-up reaches the current head, confirm listings #3 and #4 appear, compare current ownership and listing status against Avalanche, then decide whether the owner should cancel one duplicate using their wallet. Do not reset or fast-forward the checkpoint to bypass the backlog.
