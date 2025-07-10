"use client";

import { useSortFilters } from "@/components/filters/index";
import { SortOrderSelect } from "@/components/filters/sort-order-select";
import { InnerSidebarTrigger } from "@/components/inner-sidebar";
import { LayoutToggleGroup } from "@/components/layout-toggle-group";
import { useBoundedStore } from "@/store";
import type { Range } from "@/types/generic";
import { toTitleCase } from "@workspace/evoverses/utils/strings";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import { FilterIcon, SettingsIcon, TrendingUpIcon, XIcon } from "lucide-react";
import { Fragment } from "react";

const CollectionItemsFilterBar = ({ itemCount = 0, className }: { itemCount?: number, className?: string }) => {
  const view = useBoundedStore.use.layout();
  return (
    <div className={cn("sticky top-30 bg-background z-5 mb-2 pb-2 pt-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <InnerSidebarTrigger variant="outline" className="size-8 @max-6xl:hidden hover:bg-input/50 cursor-pointer">
          <FilterIcon />
        </InnerSidebarTrigger>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-4">
            <SortOrderSelect />
            <LayoutToggleGroup />
            <Button variant="outline" size="icon" className="size-8 cursor-pointer">
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
          <label htmlFor="asset-count">{itemCount.toLocaleString("en")} items</label>
        </div>
      )}
      <FilterBadges />
    </div>
  );
};
CollectionItemsFilterBar.displayName = "CollectionItemsFilterBar";

const FilterBadges = () => {
  const {
    listingStatus,
    handleListingStatusChange,
    stage,
    handleStageChange,
    price,
    handlePriceChange,
    gender,
    handleGenderChange,
    generation,
    handleGenerationChange,
    species,
    handleSpeciesChange,
    nature,
    handleNatureChange,
    element,
    handleElementChange,
    chroma,
    handleChromaChange,
    totalBreeds,
    handleTotalBreedsChange,
    attack,
    handleAttackChange,
    defense,
    handleDefenseChange,
    resistance,
    handleResistanceChange,
    speed,
    handleSpeedChange,
    size,
    handleSizeChange,
    level,
    handleLevelChange,
    treated,
    handleTreatedChange,
    special,
    handleSpecialChange,
    clearAll,
  } = useSortFilters();
  return (
    <div className="flex flex-wrap gap-1 pt-2 has-only:hidden">
      {listingStatus.map(s => (
        <FilterBadge key={`remove-${s}-button`} label="Status" value={s} onChange={handleListingStatusChange} />
      ))}
      <FilterRangeBadge label="Price" value={price} onChange={handlePriceChange} />
      <FilterBadge label="Stage" value={stage} onChange={handleStageChange} />
      <FilterBadge label="Gender" value={gender} onChange={handleGenderChange} />
      <FilterRangeBadge label="Gen" value={generation} onChange={handleGenerationChange} />
      {species.map(s => (
        <FilterBadge key={`remove-${s}-button`} label="Species" value={s} onChange={handleSpeciesChange} />
      ))}
      {nature.map(n => (
        <FilterBadge key={`remove-${n}-button`} label="Nature" value={n} onChange={handleNatureChange} />
      ))}
      {element.map(e => (
        <FilterBadge key={`remove-${e}-button`} label="Element" value={e} onChange={handleElementChange} />
      ))}
      {chroma.map(c => (
        <FilterBadge key={`remove-${c}-button`} label="Chroma" value={c} onChange={handleChromaChange} />
      ))}
      <FilterBadge value={treated} onChange={handleTreatedChange} />
      <FilterRangeBadge label="Breeds" value={totalBreeds} onChange={handleTotalBreedsChange} />
      <FilterRangeBadge label="Attack" value={attack} onChange={handleAttackChange} />
      <FilterRangeBadge label="Special" value={special} onChange={handleSpecialChange} />
      <FilterRangeBadge label="Defense" value={defense} onChange={handleDefenseChange} />
      <FilterRangeBadge label="Resistance" value={resistance} onChange={handleResistanceChange} />
      <FilterRangeBadge label="Speed" value={speed} onChange={handleSpeedChange} />
      <FilterRangeBadge label="Size" value={size} onChange={handleSizeChange} />
      <FilterRangeBadge label="Level" value={level} onChange={handleLevelChange} />
      <Badge variant="outline" className="cursor-pointer" onClick={clearAll}>
        <span>Clear All</span>
        <XIcon />
      </Badge>
    </div>
  );
};

const FilterBadge = <T, >({
  label,
  value,
  onChange,
  valid = value !== "ALL",
}: {
  label?: string
  onChange: (value: string) => void,
  value: T
  valid?: boolean
}) => {
  return valid ? (
    <Badge variant="outline" className="cursor-pointer hover:bg-input/50" onClick={() => onChange(value as string)}>
      <span>{label ? `${toTitleCase(label)}: ` : ""}{toTitleCase(value as string)}</span>
      <XIcon />
    </Badge>
  ) : null;
};

const FilterRangeBadge = ({ label, value, onChange }: {
  label: string,
  onChange: (value: Range) => void,
  value: Range
}) => {
  return (
    <Fragment>
      {value.min !== undefined && (
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-input/50"
          onClick={() => onChange({ min: undefined })}
        >
          <span>Min {toTitleCase(label)}: {value.min}</span>
          <XIcon />
        </Badge>
      )}
      {value.max !== undefined && (
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-input/50"
          onClick={() => onChange({ max: undefined })}
        >
          <span>Max {toTitleCase(label)}: {value.max}</span>
          <XIcon />
        </Badge>
      )}
    </Fragment>
  );
};
export { CollectionItemsFilterBar };
