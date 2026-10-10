import { requireBreedingApproval } from "../beta/release-policy";
import { evoContractAddress, evoNftContractAddress } from "@/data/addresses";
import { client, chain } from "@/lib/thirdweb/config";
import berthaJson from "./abi/Breeder_Bertha.json";
import hermannJson from "./abi/Hatcher_Hermann.json";
import {
  createPublicClient,
  http,
  isAddress,
  zeroAddress,
  type Abi,
  type Address,
  type Hex,
  encodeFunctionData,
  erc20Abi,
  erc721Abi,
} from "viem";
import { avalanche } from "viem/chains";
import { prepareTransaction, sendTransaction } from "thirdweb";
import type { Account } from "thirdweb/wallets";
import { nativeBudget } from "./rules";
import { discoverOwnedEggs } from "./discovery";

export const berthaAbi = berthaJson as Abi;
export const hermannAbi = hermannJson as Abi;
export const TREASURY = "0x9F64C4bECa7BBda647B9A755B29F7F9687bc4303" as Address;
const configuredAddress = (value?: string): Address | undefined =>
  value && isAddress(value, { strict: true }) && value !== zeroAddress
    ? (value as Address)
    : undefined;
export const berthaAddress = configuredAddress(
  process.env.NEXT_PUBLIC_BREEDER_BERTHA_ADDRESS,
);
export const hermannAddress = configuredAddress(
  process.env.NEXT_PUBLIC_HATCHER_HERMANN_ADDRESS,
);
export const nurseryConfigured = Boolean(
  berthaAddress &&
    hermannAddress &&
    berthaAddress.toLowerCase() !== hermannAddress.toLowerCase(),
);
export const nurseryClient = createPublicClient({
  chain: avalanche,
  transport: http(),
});
const enumerableNftAbi = [
  ...erc721Abi,
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;

export const discoverNurseryEggs = (owner: Address, signal?: AbortSignal) => {
  if (!nurseryConfigured) throw new Error("The nursery is opening soon.");
  return discoverOwnedEggs(owner, {
    blockNumber: () => nurseryClient.getBlockNumber({ cacheTime: 0 }),
    balance: (address, blockNumber) => nurseryClient.readContract({
      address: evoNftContractAddress, abi: enumerableNftAbi,
      functionName: "balanceOf", args: [address as Address], blockNumber,
    }),
    tokenIds: (address, indices, blockNumber) => nurseryClient.multicall({
      allowFailure: false, blockNumber,
      contracts: indices.map(index => ({
        address: evoNftContractAddress, abi: enumerableNftAbi,
        functionName: "tokenOfOwnerByIndex", args: [address as Address, index],
      })),
    }) as Promise<bigint[]>,
    eggStatuses: async (ids, blockNumber) => {
      const values = await nurseryClient.multicall({
        allowFailure: false, blockNumber,
        contracts: ids.map(id => ({
          address: hermannAddress!, abi: hermannAbi, functionName: "eggs", args: [id],
        })),
      });
      return values.map(value => (value as Egg)[5]);
    },
  }, signal);
};

export const sameAddress = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();
export const nurseryScope = `43114:${berthaAddress?.toLowerCase()}:${hermannAddress?.toLowerCase()}`;
export type Adult = {
  species: bigint;
  generation: bigint;
  totalBreeds: bigint;
  lastBreedTime: bigint;
  attributes: {
    gender: bigint;
    rarity: bigint;
    primaryType: bigint;
    secondaryType: bigint;
    nature: bigint;
    size: bigint;
  };
  stats: {
    health: bigint;
    attack: bigint;
    defense: bigint;
    special: bigint;
    resistance: bigint;
    speed: bigint;
  };
};
export type Egg = readonly [
  bigint,
  bigint,
  bigint,
  bigint,
  boolean,
  number,
  bigint,
];
export type BreedRequest = readonly [
  Address,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  number,
];
export const readHermann = <T>(
  functionName: string,
  args: readonly unknown[] = [],
) =>
  nurseryClient.readContract({
    address: hermannAddress!,
    abi: hermannAbi,
    functionName,
    args,
  }) as Promise<T>;
export const readBertha = <T>(
  functionName: string,
  args: readonly unknown[] = [],
) =>
  nurseryClient.readContract({
    address: berthaAddress!,
    abi: berthaAbi,
    functionName,
    args,
  }) as Promise<T>;
export async function verifyNursery() {
  if (!nurseryConfigured) throw new Error("The nursery is opening soon.");
  const [
    chainId,
    bToken,
    hToken,
    bNft,
    hNft,
    hatcher,
    breeder,
    bTreasury,
    hTreasury,
    bPaused,
    hPaused,
  ] = await Promise.all([
    nurseryClient.getChainId(),
    readBertha<Address>("evoToken"),
    readHermann<Address>("evoToken"),
    readBertha<Address>("evoNft"),
    readHermann<Address>("evoNft"),
    readBertha<Address>("hatcher"),
    readHermann<Address>("breeder"),
    readBertha<Address>("TREASURY"),
    readHermann<Address>("TREASURY"),
    readBertha<boolean>("paused"),
    readHermann<boolean>("paused"),
  ]);
  if (
    chainId !== 43114 ||
    !sameAddress(bToken, evoContractAddress) ||
    !sameAddress(hToken, evoContractAddress) ||
    !sameAddress(bNft, evoNftContractAddress) ||
    !sameAddress(hNft, evoNftContractAddress) ||
    !sameAddress(hatcher, hermannAddress!) ||
    !sameAddress(breeder, berthaAddress!) ||
    !sameAddress(bTreasury, TREASURY) ||
    !sameAddress(hTreasury, TREASURY)
  )
    throw new Error("The nursery is not ready. Please try again later.");
  if (bPaused || hPaused) throw new Error("The nursery is temporarily paused.");
}
export async function vrfQuote(address: Address, abi: Abi) {
  const gasPrice = await nurseryClient.getGasPrice();
  const quote = (await nurseryClient.readContract({
    address,
    abi,
    functionName: "quoteVrf",
    args: [gasPrice],
  })) as bigint;
  return { gasPrice, quote, maximum: nativeBudget(quote) };
}
export async function ownerOf(tokenId: string) {
  return nurseryClient.readContract({
    address: evoNftContractAddress,
    abi: erc721Abi,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });
}
export async function sendNurseryTransaction(
  account: Account,
  to: Address,
  abi: Abi,
  functionName: string,
  args: readonly unknown[],
  options: {
    value?: bigint;
    gasPrice?: bigint;
    submitted?: (hash: Hex) => void;
    beforeSend?: () => Promise<void>;
  } = {},
) {
  if (["breed", "completeBreed"].includes(functionName)) requireBreedingApproval();
  const data = encodeFunctionData({ abi, functionName, args });
  // A successful simulation is required before any wallet confirmation is requested.
  await nurseryClient.call({
    account: account.address as Address,
    to,
    data,
    value: options.value ?? 0n,
    gasPrice: options.gasPrice,
  });
  await options.beforeSend?.();
  const sent = await sendTransaction({
    account,
    transaction: prepareTransaction({
      client,
      chain,
      to,
      data,
      value: options.value ?? 0n,
      gasPrice: options.gasPrice,
    }),
  });
  options.submitted?.(sent.transactionHash);
  const receipt = await nurseryClient.waitForTransactionReceipt({
    hash: sent.transactionHash,
    confirmations: 1,
  });
  if (receipt.status !== "success")
    throw new Error(
      "The transaction did not complete. Please refresh before trying again.",
    );
  return receipt;
}
export async function approveEvo(
  account: Account,
  spender: Address,
  amount: bigint,
  guard: () => Promise<void>,
) {
  await guard();
  const [balance, allowance] = await Promise.all([
    nurseryClient.readContract({
      address: evoContractAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address as Address],
    }),
    nurseryClient.readContract({
      address: evoContractAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address as Address, spender],
    }),
  ]);
  if (balance < amount) throw new Error("You need more EVO in this wallet.");
  if (allowance >= amount) return;
  // Approval is limited to this action's exact cost, and confirmation precedes spending.
  await sendNurseryTransaction(
    account,
    evoContractAddress,
    erc20Abi,
    "approve",
    [spender, amount],
    { beforeSend: guard },
  );
  await guard();
}
export function nurseryError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong. Refresh and try again.";
  if (/reject|denied/i.test(message)) return "Wallet request cancelled.";
  if (/insufficient funds/i.test(message))
    return "You need more AVAX for the surcharge and network gas.";
  if (/execution reverted|contract function|call exception/i.test(message))
    return "This action is no longer available. Refresh your Evos and check their status.";
  return message.length > 220
    ? "The nursery could not confirm this action. Refresh and try again."
    : message;
}
