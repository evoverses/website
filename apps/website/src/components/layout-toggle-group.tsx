"use client";
import { Layout } from "@/store/preferences";
import { useBoundedStore } from "@/store";
import { Button } from "@workspace/ui/components/button";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import { Grid2X2Icon, Grid3X3Icon, LayoutGridIcon, Rows3Icon, Rows4Icon } from "lucide-react";
import { Fragment } from "react";

const LayoutToggleGroup = ({ onLayoutChange, className }: {
  onLayoutChange?: (layout: Layout) => void;
  className?: string;
}) => {

  const value = useBoundedStore.use.layout();
  const setValue = useBoundedStore.use.setLayout();

  const setLayout = (layout: string) => {
    if (!layout) {
      return;
    }
    if (layout !== value) {
      setValue(layout as Layout);
      onLayoutChange?.(layout as Layout);
    }
  };

  const handleToggle = () => {
    const newValue = value === "grid" ? "compact-grid" : value === "compact-grid" ? "mosaic" : value === "mosaic"
      ? "table"
      : value === "table" ? "compact-table" : "grid";
    setValue(newValue as Layout);
    onLayoutChange?.(newValue as Layout);
  };
  return (
    <Fragment>
      <ToggleGroup
        value={value}
        type="single"
        variant="outline"
        onValueChange={setLayout}
        className={cn("hidden @4xl:flex", className)}
      >
        <ToggleGroupItem value="grid" className="size-8 data-[state=on]:text-primary">
          <LayoutGridIcon className="size-5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="compact-grid" className="size-8 data-[state=on]:text-primary">
          <Grid3X3Icon className="size-5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="mosaic" className="size-8 data-[state=on]:text-primary">
          <Grid2X2Icon className="size-5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" className="size-8  data-[state=on]:text-primary">
          <Rows3Icon className="size-5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="compact-table" className="size-8 data-[state=on]:text-primary">
          <Rows4Icon className="size-5" />
        </ToggleGroupItem>
      </ToggleGroup>
      <Button variant="outline" size="icon" className="size-8 @4xl:hidden" onClick={handleToggle}>
        {value === "grid" ? (
          <LayoutGridIcon className="size-5" />
        ) : value === "compact-grid" ? (
          <Grid3X3Icon className="size-5" />
        ) : value === "mosaic" ? (
          <Grid2X2Icon className="size-5" />
        ) : value === "table" ? (
          <Rows3Icon className="size-5" />
        ) : (
          <Rows4Icon className="size-5" />
        )}
      </Button>
    </Fragment>

  );
};
LayoutToggleGroup.displayName = "LayoutToggleGroup";

export { LayoutToggleGroup };
