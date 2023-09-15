import { MasterInvestorABI } from "@/assets/abi/master-investor";
import { erc20ABI } from "@wagmi/core";

export const investorContract = { address: "0xD782Cf9F04E24CAe4953679EBF45ba34509F105C", abi: MasterInvestorABI } as const;
export const evoContract = { address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1", abi: erc20ABI } as const;
