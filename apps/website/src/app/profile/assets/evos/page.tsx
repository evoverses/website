"use client";
import { CollectionItemsFilterBar } from "@/app/profile/assets/evos/filter-bar";
import { useSortFilters } from "@/components/filters";
import { GridView } from "@/components/views/grid-view";
import { useConnectedWalletAddresses } from "@/hooks/use-connected-wallets";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { fetchSquidAssets } from "@/lib/evo/fetch";
import type { SquidAsset } from "@/lib/squid/types";
import { staleTimeMinutes } from "@/utils/numbers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";

const ProfileEvoAssetsPage = () => {

  const owners = useConnectedWalletAddresses();
  const { sort, listingStatus } = useSortFilters();
  const {
    data = { pages: [ { items: [], total: 0, nextPage: null } ], pageParams: [] },
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [ "collection-evos", sort, ...owners ],
    queryFn: ({ pageParam }: { pageParam?: number }) => fetchSquidAssets({
      page: pageParam || undefined,
      sort: sort || undefined,
      listed: listingStatus.includes("LISTED") ? true : undefined,
      owners,
    }),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.nextPage || null,
    placeholderData: { pages: [ { items: [], total: 0, nextPage: null } ], pageParams: [] },
    staleTime: staleTimeMinutes(5),
    enabled: owners && owners.length > 0,
  });
  console.log(data.pages[0]?.items[0]?.tokenId);
  const bottomRef = useInfiniteScroll({ isFetching, fetchNextPageAction: fetchNextPage, hasNextPage });
  const items = useMemo(() => {
    const itms: SquidAsset[] = [];
    for (const page of data.pages) {
      for (const item of page.items) {
        itms.push(item);
      }
    }
    return itms;
  }, [ data ]);
  console.log(items);
  return (
    <Fragment>
      <CollectionItemsFilterBar itemCount={data.pages[0]?.total} />
      <GridView
        items={items}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        bottomRef={bottomRef}
      />
    </Fragment>

  );
};

export default ProfileEvoAssetsPage;
