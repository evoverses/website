"use client";
import { useQuery } from "@tanstack/react-query";
import { evoContractAddress } from "@/data/addresses";
import { readEvoBalance } from "@/lib/store/token";
import type { Address } from "viem";

export function useEvoBalance(address?: string, enabled = true) {
  return useQuery({
    queryKey: ["evoros-evo-balance", 43114, evoContractAddress, address?.toLowerCase()],
    enabled: Boolean(address) && enabled,
    queryFn: () => readEvoBalance(address as Address),
    staleTime: 15_000,
    retry: 1,
    refetchInterval: enabled && address ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
}
