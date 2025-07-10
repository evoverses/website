// noinspection JSUnusedGlobalSymbols

import type { Chroma, Element, Nature, Rarity, Gender } from "@workspace/database/types";
import { Address } from "thirdweb";
import { z } from "zod";

export type CollectionMetadata = {
  id: number
  address: Address
  name: string
  description: string
  image: string
  bannerImage: string
  externalLink: string
  collaborators: []
  createdAt: string
  updatedAt: string
}

export type RawEvo = {
  id: number
  tokenId: string
  gender: Gender
  generation: number
  nature: Nature
  rarity: Rarity
  chroma: Chroma | null
  species: Species
  totalBreeds: number
  lastBreedTime: string
  createdAt: string
  updatedAt: string
  attack: number
  special: number
  defense: number
  resistance: number
  speed: number
  size: number
  xp: number
  children: number[]
  types: { primary: Element, secondary: Element | null }
}

export type RawEvoEgg = {
  id: number
  tokenId: string
  species: Species
  generation: number
  createdAt: string
  updatedAt: string
  hatchedAt: string | null
  treated: boolean
  parents: { tokenId: string }[]
  types: { primary: Element, secondary: Element | null }
}

export type RawTrainer = {
  id: number
  tokenId: string
  name: string
  createdAt: string
  updatedAt: string
}

type CollectionResponseBase = {
  total: number
}

export type CollectionResponse<TCollectionType = RawEvo> = CollectionResponseBase & {
  items: TCollectionType[]
}
export type EvoCollectionResponse = CollectionResponseBase & {
  items: RawEvo[]
}

export type EvoEggCollectionResponse = CollectionResponseBase & {
  items: RawEvoEgg[]
}

export type TrainerCollectionResponse = CollectionResponseBase & {
  items: RawTrainer[]
}

// Evo Species ID are mapped 1:1 to their index in this array
export const speciesSchema = z.enum([ "unknown", "nissel", "finantis", "karoite", "nuvea", "hodeon", "eulocelus",
  "arnoriel", "unreleased", "carcoid", "adhamandra", "ainepolux", "kapryno", "kitsul", "unreleased", "rattuos",
  "beldar", "unreleased", "unreleased", "firemon", "obryos", "unreleased", "lumi", "unreleased", "unreleased", "onydae",
  "skycyx", "unreleased", "droserace", "unreleased", "kerval", "unreleased", "unreleased", "gwenbee", "shazark",
  "krokon", "unreleased", "clocarstone", "unreleased", "tokaleaf", "sunopendra", "unreleased", "yotnar", "hikarul",
  "unreleased", "aubelyon", "flint", "unreleased", "venuserpien", "unreleased", "espyke", "mobyd", "unreleased",
  "ghorgon", "mellio", "fugush", "morphee", "unreleased", "unreleased", "lounn", "unreleased", "uzumebach",
  "unreleased", "gemarites", "methyst", "unreleased", "tamandu", "unreleased", "tytan", "moffunap", "nymphel",
  "unreleased", "unreleased", "unreleased", "unreleased", "allacrow", "unreleased", "jokull", "vulpyro", "unreleased",
  "unreleased", "fayde", "unreleased", "ruard", "caerthos", "ryomizu", "obsy", "unreleased", "unreleased", "dhaek",
  "unreleased", "metheo", "unreleased", "nythe", "unreleased", "unreleased", "meissa", "fluozacil", "unreleased",
  "unreleased", "cyarabat", "unreleased", "struthor", "istral", "unreleased", "unreleased", "cyzorak", "unreleased",
  "unreleased", "kaos", "unreleased", "unreleased", "unreleased", "unreleased", "unreleased", "unreleased",
  "unreleased", "athel", "unreleased", "unreleased", "lamphal", "unreleased", "geckaiba", "unreleased", "unreleased",
  "sauderon", "unreleased", "unreleased", "unreleased", "unreleased", "unreleased" ]);
export const species = speciesSchema.options;
export const Species = speciesSchema.enum;
export type Species = z.infer<typeof speciesSchema>;

export const statNameSchema = z.enum([ "none", "health", "attack", "special", "defense", "resistance", "speed" ]);
export const statNames = statNameSchema.options;
export const StatName = statNameSchema.enum;
export type StatName = z.infer<typeof statNameSchema>;

export const statNameAbbreviationSchema = z.enum([ "???", "hp", "atk", "sp", "def", "res", "spd" ]);
export const statNameAbbreviations = statNameAbbreviationSchema.options;
export const StatNameAbbreviation = statNameAbbreviationSchema.enum;
export type StatNameAbbreviation = z.infer<typeof statNameAbbreviationSchema>;

export const statToAbbrevSchema = statNameSchema.transform((stat): StatNameAbbreviation => {
  switch (stat) {
    case StatName.health:
      return StatNameAbbreviation.hp;
    case StatName.attack:
      return StatNameAbbreviation.atk;
    case StatName.special:
      return StatNameAbbreviation.sp;
    case StatName.defense:
      return StatNameAbbreviation.def;
    case StatName.resistance:
      return StatNameAbbreviation.res;
    case StatName.speed:
      return StatNameAbbreviation.spd;
    default:
      return "???";
  }
});

export const statValueSchema = z.coerce.number().int().min(0).max(50);
