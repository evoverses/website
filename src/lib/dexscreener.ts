import { TokenResponse } from "@/types/dexscreener";

export const fetchPairDataOf = async (tokenAddress: string) => {
  const resp = await fetch("https://api.dexscreener.io/latest/dex/tokens/" + tokenAddress, {
    next: {
      revalidate: 3_600
    }
  })
  if (!resp.ok) {
    throw new Error("Error fetching token price")
  }
  const data: TokenResponse = await resp.json();
  const pair = data.pairs.find(pair => pair.dexId === "traderjoe" && pair.chainId === "avalanche" && pair.baseToken.address === tokenAddress);
  if (!pair) {
    throw new Error("Error finding pair");
  }
  return pair;
}
