import { mainnetNurseryDependencies } from "./network-config";
import { requireNurseryAccess } from "./access";
import { runAuditedTransaction } from "./audit-client";
import type { TransactionPhase } from "./progress";
import { nurseryGasBudget } from "./gas-budget";
import { nurseryAction } from "./audit-core";
import { requireBreedingApproval } from "../beta/release-policy";
import { nurseryTokenAddress as evoContractAddress, nurseryNftAddress as evoNftContractAddress, nurseryBerthaAddress, nurseryHermannAddress, nurseryNetworkConfigured, nurseryWrapperAddress, nurseryChain, nurseryTransactionsEnabled, usesChainlinkRandomness, nurseryRegistryVersion } from "./network";
import { sendNurseryWalletTransaction } from "./wallet-send";
import berthaJson from "./abi/Breeder_Bertha.json";
import hermannJson from "./abi/Hatcher_Hermann.json";
import {
  createPublicClient,
  http,
  type Abi,
  type Address,
  type Hex,
  encodeFunctionData,
  erc20Abi,
  maxUint256,
  erc721Abi,
} from "viem";
import type { Account } from "thirdweb/wallets";
import { nativeBudget } from "./rules";
import { discoverOwnedEggs } from "./discovery";

export const berthaAbi = berthaJson as Abi;
export const hermannAbi = hermannJson as Abi;
export const TREASURY = "0x9F64C4bECa7BBda647B9A755B29F7F9687bc4303" as Address;
export const berthaAddress = nurseryBerthaAddress;
export const hermannAddress = nurseryHermannAddress;
export const nurseryConfigured = nurseryNetworkConfigured;
export const nurseryClient = createPublicClient({
  chain: nurseryChain,
  batch: { multicall: true },
  transport: http(undefined, { timeout: 10_000, retryCount: 1 }),
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
export const nurseryScope = `${nurseryChain.id}:${berthaAddress?.toLowerCase()}:${hermannAddress?.toLowerCase()}`;
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
  if (nurseryRegistryVersion === 2 && await readHermann<bigint>("registryVersion") !== 2n) throw new Error("The configured OG nursery version could not be verified.");
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
    bWrapper,
    hWrapper,
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
    readBertha<Address>("vrfWrapper"),
    readHermann<Address>("vrfWrapper"),
  ]);
  if (
    chainId !== nurseryChain.id ||
    !sameAddress(bToken, evoContractAddress) ||
    !sameAddress(hToken, evoContractAddress) ||
    !sameAddress(bNft, evoNftContractAddress) ||
    !sameAddress(hNft, evoNftContractAddress) ||
    !sameAddress(hatcher, hermannAddress!) ||
    !sameAddress(breeder, berthaAddress!) ||
    !sameAddress(bTreasury, TREASURY) ||
    !sameAddress(hTreasury, TREASURY) ||
    !sameAddress(bWrapper, nurseryWrapperAddress) ||
    !sameAddress(hWrapper, nurseryWrapperAddress)
  )
    throw new Error("The nursery is not ready. Please try again later.");
  if (nurseryChain.id === 43114) {
    const [incubation, bConfirmations, hConfirmations, bAuthority, hAuthority] = await Promise.all([
      readHermann<bigint>("INCUBATION_TIME"), readBertha<bigint>("requestConfirmations"),
      readHermann<bigint>("requestConfirmations"), readBertha<Address>("authority"), readHermann<Address>("authority"),
    ]);
    if (incubation !== 259200n || bConfirmations !== 3n || hConfirmations !== 3n ||
        !sameAddress(bAuthority, mainnetNurseryDependencies.authority) || !sameAddress(hAuthority, mainnetNurseryDependencies.authority))
      throw new Error("The production nursery configuration could not be verified.");
  }
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
    onProgress?: (phase: TransactionPhase) => void;
  } = {},
) {
  if (nurseryTransactionsEnabled === false) throw new Error("Nursery signing is not enabled for this release.");
  if (["breed", "completeBreed"].includes(functionName)) requireBreedingApproval();
  await requireNurseryAccess();
  // A ready user action records the automatic callback even if the pending view was closed.
  if (usesChainlinkRandomness && ["completeBreed", "completeHatch"].includes(functionName)) {
    const keeper = functionName === "completeBreed" ? "bertha" : "hermann";
    const requestId = keeper === "bertha"
      ? (await readBertha<BreedRequest>("requests", args))[6]
      : (await readHermann<Egg>("eggs", args))[6];
    const response = await fetch(`/api/nursery/randomness?keeper=${keeper}&id=${requestId}`, { method: "POST", cache: "no-store", redirect: "error" });
    if (!response.ok || (await response.json()).status !== "fulfilled") throw new Error("The Chainlink callback audit is still being checked. Refresh before finishing this request.");
  }
  const data = encodeFunctionData({ abi, functionName, args });
  const request = { account: account.address as Address, to, data, value: options.value ?? 0n, gasPrice: options.gasPrice };
  let gas: bigint | undefined;
  return runAuditedTransaction({
    action: nurseryAction.parse(functionName), wallet: account.address,
    target: to, args: args.map(String), value: String(options.value ?? 0n),
  }, {
    simulate: async () => {
      gas = nurseryGasBudget(await nurseryClient.estimateGas(request));
      // Check the exact gas allowance we will send, rather than an unlimited eth_call.
      await nurseryClient.call({ ...request, gas });
    },
    guard: async () => { await options.beforeSend?.(); await requireNurseryAccess(); },
    send: async () => {
      if (gas === undefined) throw new Error("Transaction gas has not been checked.");
      options.onProgress?.("wallet");
      return (await sendNurseryWalletTransaction(account, { chainId: nurseryChain.id, to, data, value: options.value ?? 0n, gasPrice: options.gasPrice, gas })).transactionHash;
    },
    submitted: hash => { options.submitted?.(hash as Hex); options.onProgress?.("confirming"); },
    wait: async hash => {
      const receipt = await nurseryClient.waitForTransactionReceipt({ hash: hash as Hex, confirmations: 1 });
      if (receipt.status === "success") options.onProgress?.("confirmed");
      return receipt;
    },
  });
}
export async function approveEvo(
  account: Account,
  spender: Address,
  amount: bigint,
  guard: () => Promise<void>,
  options: { persistent?: boolean; onRequired?: () => void; onProgress?: (phase: TransactionPhase) => void } = {},
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
  const approvalAmount = options.persistent ? maxUint256 : amount;
  if (allowance >= approvalAmount) return;
  options.onRequired?.();
  // Persistent permission is explicit in the UI; every actual action still requires a signature.
  await sendNurseryTransaction(
    account,
    evoContractAddress,
    erc20Abi,
    "approve",
    [spender, approvalAmount],
    { beforeSend: guard, onProgress: options.onProgress },
  );
  await guard();
}
export function nurseryError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
        ? error.message
        : "Something went wrong. Refresh and try again.";
  if (/nonce too low|nonce has already been used|already known/i.test(message))
    return "Another transaction used this wallet's nonce. Check your wallet's pending transactions before retrying this action.";
  if (/reject|denied/i.test(message)) return "Wallet request cancelled.";
  if (/insufficient funds/i.test(message))
    return "You need more AVAX for the surcharge and network gas.";
  if (/execution reverted|contract function|call exception/i.test(message))
    return "This action is no longer available. Refresh your Evos and check their status.";
  return message.length > 220
    ? "The nursery could not confirm this action. Refresh and try again."
    : message;
}
