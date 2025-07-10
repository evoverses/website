"use client";
import { AccountName } from "@/components/account-name";
import { CopyButton } from "@/components/buttons/copy-button";
import { ChainIcon } from "@/components/icons/chain-icons";
import { ExplorerIcon } from "@/components/icons/explorer-icons";
import { useEvo } from "@/hooks/use-evo";
import { toTitleCase } from "@/utils/strings";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { FilesIcon, FlagIcon, MoreHorizontal, RefreshCwIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@workspace/ui/components/sonner";
import EvoAvatarPNG from "@/assets/collections/evos/avatar.png";
const AssetDetails = ({ tokenId, stats = [] }: { tokenId: string, stats?: { label: string, value: string }[] }) => {
  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);
  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <div className="pt-6">
        <Skeleton className="w-36 h-9" />
        <div className="flex flex-col gap-5 lg:gap-4">
          <div className="flex items-center w-full justify-between">
            <div className="flex w-full flex-wrap justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-5 rounded-full" />
                  <div className="flex items-center max-w-full gap-1">
                    <div className="max-w-full break-all line-clamp-1 w-auto">
                      <Skeleton className="h-5 w-6.5" />
                    </div>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2 text-sm">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-27.5" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="pointer-events-none animate-pulse">
                  <FilesIcon className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" className="pointer-events-none animate-pulse">
                  <RefreshCwIcon className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" className="pointer-events-none animate-pulse">
                  <MoreHorizontal className="size-5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex w-full gap-2 overflow-auto scrollbar-hide">
            <Skeleton className="h-4.5 w-15.25 rounded-sm" />
            <Skeleton className="h-4.5 w-21.5 rounded-sm" />
            <Skeleton className="h-4.5 w-19 rounded-sm" />
          </div>
          <Separator className="md:bg-transparent" />
          {stats.length > 0 && (
            <div className="flex flex-none gap-4 overflow-hidden md:gap-8 justify-between overflow-x-auto lg:overflow-hidden -mb-4 pb-4">
              {stats.map((stat) => stat && (
                <div key={stat.label} className="flex flex-col gap-2 whitespace-nowrap select-text items-start">
                  <span className="font-mono uppercase text-xs text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (!data) {
    throw new Error("No data");
  }
  return (
    <div className="pt-6">
      <span className="hidden @5xl:block w-fit max-w-full truncate break-all text-4xl min-w-0 font-semibold">
        {toTitleCase(data.metadata.species)}
      </span>
      <div className="flex flex-col gap-5 lg:gap-4">
        <div className="flex items-center w-full justify-between">
          <div className="flex w-full flex-wrap justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link href="/assets/evo">
                <div className="flex items-center gap-2">
                  <Image src={EvoAvatarPNG} alt="avatar" className="size-5 rounded-full" />
                  <div className="flex items-center max-w-full gap-1">
                    <div className="max-w-full break-all line-clamp-1 w-auto">
                      <span className="font-medium text-sm">Evos</span>
                    </div>
                  </div>
                </div>
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">Owned by</span>
                <AccountName address={data.owner} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block relative">
                <CopyButton
                  className="size-5 [&_svg]:top-0.5 [&_svg.lucide-check]:top-3 [&_svg]:absolute"
                  data={typeof window === "undefined"
                    ? ""
                    : `${window.location.protocol}//${window.location.host}/assets/evo/${data.tokenId}`}
                />
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCwIcon className="size-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus-visible:border-none focus-visible:ring-0 focus-visible:outline-0">
                  <MoreHorizontal className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`https://snowscan.xyz/nft/${data.address}/${data.tokenId}`}>
                      <ExplorerIcon chain={data.chainId} className="text-foreground" />
                      <span>View on SnowScan</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Metadata refresh has been queued")}>
                    <RefreshCwIcon className="text-foreground" />
                    <span>Refresh Metadata</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Item report coming soon.")}>
                    <FlagIcon className="text-foreground" />
                    <span>Report Item</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="flex w-full gap-2 overflow-auto scrollbar-hide">
          <Badge variant="secondary" className="uppercase font-mono rounded-sm">
            ERC-721
          </Badge>
          <Badge variant="secondary" className="uppercase font-mono rounded-sm">
            <ChainIcon chain={data.chainId} className="size-4" />
            Avalanche
          </Badge>
          <Badge variant="secondary" className="uppercase font-mono rounded-sm">
            TOKEN #{data.tokenId}
          </Badge>
        </div>
        <Separator className="md:bg-transparent" />
        {stats.length > 0 && (
          <div className="flex flex-none gap-4 overflow-hidden md:gap-8 justify-between overflow-x-auto lg:overflow-hidden -mb-4 pb-4">
            {stats.map((stat) => stat && (
              <div key={stat.label} className="flex flex-col gap-2 whitespace-nowrap select-text items-start">
                <span className="font-mono uppercase text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
AssetDetails.displayName = "AssetDetails";

export { AssetDetails };
