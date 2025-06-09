"use client";

import { fetchSquidAsset } from "@/lib/evo/fetch";
import { staleTimeMinutes } from "@/utils/numbers";
import { useQuery } from "@tanstack/react-query";

export const useEvo = (tokenId: string) => {
  return useQuery({
    queryKey: [ "evo", tokenId ],
    queryFn: () => fetchSquidAsset(tokenId).catch(() => null),
    placeholderData: null,
    staleTime: staleTimeMinutes(5),
  });
};
