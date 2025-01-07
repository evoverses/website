import { MasterInvestorABI } from "@/assets/abi/master-investor";
import { cevoABI } from "@/data/abis/cEVO";
import { evoABI } from "@/data/abis/EVO";
import { xevoABI } from "@/data/abis/xEVO";
import { chain, client } from "@/thirdweb.config";
import type { Abi } from "abitype";
import { type Address, getContract } from "thirdweb";
import type { ThirdwebContract } from "thirdweb/contract";
import { erc721Abi } from "viem";

export const investorContract = getContract({
  address: "0xD782Cf9F04E24CAe4953679EBF45ba34509F105C",
  abi: MasterInvestorABI,
  client,
  chain,
});
export const evoContract = getContract({
  address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1",
  abi: evoABI,
  client,
  chain,
});
export const xEvoContract = getContract({
  address: "0x693E07bf86367adF8051926F66321fa9E8eBfFb4",
  abi: xevoABI,
  client,
  chain,
});
export const cEvoContract = getContract({
  address: "0x7B5501109c2605834F7A4153A75850DB7521c37E",
  abi: cevoABI,
  client,
  chain,
});
export const evoNftContract = getContract({
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
