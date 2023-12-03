import { getNftsOfCollection, OpenSeaAPI } from "@/lib/opensea";
import NFT = OpenSeaAPI.NFTs.NFT;

export const getAllNFTs = async (collection_slug: string) => {
  const nfts: NFT[] = [];
  let next: string | undefined = "";
  while (typeof next !== "undefined") {
    const resp = await getNftsOfCollection(collection_slug, 200, next);
    console.log(nfts.length, resp.nfts.length, resp.next);
    nfts.push(...resp.nfts);
    next = resp.next;
  }
  return nfts;
};
