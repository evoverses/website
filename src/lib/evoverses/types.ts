import { Address } from "abitype";

export type CollectionMetadata = {
  id: number,
  address: Address,
  name: string,
  description: string,
  image: string,
  bannerImage: string,
  externalLink: string,
  collaborators: [],
  createdAt: string,
  updatedAt: string
}

export type CollectionItemEvo = {
  id: number,
  tokenId: string,
  gender: string,
  generation: number,
  nature: string,
  rarity: string,
  chroma: null,
  species: string,
  totalBreeds: number,
  lastBreedTime: string,
  createdAt: string,
  updatedAt: string,
  attack: number,
  special: number,
  defense: number,
  resistance: number,
  speed: number,
  size: number,
  xp: number,
  children: number[],
  types: { primary: string, secondary: string | null },
}

export type CollectionItemsResponse = {
  items: CollectionItemEvo[],
  total: number,
}
