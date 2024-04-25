// noinspection JSUnusedGlobalSymbols

import { Address } from "abitype";

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

export const elements = [ "None", "Water", "Fire", "Air", "Plant", "Earth", "Light", "Dark", "Mineral", "Corrupt",
  "Ether", "Bug", "Monster" ] as const;
export type Element = typeof elements[number];

export const chromas = [ "None", "Chroma", "Super" ] as const;
export type Chroma = typeof chromas[number];

// Evo Species ID are mapped 1:1 to their index in this array
export const species = [ "Unknown", "Nissel", "Finantis", "Karoite", "Nuvea", "Hodeon", "Eulocelus", "Arnoriel",
  "Unreleased", "Carcoid", "Adhamandra", "Ainepolux", "Kapryno", "Kitsul", "Unreleased", "Rattuos", "Beldar",
  "Unreleased", "Unreleased", "Firemon", "Obryos", "Unreleased", "Lumi", "Unreleased", "Unreleased", "Onydae", "Skycyx",
  "Unreleased", "Droserace", "Unreleased", "Kerval", "Unreleased", "Unreleased", "Gwenbee", "Shazark", "Krokon",
  "Unreleased", "Clocarstone", "Unreleased", "Tokaleaf", "Sunopendra", "Unreleased", "Yotnar", "Hikarul", "Unreleased",
  "Aubelyon", "Flint", "Unreleased", "Venuserpien", "Unreleased", "Espyke", "Mobyd", "Unreleased", "Ghorgon", "Mellio",
  "Fugush", "Morphee", "Unreleased", "Unreleased", "Lounn", "Unreleased", "Uzumebach", "Unreleased", "Gemarites",
  "Methyst", "Unreleased", "Tamandu", "Unreleased", "Tytan", "Moffunap", "Nymphel", "Unreleased", "Unreleased",
  "Unreleased", "Unreleased", "Allacrow", "Unreleased", "Jokull", "Vulpyro", "Unreleased", "Unreleased", "Fayde",
  "Unreleased", "Ruard", "Caerthos", "Ryomizu", "Obsy", "Unreleased", "Unreleased", "Dhaek", "Unreleased", "Metheo",
  "Unreleased", "Nythe", "Unreleased", "Unreleased", "Meissa", "Fluozacil", "Unreleased", "Unreleased", "Cyarabat",
  "Unreleased", "Struthor", "Istral", "Unreleased", "Unreleased", "Cyzorak", "Unreleased", "Unreleased", "Kaos",
  "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Unreleased", "Athel",
  "Unreleased", "Unreleased", "Lamphal", "Unreleased", "Geckaiba", "Unreleased", "Unreleased", "Sauderon", "Unreleased",
  "Unreleased", "Unreleased", "Unreleased", "Unreleased" ] as const;
export type Species = typeof species[number];

export const genders = [ "Unknown", "Male", "Female" ] as const;
export type Gender = typeof genders[number];

export const rarities = [ "Unknown" ] as const;
export type Rarity = typeof rarities[number];

export const natures = [ "Unknown", "Dauntless", "Executive", "Restless", "Nervous", "Cunning", "Energetic", "Clever",
  "Confident", "Ignorant", "Arrogant", "Biting", "Aggressive", "Patient", "Mature", "Sensible", "Calm", "Rude",
  "Cautious", "Curious", "Discrete", "Loyal" ] as const;
export type Nature = typeof natures[number];

export const stats = [ "None", "Health", "Attack", "Special", "Defense", "Resistance", "Speed" ] as const;
export type Stat = typeof stats[number];

export const statAbbrevs = [ "???", "HP", "ATK", "SP", "DEF", "RES", "SPD" ] as const;
export type StatAbbrev = typeof statAbbrevs[number];

export const statToStatAbbrevMap: Record<Stat, StatAbbrev> = {
  None: "???",
  Health: "HP",
  Attack: "ATK",
  Special: "SP",
  Defense: "DEF",
  Resistance: "RES",
  Speed: "SPD",
};
