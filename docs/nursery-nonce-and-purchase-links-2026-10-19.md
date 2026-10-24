# Nursery nonce and marketplace purchase links - 2026-10-19

## Report and diagnosis

MetaMask reported `nonce too low: next nonce 108, tx nonce 107` while treating an egg. The authenticated nursery audit showed five overlapping approval starts, one confirmed approval, and no treatment submission. Each egg/card previously had an independent busy flag. Thirdweb also fetched and explicitly supplied a pending nonce using its RPC before forwarding the request to the external wallet.

The marketplace success drawer read its receipt from the approval hook rather than the purchase confirmation. Existing allowance meant there was no approval receipt and the link became `#`; a new approval could link to the wrong transaction. The profile link targeted `/accounts/<wallet>`, for which this application has no page.

## Changes

- Share one nursery workflow lock per wallet and chain across cards, covering the full approval and action. Release it after success or failure.
- Pass checked calldata, value, gas and chain directly to the pinned external wallet, letting that wallet assign the nonce. Do not retry rejected submissions automatically. Preserve simulation, ownership guards, audit requirements and receipt checks.
- Batch nursery reads and serialize queued audit delivery to reduce overlapping requests.
- Capture the confirmed marketplace purchase hash. Open its receipt in a separate tab. Use a full navigation to the supported `/profile` page to load fresh account data and clear the checkout overlay.

## Validation

36 nursery tests, 25 nursery security tests and 22 marketplace tests passed. Purchase tests exercise both approval-required and approval-skipped flows, confirming that neither approval hashes nor missing receipts become success links. Wallet tests verify shared locking, lock release, preserved gas/calldata/value, and absence of a forced nonce or automatic resend. TypeScript and focused lint passed. Both isolated Linux production builds and Cloudflare runtime smoke checks passed, including public pages, protected endpoint origin checks and launcher no-update behavior.

Read-only Chrome verification confirmed the signed-in `/profile` page renders the trainer and inventory. No purchase, approval, treatment or other wallet transaction was submitted by the agent. Funded transaction completion remains user acceptance.

Deployment versions and live asset hash checks are recorded in `docs/evidence/nursery-nonce-purchase-links-20261019.json`.
