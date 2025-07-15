export const evoByIdQuery = `
query EvoByIdQuery($tokenId: String!) {
  evoById(tokenId: $tokenId) {
    address
    auctions
    chainId
    listings
    metadata
    offers
    owner
    tokenId
  }
}
`;

export const evosByQueryQuery = `
query EvosByQueryQuery($limit: Int = 25, $listed: Boolean, $owners: [String!], $page: Int, $attributes: JSON, $sort: SortOrder = PRICE_LOW_TO_HIGH) {
  evosByQuery(
    owners: $owners
    listed: $listed
    limit: $limit
    page: $page
    sort: $sort
    attributes: $attributes
  ) {
    items {
      address
      auctions
      chainId
      listings
      metadata
      offers
      owner
      tokenId
    }
    total
    nextPage
  }
}
`;

export const evosMarketplaceSummaryQuery = `
query EvoMarketplaceSummaryQuery {
  evosMarketplaceSummary {
    activeListings
    floorPrice
    topOffer
    total
    totalVolume
    uniqueOwners
  }
}
`;
