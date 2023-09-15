import { DeadBeef } from "@/data/constants";
import { getAddressSafe } from "@/lib/viem";
import { Address } from "abitype";
import { useAccount } from "wagmi";

export const useAddress = () => {
  const { address } = useAccount();

  if (!address) {
    return { address: DeadBeef };
  }
  const impersonate = String(
    process.env.IMPERSONATE
    || process.env.NEXT_PUBLIC_IMPERSONATE
    || ''
  ).toLowerCase() === 'true';
  const impersonateAddress = String(
    process.env.IMPERSONATE_ADDRESS
    || process.env.NEXT_PUBLIC_IMPERSONATE_ADDRESS
    || ''
  );
  return {
    address: impersonate && getAddressSafe(impersonateAddress) ? impersonateAddress as Address : address,
  };
};
