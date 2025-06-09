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
