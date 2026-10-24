# Marketplace owner-wallet fix - 19 October 2026

## Problem and diagnosis

The main site showed external wallet `0x575C…26f1` and its EVO balance while the listing drawer used Thirdweb's independently active account for approval and listing. The wallet menu used an external-wallet fallback to disable its selection item, which could leave a different login account active without a way to select the displayed wallet.

Public main and beta listing bundles both used `useActiveAccount` during inspection. Beta working therefore does not establish that its listing code is fixed; separate origin-specific wallet sessions can produce different outcomes. The failed main-site transaction's exact sender was not captured, so a particular in-app or smart-wallet address has not been proven responsible.

## Change

- The listing drawer gets the selected external wallet through `useChainWallet`. Its connect action offers external wallets only.
- A submission captures that wallet's account and explicitly passes it to `sendAndConfirmTransaction` for both NFT approval and createListing. It does not submit through Thirdweb's active-account hook or TransactionButton.
- On-chain `ownerOf` must match the captured wallet before approval and again before listing. In-app and smart wallets are rejected. The selected external wallet is switched to the NFT contract's chain when necessary.
- Wallet identity, address and chain are rechecked after asynchronous ownership reads and before either send. Disconnects, selection changes and ownership changes stop the remaining flow.
- Existing direct-chain duplicate checks run before approval and before listing. A synchronous in-flight guard blocks repeat clicks in the drawer.
- Both transactions must return a successful receipt. A rejected or reverted approval cannot advance to listing; a reverted listing cannot display success.
- The account menu marks and disables a wallet only when it is Thirdweb's actual active wallet, allowing the displayed external fallback wallet to be selected.

Marketplace contracts, fees, currency and duplicate-listing rules are unchanged. This change covers new listings and their NFT approval; it does not migrate other transaction drawers away from Thirdweb.

## Validation and rollout

All 20 marketplace tests pass, including 12 owner-wallet regressions. Strict TypeScript and focused ESLint checks pass. The isolated production build is checked before handoff; existing repository warnings remain unrelated to this fix.

No blockchain transactions or Git push were performed. The main-site rollout target is the existing `evoverses-production` Worker via `wrangler.production.jsonc`; beta does not need to be deployed to publish this fix to main. A real external-wallet approval/listing remains user acceptance after rollout.


## Main-site deployment

Approved publication completed on 19 October 2026. The release was rebuilt from the tested source on Linux using the existing main-site public configuration, then packaged with OpenNext and checked in the local Workers runtime. All 20 marketplace tests also passed in Linux. Main-site variables and existing encrypted secrets were preserved; beta was not deployed.

Production Worker version: `25db80ba-c45c-48bf-a6c2-145f198d720e`. Previous version retained for rollback: `ee9d13ca-360a-4d69-b5de-199ea78e771e`.

Live checks passed: home, sign-in, Store, Evo marketplace and `/assets/evo/4066` return HTTP 200; anonymous `/api/player/me` returns HTTP 401. The live Evo page references the new listing bundle, and its SHA-256 exactly matches the tested release. Beta still references its previous listing bundle. Machine-readable evidence is in `docs/evidence/marketplace-owner-wallet-20261019.json`.

The real wallet approval and listing still require the owner to refresh the main-site page and confirm in their wallet. No listing was submitted during deployment verification.
