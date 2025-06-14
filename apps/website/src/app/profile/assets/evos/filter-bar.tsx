"use client";

import { SortOrderSelect } from "@/components/filters/sort-order-select";
import { LayoutToggleGroup } from "@/components/layout-toggle-group";
import { useBoundedStore } from "@/store";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import { FilterIcon, SettingsIcon, TrendingUpIcon } from "lucide-react";

const CollectionItemsFilterBar = ({ itemCount = 0, className }: { itemCount?: number, className?: string }) => {
  const view = useBoundedStore.use.layout();
  return (
    <div className={cn("sticky bg-background z-5 mb-2 pb-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" className="size-8 @max-6xl:hidden">
          <FilterIcon />
        </Button>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-4">
            <SortOrderSelect />
            <LayoutToggleGroup />
            <Button variant="outline" size="icon" className="size-8">
              <SettingsIcon />
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <TrendingUpIcon />
              <span className="hidden @4xl:block">Insights</span>
            </Button>
          </div>
        </div>
      </div>
      {view === "table" || view === "compact-table" ? null : (
        <div className="flex items-center gap-2 font-mono text-muted-foreground text-sm pt-4">
          <Checkbox id="asset-count" />
          <label htmlFor="asset-count">{itemCount.toLocaleString("en")} items
          </label>
        </div>
      )}
    </div>
  );
};
CollectionItemsFilterBar.displayName = "CollectionItemsFilterBar";

export { CollectionItemsFilterBar };
