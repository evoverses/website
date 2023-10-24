import { MasterInvestorABI } from "@/assets/abi/master-investor";
import { cevoABI } from "@/data/abis/cEVO";
import { xevoABI } from "@/data/abis/xEVO";
import { erc20ABI, erc721ABI } from "@wagmi/core";

export const investorContract = {
  address: "0xD782Cf9F04E24CAe4953679EBF45ba34509F105C",
  abi: MasterInvestorABI,
} as const;
export const evoContract = { address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1", abi: erc20ABI } as const;
export const xEvoContract = { address: "0x693E07bf86367adF8051926F66321fa9E8eBfFb4", abi: xevoABI } as const;
export const cEvoContract = { address: "0x7B5501109c2605834F7A4153A75850DB7521c37E", abi: cevoABI } as const;
export const evoNftContract = { address: "0x4151b8afa10653d304FdAc9a781AFccd45EC164c", abi: erc721ABI } as const;
