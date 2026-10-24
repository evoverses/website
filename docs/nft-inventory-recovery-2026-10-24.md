# NFT inventory incident - 24 October 2026

## Restoration outcome

The user explicitly authorized the limited live recovery on 24 October 2026. Both images were pushed under the recovery tags below, the retention policies were corrected, and the two services were updated. GraphQL revision 3 and metadata revision 7 are now running. The live inventory query reports 49 holdings; the shared loader returns 48 on its first page with no warnings and a continuation page. The signed-in website displays the NFT cards again. Metadata for Fugush #532 returns HTTP 200 with 19 attributes. The indexer and account service were not redeployed.

Both corrected lifecycle previews had zero expiring images. The indexer's current tagged image remains present in the shared Squid repository and is now protected by the corrected retention policy. The account service's current image remains present; its separate repository has no lifecycle policy.

AWS's upcoming maintenance starts 31 October 2026 at 05:00 Brisbane (30 October 19:00 UTC). The recovered tasks launched after the new-platform cutoff in the email. The indexer and account task still predate it; their deployed images were verified present. ECS is configured for maximumPercent 200 on all four services; minimumHealthyPercent is 50 for the three infrastructure services and 100 for the account service. With desired count one, 50 percent rounds up to one healthy task. No forced restart of the indexer or account service was performed. The AWS Health API returned SubscriptionRequiredException, so the exact affected-resource list was not independently retrieved.

GitHub backup snapshots are reviewable working snapshots, not release approvals. Full build/test acceptance for unfinished progression, nursery and HUD work remains governed by their existing audit/runbook documents. No game-server deployment or Epic upload/activation is included in this incident recovery.

## Findings verified live

- The signed-in Profile links wallet `0x575CEb9E9ca3d05be1ca18997173C4e3D10f26f1`. Avalanche collection `0x4151b8afa10653d304FdAc9a781AFccd45EC164c` reports 49 tokens owned. The website shows four account Evos and an NFT service warning.
- `https://api.evoverses.com/graphql` returns HTTP 503. The shared inventory loader returns `DATA_SERVICE_UNAVAILABLE`, explaining the game and website symptom.
- In AWS account 934769272164, us-east-2, cluster infra-cluster, graphql and nextjs-api have desired count 1 and running count 0. Replacement tasks fail pulling deleted images. The indexer remains running.
- CloudTrail confirms lifecycle expiry of the GraphQL image on 10 October 2026 at 22:03:10 Brisbane and the metadata image on 11 October at 12:06:22. These are deletion times, not confirmed outage-start times.
- Both repository policies expire images beyond the newest ten, including tagged releases. Deployed services were still pinned to expired digests.

## Recovery source and images

| Service | Recovered source | Tested local image |
|---|---|---|
| GraphQL | ec58d9dfb7accdbd975bc34b148f4b5189e88186 | evoverses-nft-graphql-recovery:ec58d9d-20261024 |
| Metadata | ca8bd3d58048cac9636d1bf70969aff2151b6f45 | evoverses-nft-api-recovery:ca8bd3d-20261024-direct-start |

GraphQL image ID: `sha256:771c34e662ca3ed135ec65f7f1d678930957eb6134999a14b1b62c0a0b94f003`.

Metadata image ID: `sha256:1bdb291f2b5f70c7c75a0a58cc1ed8402158faf956a28382bcecb996e4a1802f`.

Both are linux/amd64. These are rebuilt original-source applications, not byte-identical copies of the expired images; base/build tooling may differ. Metadata has one documented startup adjustment: invoke installed Next.js directly instead of downloading pnpm at runtime. Application source is unchanged. Registry digest must be checked after push; do not assume the local image ID is the registry manifest digest.

`local-smoke.log` records successful original GraphQL inventory query and metadata API response (Kitsul #999999, 18 attributes). This used a synthetic SQL fixture on an isolated internal Docker network with no production database or credentials. It verifies service startup and API wiring, not production SQL compatibility, signed-in restoration or all routes. Owned containers/network were removed after testing.

Task-definition originals and replacement templates preserve deployed configuration, roles, networking mode, resources and secret references. No secret values were retrieved. Templates intentionally contain an invalid image placeholder until the pushed digest is verified.

## Approval gate

The earlier no-deployment instruction was overridden only for this limited live-service recovery by the user's explicit "You may" response. That approval does not authorize releasing pending game/HUD/move changes or uploading to Epic. Future reruns require checking the current service state and the authorized scope.

## Limited restoration procedure after approval

1. Recheck identity, service task revisions, failures and indexer health. Save the current lifecycle policies and service settings. Stop if there is unexpected drift from the evidence.
2. Replace lifecycle policies only for `prod-squidecrstack-repo02ac86cf-2yz4xodabtx5` and `prod-nextjsecrstack-repo02ac86cf-2iffk2m8zxzn` using lifecycle-policy.json. Retain tagged releases; expire only untagged images older than 30 days. Preview/inspect candidates before policy change. No immediate deletion command.
3. Authenticate ECR without printing the token, using the required credential skill workflow. Tag and push the two tested local images under unique recovery tags. Do not move dev/dan-dev tags. Record and verify registry digests and architecture.
4. Fill each template's image with its repository plus verified immutable digest. Confirm the image is the only task-definition change. Register the two new revisions. Update graphql first, wait for healthy ALB targets and validate its wallet inventory query; then update nextjs-api and verify a real returned token's metadata.
5. Confirm on-chain ownership count remains 49 and shared inventory loading succeeds, allowing for Evo/egg filtering and pagination. Refresh the signed-in Profile and game account; verify actual NFT Evos appear. Check service logs and restarts. Do not call success from task-count checks alone.
6. Preserve tested release tags and record deployment revisions/digests and checks. Apply the matching CDK retention correction in a separately reviewed infrastructure change so future deployments cannot restore the unsafe policy. `ecr-retention.patch` targets the website repository; it is unapplied and uses zero-context hunks (`git apply --unidiff-zero`). Do not deploy the entire current CDK working tree as part of this incident.

## Recovery boundaries

Do not restart the indexer, reset its cursor, run database migrations, alter ownership, touch NFT contracts, deploy game-server changes or upload/activate Epic artifacts.

The old task definitions point to missing images: reverting to them is not an availability rollback. If a replacement fails, preserve logs and the tagged recovery images, stop rollout of the second service, and diagnose the isolated replacement. Retain any healthy replacement. A different retained image requires its own source/configuration review; do not switch blindly to the latest dev tag. No database restore is part of this repair.

## Evidence

- service-health.json: service counts, task definitions, image-pull errors and empty GraphQL target group.
- image-expiry-events.json: CloudTrail lifecycle receipts.
- wallet-and-loader.json: current balance and loader failure.
- graphql-build.log, metadata-api-build.log, metadata-runtime-build.log: local builds.
- local-smoke.sh, fixture.sql, local-smoke.log: repeatable isolated test and results.
- prepare-recovery.ps1: read-only configuration capture and task-definition template generation.
