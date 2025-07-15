"use client";

import { Species, speciesSchema } from "@/lib/evoverses/types";
import { UrlSearchParams } from "@/lib/node/url-search-params";
import type { Allable, OmitNone, OmitUnknown, Range } from "@/types/generic";
import { getUrlAndParams, setClientSideUrl } from "@/utils/url";
import {
  type Chroma,
  chromaSchema,
  type Element,
  elementSchema,
  type Gender,
  genderSchema,
  type Nature,
  natureSchema,
} from "@workspace/database/types";
import { createContext, type PropsWithChildren, use, useCallback, useState } from "react";
import { z } from "zod";

export const sortOrderSchema = z.enum([ "PRICE_LOW_TO_HIGH", "PRICE_HIGH_TO_LOW", "RECENTLY_LISTED",
  "HIGHEST_LAST_SALE", "LOWEST_LAST_SALE", "TOP_OFFER", "RECENTLY_SOLD" ]);
export type SortOrder = z.infer<typeof sortOrderSchema>;
export const SortOrder = sortOrderSchema.enum;

export const listingStatusSchema = z.enum([ "LISTED", "OWNED_BY_YOU" ]);
export const ListingStatus = listingStatusSchema.enum;
export type ListingStatus = z.infer<typeof listingStatusSchema>

export const stageSchema = z.enum([ "EGG", "EVO" ]);
export const Stage = stageSchema.enum;
export type Stage = z.infer<typeof stageSchema>;

export const treatedStatusSchema = z.enum([ "TREATED", "UNTREATED" ]);
export const TreatedStatus = treatedStatusSchema.enum;
export type TreatedStatus = z.infer<typeof treatedStatusSchema>;

type FiltersContextType = {
  sort: z.infer<typeof sortOrderSchema>,
  handleSortChange: (v: string) => void,
  listingStatus: Allable<ListingStatus>[],
  handleListingStatusChange: (v: string) => void,
  price: Range,
  handlePriceChange: (v: Range) => void,
  stage: Allable<Stage>,
  handleStageChange: (v: string) => void,
  gender: OmitUnknown<Allable<Gender>>,
  handleGenderChange: (v: string) => void,
  generation: Range,
  handleGenerationChange: (v: Range) => void,
  species: OmitUnknown<Allable<Species>>[],
  handleSpeciesChange: (v: string) => void,
  nature: OmitUnknown<Allable<Nature>>[],
  handleNatureChange: (v: string) => void,
  element: OmitNone<Allable<Element>>[],
  handleElementChange: (v: string) => void,
  chroma: Allable<Chroma>[],
  handleChromaChange: (v: string) => void,
  totalBreeds: Range
  handleTotalBreedsChange: (v: Range) => void,
  attack: Range,
  handleAttackChange: (v: Range) => void,
  special: Range,
  handleSpecialChange: (v: Range) => void,
  defense: Range,
  handleDefenseChange: (v: Range) => void,
  resistance: Range,
  handleResistanceChange: (v: Range) => void,
  speed: Range,
  handleSpeedChange: (v: Range) => void,
  size: Range,
  handleSizeChange: (v: Range) => void,
  level: Range,
  handleLevelChange: (v: Range) => void,
  treated: Allable<TreatedStatus>,
  handleTreatedChange: (v: string) => void,
  clearAll: () => void
}

const SortFilterContext = createContext<FiltersContextType>({
  sort: SortOrder.PRICE_LOW_TO_HIGH,
  handleSortChange: () => null,
  listingStatus: [ "ALL" ],
  handleListingStatusChange: () => null,
  price: {},
  handlePriceChange: () => null,
  stage: "ALL",
  handleStageChange: () => null,
  gender: "ALL",
  handleGenderChange: () => null,
  generation: {},
  handleGenerationChange: () => null,
  species: [ "ALL" ],
  handleSpeciesChange: () => null,
  nature: [ "ALL" ],
  handleNatureChange: () => null,
  element: [ "ALL" ],
  handleElementChange: () => null,
  chroma: [ "ALL" ],
  handleChromaChange: () => null,
  totalBreeds: {},
  handleTotalBreedsChange: () => null,
  attack: {},
  handleAttackChange: () => null,
  special: {},
  handleSpecialChange: () => null,
  defense: {},
  handleDefenseChange: () => null,
  resistance: {},
  handleResistanceChange: () => null,
  speed: {},
  handleSpeedChange: () => null,
  size: {},
  handleSizeChange: () => null,
  level: {},
  handleLevelChange: () => null,
  treated: "ALL",
  handleTreatedChange: () => null,
  clearAll: () => null,
});

const useSortFilters = () => {
  const context = use(SortFilterContext);

  if (!context) {
    throw new Error("useSortFilters must be used within a <SortFilterProvider />");
  }

  return context;
};

