// noinspection JSUnusedGlobalSymbols

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

export const elementSchema = z.enum([ "None", "Water", "Fire", "Air", "Plant", "Earth", "Light", "Dark", "Mineral",
  "Corrupt", "Ether", "Bug", "Monster" ]);
export const elements = elementSchema.options;
export const Element = elementSchema.enum;
export type Element = z.infer<typeof elementSchema>;

export const chromaSchema = z.enum([ "None", "Chroma", "Super" ]);
export const chromas = chromaSchema.options;
export const Chroma = chromaSchema.enum;
export type Chroma = z.infer<typeof chromaSchema>;

// Evo Species ID are mapped 1:1 to their index in this array
export const speciesSchema = z.enum([ "Unknown", "Nissel", "Finantis", "Karoite", "Nuvea", "Hodeon", "Eulocelus",
  "Arnoriel", "Unreleased", "Carcoid", "Adhamandra", "Ainepolux", "Kapryno", "Kitsul", "Unreleased", "Rattuos",
  "Beldar", "Unreleased", "Unreleased", "Firemon", "Obryos", "Unreleased", "Lumi", "Unreleased", "Unreleased", "Onydae",
  "Skycyx", "Unreleased", "Droserace", "Unreleased", "Kerval", "Unreleased", "Unreleased", "Gwenbee", "Shazark",
  "Krokon", "Unreleased", "Clocarstone", "Unreleased", "Tokaleaf", "Sunopendra", "Unreleased", "Yotnar", "Hikarul",
  "Unreleased", "Aubelyon", "Flint", "Unreleased", "Venuserpien", "Unreleased", "Espyke", "Mobyd", "Unreleased",
  "Ghorgon", "Mellio", "Fugush", "Morphee", "Unreleased", "Unreleased", "Lounn", "Unreleased", "Uzumebach",
  "Unreleased", "Gemarites", "Methyst", "Unreleased", "Tamandu", "Unreleased", "Tytan", "Moffunap", "Nymphel",
  "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Allacrow", "Unreleased", "Jokull", "Vulpyro", "Unreleased",
  "Unreleased", "Fayde", "Unreleased", "Ruard", "Caerthos", "Ryomizu", "Obsy", "Unreleased", "Unreleased", "Dhaek",
  "Unreleased", "Metheo", "Unreleased", "Nythe", "Unreleased", "Unreleased", "Meissa", "Fluozacil", "Unreleased",
  "Unreleased", "Cyarabat", "Unreleased", "Struthor", "Istral", "Unreleased", "Unreleased", "Cyzorak", "Unreleased",
  "Unreleased", "Kaos", "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Unreleased",
  "Unreleased", "Athel", "Unreleased", "Unreleased", "Lamphal", "Unreleased", "Geckaiba", "Unreleased", "Unreleased",
  "Sauderon", "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Unreleased" ]);
export const species = speciesSchema.options;
export const Species = speciesSchema.enum;
export type Species = z.infer<typeof speciesSchema>;

export const genderSchema = z.enum([ "Unknown", "Male", "Female" ]);
export const genders = genderSchema.options;
export const Gender = genderSchema.enum;
export type Gender = z.infer<typeof genderSchema>;

export const raritySchema = z.enum([ "Unknown" ]);
export const rarities = raritySchema.options;
export const Rarity = typeof raritySchema.enum;
export type Rarity = z.infer<typeof raritySchema>;

export const natureSchema = z.enum([ "Unknown", "Dauntless", "Executive", "Restless", "Nervous", "Cunning", "Energetic",
  "Clever", "Confident", "Ignorant", "Arrogant", "Biting", "Aggressive", "Patient", "Mature", "Sensible", "Calm",
  "Rude", "Cautious", "Curious", "Discrete", "Loyal" ]);
export const natures = natureSchema.options;
export const Nature = natureSchema.enum;
export type Nature = z.infer<typeof natureSchema>;

export const statNameSchema = z.enum([ "None", "Health", "Attack", "Special", "Defense", "Resistance", "Speed" ]);
export const statNames = statNameSchema.options;
export const StatName = statNameSchema.enum;
export type StatName = z.infer<typeof statNameSchema>;

export const statNameAbbreviationSchema = z.enum([ "???", "HP", "ATK", "SP", "DEF", "RES", "SPD" ]);
export const statNameAbbreviations = statNameAbbreviationSchema.options;
export const StatNameAbbreviation = statNameAbbreviationSchema.enum;
export type StatNameAbbreviation = z.infer<typeof statNameAbbreviationSchema>;

export const statToAbbrevSchema = statNameSchema.transform((stat): StatNameAbbreviation => {
  switch (stat) {
    case StatName.Health:
      return StatNameAbbreviation.HP;
    case StatName.Attack:
      return StatNameAbbreviation.ATK;
    case StatName.Special:
      return StatNameAbbreviation.SP;
    case StatName.Defense:
      return StatNameAbbreviation.DEF;
    case StatName.Resistance:
      return StatNameAbbreviation.RES;
    case StatName.Speed:
      return StatNameAbbreviation.SPD;
    default:
      return "???";
  }
});

export const statValueSchema = z.coerce.number().int().min(0).max(50);
