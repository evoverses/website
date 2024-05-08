"use client";
import { config } from "@/wagmi.config";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import type { Address } from "abitype";
import Link from "next/link";
import { useEnsName } from "wagmi";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

export const SnowtraceLink = ({ bytes, type = "address" }: { bytes: string, type?: "tx" | "address" }) => {
  const shortBytes = bytes ? bytes.slice(0, type === "tx" ? 6 : 8) + "..." + bytes.slice(type === "tx" ? -6 : -4) : "";
  const { data: ensName } = useEnsName({
    config,
    address: bytes as Address,
    chainId: 43_114,
    scopeKey: bytes,
    query: {
      enabled: type === "address",
      staleTime: 3_600_000, // 1 hour
    },
  });
  return (
    <Link
      href={`https://43114.snowtrace.io/${type}/${bytes}`}
      prefetch={false}
      target="_blank"
      rel="nofollow noreferrer"
      className="flex items-center"
    >
      <HoverCard openDelay={500}>
        <HoverCardTrigger>{ensName || shortBytes}</HoverCardTrigger>
        <HoverCardContent className="py-1 w-fit">
          {bytes}
        </HoverCardContent>
      </HoverCard>
      <span></span>
      <ExternalLinkIcon className="inline-block w-4 h-4 ml-1" />
    </Link>
  );
};