const useRangeState = (paramBaseName: string, initialValue: Range = {}) => {
  const [ value, setValue ] = useState<Range>(initialValue);

  const handleChange = useCallback((newRange: Range) => {
    const updated = { ...value };

    if ("min" in newRange) {
      if (newRange.min === undefined) {
        delete updated.min;
      } else {
        updated.min = newRange.min;
      }
    }

    if ("max" in newRange) {
      if (newRange.max === undefined) {
        delete updated.max;
      } else {
        updated.max = newRange.max;
      }
    }

    if (JSON.stringify(updated) === JSON.stringify(value)) {
      return;
    }

    setValue(updated);

    const { url, params } = getUrlAndParams();
    const minParamName = `min${paramBaseName}`;
    const maxParamName = `max${paramBaseName}`;

    if (updated.min === undefined) {
      params.delete(minParamName);
    } else {
      params.set(minParamName, updated.min.toString());
    }

    if (updated.max === undefined) {
      params.delete(maxParamName);
    } else {
      params.set(maxParamName, updated.max.toString());
    }

    setClientSideUrl(url, params);
  }, [ value, setValue, paramBaseName ]);

  return [ value, handleChange ] as const;
};
// Generic hook for array option states
const useArrayOptionState = <T, >(paramName: string, initialValue: T[] = [ "ALL" as T ], allOptions?: T[]) => {
  const [ value, setValue ] = useState<T[]>(initialValue);

  const handleChange = useCallback((option: string) => {
    const typedOption = option as T;
    let updated: T[];

    // If "ALL" is passed, clear everything and set to ["ALL"]
    if (option === "ALL") {
      updated = [ "ALL" as T ];
    }
    // If current state is ["ALL"], start with empty array to add the option
    else if (value.length === 1 && value[0] === (
      "ALL" as T
    )) {
      updated = [ typedOption ];
    } else if (value.includes(typedOption)) {
      // Remove if already in array
      updated = value.filter(item => item !== typedOption);
      // If removing results in empty array, set to ["ALL"]
      if (updated.length === 0) {
        updated = [ "ALL" as T ];
      }
    } else {
      // Add if not in array
      updated = [ ...value, typedOption ];
    }

    // If we now have all options, set to ["ALL"] instead
    if (allOptions && updated.length === allOptions.length &&
      allOptions.every(opt => updated.includes(opt))) {
      updated = [ "ALL" as T ];
    }

    // Early return if no changes
    if (JSON.stringify(updated.sort()) === JSON.stringify(value.sort())) {
      return;
    }

    setValue(updated);

    const { url, params } = getUrlAndParams();
    params.delete(paramName);

    if (updated.length > 0 && !(
      updated.length === 1 && updated[0] === (
        "ALL" as T
      )
    )) {
      updated.forEach(item => params.append(paramName, String(item)));
    }

    setClientSideUrl(url, params);
  }, [ value, setValue, paramName, allOptions ]);

  return [ value, handleChange ] as const;
};

const useSingleOptionState = <T, >(paramName: string, initialValue: T | undefined | null, defaultValue: T) => {
  const [ value, setValue ] = useState<T>(initialValue || defaultValue);

  const handleChange = useCallback((option: string) => {
    const typedOption = option as T;
    if (typedOption === value) {
      return;
    }

    setValue(typedOption);

    const { url, params } = getUrlAndParams();

    if (typedOption === defaultValue) {
      params.delete(paramName);
    } else {
      params.set(paramName, String(typedOption));
    }

    setClientSideUrl(url, params);
  }, [ value, setValue, paramName, defaultValue ]);

  return [ value, handleChange ] as const;
};

const preProcessSearchParams = (searchParams?: Record<string, string | string[] | undefined> | string) => {
  const params = UrlSearchParams.fromDynamicRecord(searchParams);
  return {
    // Single-value params
    sort: params.get("sort"),
    stage: params.get("stage"),
    gender: params.get("gender"),
    treated: params.get("treated"),

    // Multi-value params
    ...[ "species", "nature", "element", "chroma", "status" ].reduce((o, k) => (
      { ...o, [k]: params.getAll(k) }
    ), {}),

    // paired value params
    ...[ "price", "generation", "totalBreeds", "attack", "special", "defense", "resistance", "speed", "size",
      "level" ].reduce((o, k) => (
      { ...o, [k]: params.getMinMax(k.charAt(0).toUpperCase() + k.slice(1)) }
    ), {}),
  };
};

const zAllEnum = z.enum([ "ALL" ]);
const zAll = z.array(zAllEnum).min(0).max(1).transform(v => v.length === 0 ? [ "ALL" ] : v);
const minMaxSchema = z.object({
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});
const searchParamsSchema = z.object({
  // Single-value params
  sort: sortOrderSchema.optional().default("PRICE_LOW_TO_HIGH"),

  // Multi-value params
  species: z.array(speciesSchema).min(1).or(zAll).optional().default([ "ALL" ]),
  nature: z.array(natureSchema).min(1).or(zAll).optional().default([ "ALL" ]),
  element: z.array(elementSchema).min(1).or(zAll).optional().default([ "ALL" ]),
  chroma: z.array(chromaSchema).min(1).or(zAll).optional().default([ "ALL" ]),
  stage: stageSchema.or(zAllEnum).optional().default("ALL"),
  status: z.array(listingStatusSchema).min(1).or(zAll).optional().default([ "ALL" ]),
  gender: genderSchema.or(zAllEnum).optional().default("ALL"),
  treated: treatedStatusSchema.or(zAllEnum).optional().default("ALL"),

  // paired value params
  price: minMaxSchema.optional().default({}),
  generation: minMaxSchema.optional().default({}),
  totalBreeds: minMaxSchema.optional().default({}),
  attack: minMaxSchema.optional().default({}),
  special: minMaxSchema.optional().default({}),
  defense: minMaxSchema.optional().default({}),
  resistance: minMaxSchema.optional().default({}),
  speed: minMaxSchema.optional().default({}),
  size: minMaxSchema.optional().default({}),
  level: minMaxSchema.optional().default({}),
});

