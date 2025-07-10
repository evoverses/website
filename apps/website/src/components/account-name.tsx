"use client";

import { client } from "@/lib/thirdweb/config";
import { staleTimeMinutes } from "@/utils/numbers";
import { shortenAddress } from "@/utils/strings";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { resolveName } from "thirdweb/extensions/ens";
import { zeroAddress } from "viem";

const AccountName = ({
  address,
  format,
  className,
}: {
  address?: string,
  format?: "default" | "start" | "start_hash" | "end",
  className?: string
}) => {
  const { data } = useQuery({
    queryKey: [ "ens-name", address ],
    enabled: !!address,
    queryFn: async () => {
      //try {
      //  const profile = await fetchSquidProfile(address!);
      //  if (profile.username) {
      //    return profile.username;
      //  }
      //} catch {
      //  //
      //}
      if (address === zeroAddress) {
        return `NullAddress`;
      }
      return resolveName({ client, address: address || "" });
    },
    staleTime: staleTimeMinutes(60), // 1 hour
  });
  if (!address) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger className="peer/address" data-variant={data ? "ens" : "address"}>
        <span className={className}>{data ?? shortenAddress(address, { format: format || "start" })}</span>
      </TooltipTrigger>
      <TooltipContent className="px-4 py-2">
        <span>{address}</span>
      </TooltipContent>
    </Tooltip>
  );
};
AccountName.displayName = "AccountName";

export { AccountName };
