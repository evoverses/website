"use client";

import { getUrlAndParams, setClientSideUrl } from "@/utils/url";
import { ReadonlyURLSearchParams } from "next/navigation";
import { createContext, type PropsWithChildren, use, useCallback, useState } from "react";
import { z } from "zod";

export const sortOrderSchema = z.enum([ "PRICE_LOW_TO_HIGH", "PRICE_HIGH_TO_LOW", "RECENTLY_LISTED",
  "HIGHEST_LAST_SALE", "LOWEST_LAST_SALE", "TOP_OFFER", "RECENTLY_SOLD" ]);
export type SortOrder = z.infer<typeof sortOrderSchema>;
export const SortOrder = sortOrderSchema.enum;

type ListingStatus = "ALL" | "LISTED" | "OWNED_BY_YOU"
type FiltersContextType = {
  sort: z.infer<typeof sortOrderSchema>,
  handleSortChange: (v: string) => void,
  listingStatus: ListingStatus[],
  handleListingStatusChange: (v: string[]) => void,
}

const SortFilterContext = createContext<FiltersContextType>({
  sort: SortOrder.PRICE_LOW_TO_HIGH,
  handleSortChange: () => null,
  listingStatus: [ "ALL" ],
  handleListingStatusChange: () => null,
});

const useSortFilters = () => {
  const context = use(SortFilterContext);

  if (!context) {
    throw new Error("useSortFilters must be used within a <SortFilterProvider />");
  }

  return context;
};

const SortFilterProvider = ({
  defaultSort = SortOrder.PRICE_LOW_TO_HIGH,
  defaultListingStatus = [ "ALL" ],
  searchParams: searchParamsString,
  children,
}: PropsWithChildren & {
  defaultSort?: string,
  defaultChainName?: string,
  defaultListingStatus?: FiltersContextType["listingStatus"],
  defaultQuery?: string,
  searchParams?: string,
}) => {
  const searchParams = new ReadonlyURLSearchParams(searchParamsString);
  const [ sort, setSortInternal ] = useState<SortOrder>(searchParams.get("sort") as SortOrder || defaultSort);
  const [ listingStatus, setListingStatusInternal ] = useState<ListingStatus[]>(searchParams.getAll("status").length > 0
    ? searchParams.getAll("status") as ListingStatus[]
    : defaultListingStatus);

  const handleSortChange = useCallback((newSort: string) => {
    if (newSort === sort) {
      return;
    }
    setSortInternal(newSort as SortOrder);
    const { url, params } = getUrlAndParams();
    if (newSort === defaultSort) {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    setClientSideUrl(url, params);
  }, [ sort, setSortInternal, defaultSort ]);

  const handleListingStatusChange = useCallback((statuses: string[]) => {
    let status: ListingStatus[] = statuses.length === 0 ? [ "ALL" ] : statuses as ListingStatus[];
    if (status.length > 1) {
      if (!listingStatus.includes("ALL") && status.includes("ALL")) {
        status = [ "ALL" ];
      } else if (listingStatus.includes("ALL") && status.includes("ALL")) {
        status = status.filter(s => s !== "ALL");
      }
    }

    if (status.sort() === listingStatus) {
      return;
    }
    setListingStatusInternal(status);
    const { url, params } = getUrlAndParams();
    params.delete("status");
    if (JSON.stringify(status) !== JSON.stringify(defaultListingStatus)) {
      console.log("STATUS:", status, defaultListingStatus, status !== defaultListingStatus);
      status.map(s => params.append("status", s));
    }
    setClientSideUrl(url, params);
  }, [ listingStatus, setListingStatusInternal, defaultListingStatus ]);

  const ctx: FiltersContextType = {
    sort,
    handleSortChange,
    listingStatus,
    handleListingStatusChange,
  };

  return (
    <SortFilterContext.Provider value={ctx}>
      {children}
    </SortFilterContext.Provider>
  );
};

export {
  SortFilterProvider,
  useSortFilters,
};
