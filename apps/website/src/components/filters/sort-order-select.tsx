"use client";
import { useSortFilters } from "@/components/filters/index";
import { toTitleCase } from "@/utils/strings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";

const useSortOrder = () => {
  const { sort, handleSortChange } = useSortFilters();
  return {
    sort,
    handleSortChange,
  };
};

const SortOrderSelect = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Select>, "value" | "onValueChange"> & { className?: string }) => {
  const { sort, handleSortChange } = useSortOrder();
  return (
    <Select value={sort} onValueChange={handleSortChange} {...props}>
      <SelectTrigger className={cn("w-fit h-8! gap-2", className)}>
        <SelectValue>
          <span className="block text-nowrap">{toTitleCase(sort.replace(/[-_]/g, " "))}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PRICE_LOW_TO_HIGH">Price Low to High</SelectItem>
        <SelectItem value="PRICE_HIGH_TO_LOW">Price High to Low</SelectItem>
        <SelectItem value="RECENTLY_LISTED">Recently Listed</SelectItem>
        <SelectItem value="HIGHEST_LAST_SALE">Highest Last Sale</SelectItem>
        <SelectItem value="LOWEST_LAST_SALE">Lowest Last Sale</SelectItem>
        <SelectItem value="TOP_OFFER">Top Offer</SelectItem>
        <SelectItem value="RECENTLY_SOLD">Recently Sold</SelectItem>
      </SelectContent>
    </Select>
  );
};
SortOrderSelect.displayName = "SortOrderSelect";
export { SortOrderSelect };
