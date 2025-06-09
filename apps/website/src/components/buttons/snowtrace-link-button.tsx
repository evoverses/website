"use client";
import { client } from "@/lib/thirdweb/config";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@workspace/ui/components/hover-card";
import type { Address } from "abitype";
import Link from "next/link";
import { useEnsName } from "thirdweb/react";

export const SnowtraceLink = ({ bytes, type = "address" }: { bytes: string, type?: "tx" | "address" }) => {
  const shortBytes = bytes ? bytes.slice(0, type === "tx" ? 6 : 8) + "..." + bytes.slice(type === "tx" ? -6 : -4) : "";
  const { data: ensName } = useEnsName({
    client,
    address: bytes as Address,
  });
  return (

    <HoverCard openDelay={500}>
      <HoverCardTrigger asChild>
        <Link
          href={`https://snowscan.xyz/${type}/${bytes}`}
          prefetch={false}
          target="_blank"
          rel="nofollow noreferrer"
          className="flex items-center"
        >
          {ensName || shortBytes}
          <ExternalLinkIcon className="inline-block w-4 h-4 ml-1" />
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="py-1 w-fit">
        {bytes}
      </HoverCardContent>
    </HoverCard>
  );
};
