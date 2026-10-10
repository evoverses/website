type Listing = { listingId: bigint; tokenId: bigint; assetContract: string; listingCreator: string; status: number; endTimestamp: bigint; quantity: bigint };

/** Include scheduled listings: an indexer delay must not permit listing twice. */
export function assertNoDuplicateListing(listings: readonly Listing[], target: { tokenId: bigint; assetContract: string; creator: string }, nowSeconds: bigint) {
  const existing = listings.filter(listing => listing.tokenId === target.tokenId
    && listing.assetContract.toLowerCase() === target.assetContract.toLowerCase()
    && listing.listingCreator.toLowerCase() === target.creator.toLowerCase()
    && listing.status === 1 && listing.quantity > 0n && listing.endTimestamp > nowSeconds);
  if (existing.length) throw new Error(`This Evo already has listing ${existing.map(listing => "#" + listing.listingId).join(", ")} on Avalanche. Open its existing listing instead of listing it again. Website updates may be delayed.`);
}

/** Bound RPC work and fail closed rather than treating an incomplete scan as empty. */
export async function checkListingDuplicates(readCount: () => Promise<bigint>, readPage: (start: bigint, end: bigint) => Promise<readonly Listing[]>, target: { tokenId: bigint; assetContract: string; creator: string }, nowSeconds: bigint) {
  const count = await readCount();
  if (count < 0n || count > 1000n) throw new Error("Unable to safely check existing listings. Please try again later; no listing was submitted.");
  for (let start = 0n; start < count; start += 100n) {
    const end = start + 99n < count ? start + 99n : count - 1n;
    assertNoDuplicateListing(await readPage(start, end), target, nowSeconds);
  }
}
