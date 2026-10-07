import { createPublicClient, erc721Abi, http, type Address } from "viem";
import { avalanche } from "viem/chains";
import { evosByQueryQuery } from "../../evo/queries";
import type { NftSources } from "./nfts";
const collection = "0x4151b8afa10653d304FdAc9a781AFccd45EC164c" as Address;
// Shared website/game read adapters; never accept caller-supplied network URLs.
export function createNftSources(
  signal: AbortSignal = AbortSignal.timeout(14000),
): NftSources {
  const chain = createPublicClient({
    chain: avalanche,
    transport: http(undefined, { timeout: 5000, retryCount: 0 }),
  });
  async function fetchIndexed(owners: string[], page: number) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_EVOVERSES_GRAPHQL_URL || "",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationName: "EvosByQueryQuery",
          query: evosByQueryQuery,
          variables: { owners, limit: 48, page },
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.any([AbortSignal.timeout(8000), signal]),
      },
    );
    if (!response.ok) throw Error("Indexed inventory unavailable");
    const reader = response.body?.getReader();
    if (!reader) throw Error("Missing indexed inventory");
    const parts: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 1024 * 1024) {
          await reader.cancel();
          throw Error("Indexed inventory exceeds limit");
        }
        parts.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    const value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)),
    );
    if (value.errors || !value.data?.evosByQuery)
      throw Error("Indexed inventory unavailable");
    return value.data.evosByQuery;
  }
  async function readChain(owners: string[], tokenIds: string[]) {
    const blockNumber = await chain.getBlockNumber({ cacheTime: 0 });
    const counts = await chain.multicall({
      blockNumber,
      allowFailure: true,
      contracts: owners.map((owner) => ({
        address: collection,
        abi: erc721Abi,
        functionName: "balanceOf",
        args: [owner as Address],
      })),
    });
    const ownership = tokenIds.length
      ? await chain.multicall({
          blockNumber,
          allowFailure: true,
          contracts: tokenIds.map((id) => ({
            address: collection,
            abi: erc721Abi,
            functionName: "ownerOf",
            args: [BigInt(id)],
          })),
        })
      : [];
    return {
      counts: counts.map((value) =>
        value.status === "success" ? (value.result as bigint) : null,
      ),
      owners: ownership.map((value) =>
        value.status === "success" ? (value.result as string) : null,
      ),
    };
  }
  return { fetchIndexed, readChain };
}
