# Nursery wallet discovery repair - 19 October 2026

## Confirmed symptoms

On the signed-in main-site Bertha page, the nursery displayed `0x5F55…304f` while the external-wallet menu displayed `0x575C…26f1`. On beta, Bertha displayed the correct external wallet but its parent selector stayed on Loading. A direct authenticated beta `/api/nursery/evos` request returned the data-service-unavailable error.

The nursery public contract addresses, registry version, history addresses and metadata endpoint match between beta and main. Both sites are configured for Fuji. The owner's Fuji collection balance is 24; Fuji mode alone does not explain this failure.

## Shared data failure

A read-only execution of the actual `fujiAssets` and `readEggOrigin` source, with deployed contract settings, reproduced the provider rejection for egg #5112: `block range too large: total block range in this request exceeds the maximum of 100 blocks`. The recent-event lookup requested 1,024 blocks. Because wallet discovery uses Promise.all for canonical assets, the egg failure rejects the whole page, including adult Evos.

The diagnostic also encountered HTTP 429 under parallel metadata reads. Diagnostic tabs were closed to stop their repeated polling before the corrected lookup was verified.

## Correction

- Limit the recent egg-origin event query to 100 blocks. Preserve timestamp-based recovery for older eggs and its bounded 64-block event query, including parent and canonical-block checks.
- Batch canonical token reads at the same block through multicall, with bounded request timeout/retries.
- Use the connected external wallet for nursery discovery, approvals, actions and external-wallet chain switching, independently of the login account. Existing master-access, contract-account and wallet-change guards remain.
- Do not poll parent traits when no owned assets have loaded.

Network, deployed contract addresses, permissions, breeding economics and canonical metadata requirements are unchanged.

## Verification

All 31 nursery tests pass, including eight new regressions for recent/old egg queries, shared block timestamps, cache reorg checks, missing origins and external-wallet guards. Focused ESLint, TypeScript and the isolated production build pass. Existing unrelated repository warnings remain.

A read-only execution of the corrected source against the actual owner wallet returned all 24 NFTs in approximately 10 seconds: 18 adult Evos and six eggs, including egg #5112 as a Yotnar egg. This validated the source against real chain data before the rollout recorded below. No approval, breed, treatment or hatch transaction was submitted.


## Authorized rollout and live acceptance

Both sites were published on 19 October 2026 after separate Linux builds, 31 passing nursery tests per release, OpenNext packaging, dry runs and local Workers runtime checks. Main preserves its previously published marketplace owner-wallet fix. Beta was built from its deployed `de0d907` baseline plus only the nursery source repair and its regression tests; the main-only marketplace patch was not added to beta. Existing site variables, secrets, contract settings and permissions were preserved.

- Main version: `974fbdfc-db19-403c-adcc-92e57ffc47d2`. Rollback: `25db80ba-c45c-48bf-a6c2-145f198d720e`.
- Beta version: `3b507e53-1f3f-4918-849e-d3070f1cfec0`. Rollback: `13863c98-c446-40f0-a290-2c11b7455c21`.

Live home, Bertha and Hermann pages return HTTP 200 on both sites; anonymous account reads remain HTTP 401. Each live Bertha page references a nursery bundle whose SHA-256 exactly matches that site's tested release.

Authenticated browser acceptance passed on both sites: Bertha displays external wallet `0x575C…26f1`, and the first-parent dialog loads all 18 adult Evos. Ready-to-breed and recovering-from-breeding states are visible, with cooldown entries disabled. Beta still displays its preserved breed #1 / egg #5112 history. Only the selector was opened; no parent was selected and no approval, breed, treatment or hatch transaction was submitted. Diagnostic tabs were closed after verification.
