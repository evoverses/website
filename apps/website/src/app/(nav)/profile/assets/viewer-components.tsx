"use client";

import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { useRouter } from "next/navigation";
import { useState } from "react";

const options = [
  {
    value: "id",
    label: "Token ID",
  },
  {
    value: "rarity",
    label: "Rarity",
  },
  {
    value: "species",
    label: "Species",
  },
  {
    value: "gender",
    label: "Gender",
  },
  {
    value: "level",
    label: "Level",
  },
  {
    value: "stats",
    label: "Stats",
  },
];
export type SortOption = typeof options[number]["value"];
export type SortOrder = "asc" | "desc";

export const NFTSort = ({ sort, order }: { sort: SortOption, order: SortOrder }) => {
  const [ open, setOpen ] = useState(false);
  const router = useRouter();
  const onSelect = (value: string) => {
    const selected = value === sort;
    let newSort = sort;
    let newOrder: SortOrder;
    if (selected) {
      newOrder = order === "asc" ? "desc" : "asc";
    } else {
      newSort = value;
      newOrder = "desc";
    }
    const newSearchParams = new URLSearchParams({ sort: newSort, order: newOrder });
    router.replace(`/profile/assets?${newSearchParams.toString()}`);
  };

  const Arrow = order === "asc" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {options.find((option) => option.value === sort)?.label || "Token ID"}
          <Arrow className={cn("ml-auto h-4 w-4")} />
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandEmpty>Wtf?</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem key={option.value} value={option.value} onSelect={onSelect}>
                {option.label}
                <Arrow className={cn("ml-auto h-4 w-4", sort === option.value ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
