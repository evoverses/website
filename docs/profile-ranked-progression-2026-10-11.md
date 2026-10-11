# Profile and balance recovery after ranked progression

## Problem and changes

A reported profile error reads `Invalid unlocked combat move`. Website learnsets lagged behind the current game/account catalogue: Lamphal Drainage (2001) is now a level-one move, and Kaos now starts with Tackle (4001). Synced these two entries from the current game repository. Relevant game commits are `d79e8a9d8` and `6f40be6af01161fa155623322f4731ea8732c58a`.

The website also incorrectly required earned Evo XP to equal its immutable birth-record XP (zero). Removed that equality while retaining birth-schema, identity, non-breedable, species and ownership validation. An Evo can earn XP without rewriting its original creation data.

NFT combat responses already include account-service XP and level. The website now validates and retains those fields, rebuilds NFT stat/move projections using that XP, and then overlays confirmed HP, PP and recovery state. A partial/malformed progression pair or inconsistent derived level is rejected. Locked move names remain hidden; genuinely locked or unknown combat moves remain invalid.

The menu balance endpoint no longer loads inventory. A valid Evoros balance can be returned even when inventory is unavailable. Inventory remains independently authenticated and validated by its own endpoint and profile loader. Only the navbar consumes `/api/player/me` in the current website source.

Synced the shared level-HP display helper with the current account-service policy revision 2: L1 starts at rounded L100 HP / 20, increasing linearly to L100. Verified combat HP/max HP remain authoritative. This does not write combat health, refill PP or alter recovery.

## Verification

- Inventory: 24 passing checks, including Lamphal/Kaos starter moves, earned account XP with unchanged birth stats, NFT XP newer than metadata, preserved zero HP/PP/recovery, malformed progression, and locked/unknown move rejection.
- Player/auth/admin and marketplace: 66 passing checks, including the actual menu-balance route with an inventory reader that throws.
- Next.js production and OpenNext Cloudflare builds passed. Existing dependency/lint warnings remain.
- No database migration, balance grant, account modification, game build, AWS deployment or NFT transaction is included.

## Reported accounts and next check

The user reports Chalkrunner is missing both pack and wallet Evos, and sees unavailable Evoros. These defects can cause those symptoms; a signed-in Chalkrunner profile has not been inspected directly. After rollout, refresh both affected profiles and confirm their Evos, earned levels, moves and balance. If a failure remains, inspect that authenticated response rather than granting replacement Evos or resetting saved combat data.

## Published beta

Cloudflare Worker version `54b59e6d-0219-4669-8a5a-ea3000492f23` is live on beta.evoverses.com. Public sign-in returns HTTP 200; unauthenticated `/api/player/me` correctly returns HTTP 401. These smoke checks do not substitute for the reported accounts' signed-in profile check.