const SortFilterProvider = ({
  searchParams: searchParamsString,
  children,
}: PropsWithChildren & {
  defaultChainName?: string,
  defaultQuery?: string,
  searchParams?: Record<string, string | string[]> | string,
}) => {
  console.log("searchParamsString", searchParamsString);
  const params = searchParamsSchema.parse(preProcessSearchParams(searchParamsString));
  const [ sort, handleSortChange ] = useSingleOptionState<SortOrder>("sort", params.sort, SortOrder.PRICE_LOW_TO_HIGH);
  const [ treated, handleTreatedChange ] = useSingleOptionState<Allable<TreatedStatus>>(
    "treated",
    params.treated,
    "ALL",
  );
  const [ stage, handleStageChange ] = useSingleOptionState<Allable<Stage>>("stage", params.stage, "ALL");
  const [ gender, handleGenderChange ] = useSingleOptionState<Allable<Gender>>("gender", params.gender, "ALL");
  const [ price, handlePriceChange ] = useRangeState("Price", params.price);
  const [ generation, handleGenerationChange ] = useRangeState("Generation", params.generation);
  const [ totalBreeds, handleTotalBreedsChange ] = useRangeState("TotalBreeds", params.totalBreeds);
  const [ attack, handleAttackChange ] = useRangeState("Attack", params.attack);
  const [ special, handleSpecialChange ] = useRangeState("Special", params.special);
  const [ defense, handleDefenseChange ] = useRangeState("Defense", params.defense);
  const [ resistance, handleResistanceChange ] = useRangeState("Resistance", params.resistance);
  const [ speed, handleSpeedChange ] = useRangeState("Speed", params.speed);
  const [ size, handleSizeChange ] = useRangeState("Size", params.size);
  const [ level, handleLevelChange ] = useRangeState("Level", params.level);
  const [ species, handleSpeciesChange ] = useArrayOptionState<Allable<Species>>(
    "species",
    params.species as Allable<Species>[],
    [ ...speciesSchema.options.filter(o => o !== "unknown" && o !== "unreleased") ],
  );
  const [ nature, handleNatureChange ] = useArrayOptionState<Allable<Nature>>(
    "nature",
    params.nature as Allable<Nature>[],
    natureSchema.options,
  );
  const [ element, handleElementChange ] = useArrayOptionState<Allable<Element>>(
    "element",
    params.element as Allable<Element>[],
    elementSchema.options.filter(e => e !== "none"),
  );
  const [ chroma, handleChromaChange ] = useArrayOptionState<Allable<Chroma>>(
    "chroma",
    params.chroma as Allable<Chroma>[],
    chromaSchema.options,
  );

  const [ listingStatus, handleListingStatusChange ] = useArrayOptionState<Allable<ListingStatus>>(
    "status",
    params.status as Allable<ListingStatus>[],
    [ "ALL", ...listingStatusSchema.options ],
  );

  const clearAll = useCallback(() => {
      handleTreatedChange("ALL");
      handleStageChange("ALL");
      handleGenderChange("ALL");
      handlePriceChange({});
      handleGenerationChange({});
      handleTotalBreedsChange({});
      handleAttackChange({});
      handleSpecialChange({});
      handleDefenseChange({});
      handleResistanceChange({});
      handleSpeedChange({});
      handleSizeChange({});
      handleLevelChange({});
      handleSpeciesChange("ALL");
      handleNatureChange("ALL");
      handleElementChange("ALL");
      handleChromaChange("ALL");
      handleListingStatusChange("ALL");
    },
    [ handleAttackChange, handleChromaChange, handleDefenseChange, handleElementChange, handleGenderChange,
      handleGenerationChange, handleLevelChange, handleListingStatusChange, handleNatureChange, handlePriceChange,
      handleResistanceChange, handleSizeChange, handleSpecialChange, handleSpeciesChange, handleSpeedChange,
      handleStageChange, handleTotalBreedsChange, handleTreatedChange ],
  );
  const ctx: FiltersContextType = {
    sort,
    handleSortChange,
    listingStatus,
    handleListingStatusChange,
    price,
    handlePriceChange,
    stage,
    handleStageChange,
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
    special,
    handleSpecialChange,
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
    clearAll,
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
