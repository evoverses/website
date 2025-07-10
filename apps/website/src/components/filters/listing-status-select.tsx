import { useSortFilters } from "@/components/filters/index";
import { toTitleCase } from "@/utils/strings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";

const useListingStatusFilter = () => {
  const { listingStatus, handleListingStatusChange } = useSortFilters();
  return {
    listingStatus,
    handleListingStatusChange,
  };
};
const SelectListingStatus = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Select>, "value" | "onValueChange"> & { className?: string }) => {
  const { listingStatus, handleListingStatusChange } = useListingStatusFilter();
  const status = listingStatus[0] || "ALL";
  return (
    <Select value={status} onValueChange={handleListingStatusChange} {...props}>
      <SelectTrigger className={cn("w-fit h-8 gap-2 whitespace-nowrap", className)}>
        <SelectValue>
          {listingStatus.includes("ALL") ? "Status" : toTitleCase(listingStatus[0]!.replace("-", " "))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="listed">Listed</SelectItem>
        <SelectItem value="not-listed">Not Listed</SelectItem>
      </SelectContent>
    </Select>
  );
};

SelectListingStatus.displayName = "SelectListingStatus";
export { SelectListingStatus };
