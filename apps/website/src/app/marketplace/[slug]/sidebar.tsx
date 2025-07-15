"use client";
import { listingStatusSchema, stageSchema, treatedStatusSchema, useSortFilters } from "@/components/filters";
import { InnerSidebar } from "@/components/inner-sidebar";
import { Species, speciesSchema } from "@/lib/evoverses/types";
import type { Range } from "@/types/generic";
import { filterAll } from "@/utils/strings";
import { chromas, Element, elements, Gender, Nature, natures } from "@workspace/database/types";
import { ElementIcon } from "@workspace/evoverses/components/icons/element-icon";
import { GenderIcon } from "@workspace/evoverses/components/icons/gender-icon";
import { toTitleCase } from "@workspace/evoverses/utils/strings";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

import {
  Sidebar,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { type ChangeEvent, type ComponentProps, JSX, type SVGProps, useMemo } from "react";

type Icon<T = unknown> = (props: SVGProps<SVGSVGElement> & { value: T }) => JSX.Element | null;

type NavSelect = {
  title: string;
  type: "select";
  asToggle?: boolean;
  options: string[];
  value: string[];
  onChange: (value: string) => void;
  icon?: Icon;
}
type NavRange = {
  title: string;
  type: "range";
  min: number;
  max: number;
  value: Range
  onChange: (value: Range) => void;
}

type NavToggle = {
  title: string;
  type: "toggle";
  options: string[];
  value: string;
  onChange: (value: string) => void;
  icon?: Icon;
}

type NavSeparator = {
  type: "separator";
}

type NavItem = NavSelect | NavRange | NavToggle | NavSeparator;

// This is sample data.

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
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
  } = useSortFilters();
  const data: NavItem[] = useMemo(
    () => {
      return [
        {
          title: "Status",
          type: "select",
          asToggle: true,
          options: [ "ALL", ...listingStatusSchema.options ],
          value: listingStatus,
          onChange: handleListingStatusChange,
        },
        { title: "Price", type: "range", min: 0, max: 100, value: price, onChange: handlePriceChange },
        { type: "separator" },
        {
          title: "Stage",
          type: "toggle",
          options: [ "ALL", ...stageSchema.options ],
          value: stage,
          onChange: handleStageChange,
        },
        {
          title: "Gender",
          type: "toggle",
          options: [ "ALL", Gender.male, Gender.female ],
          icon: GenderIcon as Icon,
          value: gender as string,
          onChange: handleGenderChange,
        },
        { title: "Generation", type: "range", min: 0, max: 100, value: generation, onChange: handleGenerationChange },
        {
          title: "Species",
          type: "select",
          options: [ "ALL" ].concat([ ...speciesSchema.options as string[] ].filter(s => ![ "unknown",
            "unreleased" ].includes(s)).sort((a, b) => a.localeCompare(b))),
          value: species as string[],
          onChange: handleSpeciesChange,
        },
        {
          title: "Nature",
          type: "select",
          options: [ "ALL" ].concat(natures.filter(n => n !== Nature.unknown).sort((a, b) => a.localeCompare(b))),
          value: nature as string[],
          onChange: handleNatureChange,
        },
        {
          title: "Element",
          type: "select",
          options: [ "ALL" ].concat(elements.filter(e => e !== Element.none).sort((a, b) => a.localeCompare(b))),
          icon: ElementIcon as Icon,
          value: element as string[],
          onChange: handleElementChange,
        },
        {
          title: "Chroma",
          type: "select",
          options: [ "ALL", ...chromas ],
          value: chroma,
          onChange: handleChromaChange,
        },
        {
          title: "Treated",
          type: "toggle",
          options: [ "ALL", ...treatedStatusSchema.options ],
          value: treated,
          onChange: handleTreatedChange,
        },
        {
          title: "Total Breeds",
          type: "range",
          min: 0,
          max: 100,
          value: totalBreeds,
          onChange: handleTotalBreedsChange,
        },
        { title: "Attack", type: "range", min: 0, max: 50, value: attack, onChange: handleAttackChange },
        { title: "Special", type: "range", min: 0, max: 50, value: special, onChange: handleSpecialChange },
        { title: "Defense", type: "range", min: 0, max: 50, value: defense, onChange: handleDefenseChange },
        { title: "Resistance", type: "range", min: 0, max: 50, value: resistance, onChange: handleResistanceChange },
        { title: "Speed", type: "range", min: 0, max: 50, value: speed, onChange: handleSpeedChange },
        { title: "Size", type: "range", min: -100, max: 100, value: size, onChange: handleSizeChange },
        { title: "Level", type: "range", min: 1, max: 100, value: level, onChange: handleLevelChange },
      ];
    },
    [ attack, chroma, defense, element, gender, generation, handleAttackChange, handleChromaChange, handleDefenseChange,
      handleElementChange, handleGenderChange, handleGenerationChange, handleLevelChange, handleListingStatusChange,
      handleNatureChange, handlePriceChange, handleResistanceChange, handleSizeChange, handleSpecialChange,
      handleSpeciesChange, handleSpeedChange, handleStageChange, handleTotalBreedsChange, handleTreatedChange, level,
      listingStatus, nature, price, resistance, size, special, species, speed, stage, totalBreeds, treated ],
  );

  return (
    <InnerSidebar  {...props}>
      <div className="flex flex-col">
        <SidebarGroup className="p-0">
          <SidebarMenu>
            {data.map((item, index) => {
              if (item.type === "separator") {
                return <SidebarSeparator key={index} />;
              }
              const isSelect = item.type === "select";
              const isToggle = item.type === "toggle" || (isSelect && item.asToggle);
              const isRange = item.type === "range";
              const isAll = (isSelect && item.value[0] === "ALL" || isToggle && item.value === "ALL");
              const nonAllOptions = isSelect ? item.options.filter(filterAll) : [];
              return (
                <Collapsible
                  key={item.title}
                  className="group/collapsible"
                  defaultOpen={(isSelect && !isAll) ||
                    (item.type === "range" && (item.value.min !== undefined || item.value.max !== undefined)) ||
                    index === 0}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        noHook
                        className="justify-between text-muted-foreground group-data-[state=open]/collapsible:text-foreground"
                      >
                        <span
                          className={cn({
                            "text-primary": (isSelect &&
                              item.value.filter(filterAll).length >
                              0 ||
                              (isToggle && !isAll)),
                          })}
                        >{item.title}</span>
                        <div className="flex gap-2 items-center">
                          {isSelect && !isToggle && (
                            <span>
                              {!isAll && `${item.value.length}/`}
                              {nonAllOptions.length}
                            </span>
                          )}
                          <ChevronDownIcon className="ml-auto group-data-[state=open]/collapsible:hidden" />
                          <ChevronUpIcon className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 py-1">
                      {isRange
                        ? <RangeContent item={item} />
                        : isToggle
                          ? <ToggleContent item={item} />
                          : isSelect
                            ? <SelectContent item={item} />
                            : null}
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </InnerSidebar>
  );
}

const RangeContent = ({ item: { min, max, value, onChange } }: { item: NavRange }) => {
  const formatValue = ({ target: { value: v } }: ChangeEvent<HTMLInputElement>) => v === "" ? undefined : Number(v);
  return (
    <div className="flex gap-3 items-center">
      <Input
        type="number"
        placeholder="Min"
        min={min}
        max={max}
        value={value.min ?? ""}
        onChange={e => onChange({ min: formatValue(e) })}
      />
      <span>to</span>
      <Input
        type="number"
        placeholder="Max"
        min={min}
        max={max}
        value={value.max ?? ""}
        onChange={e => onChange({ max: formatValue(e) })}
      />
    </div>
  );
};

const SelectContent = ({ item: { title, options, value, onChange, icon: Icon } }: { item: NavSelect }) => {
  return (
    <ScrollArea className="h-24">
      {options.map((o) => (
        <div
          key={`${title}-${o}`}
          className="flex gap-2 py-1 cursor-pointer hover:bg-input/50"
          onClick={() => onChange(o)}
        >
          <Checkbox checked={value.includes(o)} />
          <Label className="text-muted-foreground peer-data-[state=checked]:text-foreground cursor-pointer">
            {Icon && <Icon value={o} className="size-4" />}
            {toTitleCase(o)}
          </Label>
        </div>
      ))}
    </ScrollArea>
  );
};

const ToggleContent = ({ item: { title, options, value, onChange, icon: Icon } }: { item: NavToggle | NavSelect }) => {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <Badge
          key={`${title}-${o}`}
          variant={(Array.isArray(value) ? value.includes(o) : value === o) ? "default" : "outline"}
          className="cursor-pointer select-none rounded-sm"
          onClick={() => onChange(o)}
        >
          {Icon && <Icon value={o} />}
          {toTitleCase(o)}
        </Badge>
      ))}
    </div>
  );
};
