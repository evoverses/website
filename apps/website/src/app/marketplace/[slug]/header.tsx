"use client";
import EvoBannerOpensea from "@/assets/collections/evos/banner.png";
import { collections } from "@/data/collections";
import { fetchSquidMarketplaceSummary } from "@/lib/evo/fetch";
import { Slug } from "@/types/core";
import { staleTimeMinutes } from "@/utils/numbers";
import { useQuery } from "@tanstack/react-query";
import { formatNumberWithSuffix } from "@workspace/evoverses/utils/numbers";
import { formatEther } from "viem";

const placeholderData = {
  activeListings: 0,
  floorPrice: "0",
  topOffer: "0",
  total: 0,
  totalVolume: "0",
  uniqueOwners: 0,
};

const CollectionHeader = ({ slug }: { slug: Slug }) => {
  const collection = collections.find(c => c.slug.startsWith(slug))!;
  const { data = placeholderData } = useQuery({
    queryKey: [ "marketplace-summary", collection ],
    queryFn: () => fetchSquidMarketplaceSummary(collection.slug),
    staleTime: staleTimeMinutes(5),
    placeholderData,
  });

  const stats = [
    {
      title: "Floor Price",
      value: formatNumberWithSuffix(
        data.floorPrice === "0" ? undefined : formatEther(BigInt(data.floorPrice)),
        { postfix: data.floorPrice === "0" ? undefined : "EVO" },
      ),
    },
    {
      title: "Top Offer",
      value: formatNumberWithSuffix(
        data.topOffer === "0" ? undefined : formatEther(BigInt(data.topOffer)),
        { postfix: data.topOffer === "0" ? undefined : "EVO" },
      ),
    },
    {
      title: "Total Volume",
      value: formatNumberWithSuffix(
        data.totalVolume === "0" ? undefined : formatEther(BigInt(data.totalVolume)),
        { postfix: data.totalVolume === "0" ? undefined : "EVO" },
      ),
    },
    { title: "Listed", value: formatNumberWithSuffix(data.activeListings) },
    {
      title: "Owners (Unique)",
      value: `${formatNumberWithSuffix(data.uniqueOwners)} (${(data.total > 0 ? data.uniqueOwners / data.total : 0).toLocaleString(
        "en",
        { style: "percent" },
      )})`,
    },
  ];
  return (
    <div
      className="sticky pb-2 -top-50 h-80 p-4 bg-cover bg-center z-10"
      style={{ backgroundImage: `url(${EvoBannerOpensea.src})` }}
    >
      <h1 className="sr-only">{collection.name} Marketplace</h1>
      <div className="flex h-full justify-end items-end">
        <div className="hidden sm:flex flex-wrap justify-end gap-4 items-end rounded-xl bg-black/75 px-4 py-3 backdrop-blur-sm" data-testid="marketplace-banner-stats">
          {stats.map(s => (
            <div className="flex flex-col text-right gap-1" key={s.title}>
              <span className="text-slate-200 text-sm">{s.title}</span>
              <span className="text-white font-medium font-mono">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
CollectionHeader.displayName = "CollectionHeader";

export { CollectionHeader };
