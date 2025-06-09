import { marketplaceContract } from "@/data/contracts";
import { chain } from "@/lib/thirdweb/config";
import { staleTimeMinutes } from "@/utils/numbers";
import { useQuery } from "@tanstack/react-query";
import { getPlatformFeeInfo } from "thirdweb/extensions/common";

export const useMarketplaceInfo = (chainId: number | string = chain.id) => {

  const { data = { platformFeeRecipient: "", platformFeeBps: 200 } } = useQuery({
    queryKey: [ "marketplace-info", chainId ],
    queryFn: async () => {
      const [ platformFeeRecipient, platformFeeBps ] = await getPlatformFeeInfo({ contract: marketplaceContract });
      return {
        platformFeeRecipient,
        platformFeeBps,
      };
    },
    placeholderData: { platformFeeRecipient: "", platformFeeBps: 200 },
    staleTime: staleTimeMinutes(60 * 12),
  });
  return {
    contract: marketplaceContract,
    feePercent: data.platformFeeBps / 10_000,
    platformFeeRecipient: data.platformFeeRecipient,
  };
};
