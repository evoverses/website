import { MasterInvestorABI } from "@/assets/abi/master-investor";
import { cevoABI } from "@/data/abis/cEVO";
import { evoABI } from "@/data/abis/EVO";
import { xevoABI } from "@/data/abis/xEVO";
import { client } from "@/thirdweb.config";
import type { Abi } from "abitype";
import { type Address, type Chain, type ContractOptions, getContract, type ThirdwebClient } from "thirdweb";
import { avalanche } from "thirdweb/chains";
import type { ThirdwebContract } from "thirdweb/contract";
import { erc721Abi } from "viem";

export const chain = avalanche;

type EnrichedContract<TAbi extends Abi> = Omit<ContractOptions<TAbi>, "address" | "abi"> & {
  address: Address;
  abi: TAbi;
};

export const getEnrichedContract = <TAbi extends Abi>(
  args: {
    address: Address;
    abi: TAbi;
    client: ThirdwebClient;
    chain: Chain;
  },
): EnrichedContract<TAbi> => {
  const contract = getContract(args);
  return {
    ...contract,
    address: contract.address as Address,
    abi: contract.abi!,
  } as EnrichedContract<TAbi>;
};

export const investorContract = getEnrichedContract<typeof MasterInvestorABI>({
  address: "0xD782Cf9F04E24CAe4953679EBF45ba34509F105C",
  abi: MasterInvestorABI,
  client,
  chain,
});
export const evoContract = getEnrichedContract({
  address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1",
  abi: evoABI,
  client,
  chain,
});
export const xEvoContract = getEnrichedContract({
  address: "0x693E07bf86367adF8051926F66321fa9E8eBfFb4",
  abi: xevoABI,
  client,
  chain,
});
export const cEvoContract = getEnrichedContract({
  address: "0x7B5501109c2605834F7A4153A75850DB7521c37E",
  abi: cevoABI,
  client,
  chain,
});
export const evoNftContract = getEnrichedContract({
  address: "0x4151b8afa10653d304FdAc9a781AFccd45EC164c",
  abi: erc721Abi,
  client,
  chain,
});

export const asSimpleContract = <const abi extends Abi = []>(contract: ThirdwebContract<abi>): Readonly<{
  address: Address,
  abi: abi
}> => (
  { address: contract.address as Address, abi: contract.abi! }
);
