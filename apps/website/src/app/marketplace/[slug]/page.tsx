"use client";
import { ListingStatus, useSortFilters } from "@/components/filters";
import { CollectionItemsFilterBar } from "@/components/filters/filter-bar";
import { GridView } from "@/components/views/grid-view";
import { useConnectedWalletAddresses } from "@/hooks/use-connected-wallets";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { buildSquidAttributeFilters, fetchSquidAssets } from "@/lib/evo/fetch";
import { staleTimeMinutes } from "@/utils/numbers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";

const MarketplaceAssetsPage = () => {
  const {
    sort,
    listingStatus,
    stage,
    price,
    gender,
    generation,
    species,
    nature,
    element,
    chroma,
    totalBreeds,
    attack,
    special,
    defense,
    resistance,
    speed,
    size,
    level,
    treated,
  } = useSortFilters();
  const wallets = useConnectedWalletAddresses();
  const {
    data = { pages: [ { items: [], total: 0, nextPage: null } ], pageParams: [] },
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isPlaceholderData,
  } = useInfiniteQuery({
    queryKey: [ "marketplace-evos", sort, listingStatus, stage, price, gender, generation, species, nature, element,
      chroma, totalBreeds, attack, special, defense, resistance, speed, size, level, treated ],
    queryFn: ({ pageParam }: { pageParam?: number }) => fetchSquidAssets({
      page: pageParam || undefined,
      sort: sort || undefined,
      listed: listingStatus.includes(ListingStatus.LISTED) ? true : undefined,
      owners: listingStatus.includes(ListingStatus.OWNED_BY_YOU) && wallets.length > 0 ? wallets : undefined,
      attributes: buildSquidAttributeFilters({
        price,
        gender: gender === "ALL" ? undefined : gender as string,
        generation,
        species: species as string[],
        nature: nature as string[],
        element: element as string[],
        chroma,
        totalBreeds,
        attack,
        special,
        defense,
        resistance,
        speed,
        size,
        level,
        type: stage === "ALL" ? undefined : stage as string,
        treated: treated === "TREATED" ? "true" : treated === "UNTREATED" ? "false" : undefined,
      }),
    }),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.nextPage || null,
    placeholderData: { pages: [ { items: [], total: 0, nextPage: null } ], pageParams: [] },
    staleTime: staleTimeMinutes(5),
    // enabled: owners && owners.length > 0,
  });
  const bottomRef = useInfiniteScroll({ isFetching, fetchNextPageAction: fetchNextPage, hasNextPage });
  const items = useMemo(() => {
    return data.pages.map(page => page.items).flat();
  }, [ data ]);
  return (
    <Fragment>
      <div className="@container">
        <CollectionItemsFilterBar itemCount={data.pages[0]?.total} />
        <GridView
          items={items}
          isLoading={isLoading || isPlaceholderData}
          isFetchingNextPage={isFetchingNextPage}
          bottomRef={bottomRef}
        />
      </div>
    </Fragment>
  );
};
MarketplaceAssetsPage.displayName = "MarketplaceAssetsPage";
export default MarketplaceAssetsPage;
