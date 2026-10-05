import { evoContractAddress } from "@/data/addresses";
import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  type Address,
} from "viem";
import { avalanche } from "viem/chains";

// Read-only C-Chain client. No wallet client, transfer, approve or signing methods.
const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc", {
    timeout: 10_000,
    retryCount: 1,
  }),
});
export async function readEvoBalance(owner: Address): Promise<string> {
  const [balance, decimals] = await Promise.all([
    client.readContract({
      address: evoContractAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [owner],
    }),
    client.readContract({
      address: evoContractAddress,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);
  if (decimals !== 18) throw new Error("Unexpected EVO token configuration.");
  // A string is safe in the site's persisted query cache; raw bigint is not.
  return formatUnits(balance, decimals);
}
