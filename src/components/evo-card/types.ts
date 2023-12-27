import { CSSProperties } from "react";

export enum Type {
  None,
  Water,
  Fire,
  Air,
  Plant,
  Earth,
  Light,
  Dark,
  Mineral,
  Corrupt,
  Ether,
  Bug,
  Monster
}

export namespace Type {
  export const toString = (type: Type) => Type[type];
  export const toID = (type: string) => (Type as any)[type];
}

export enum Chroma {
  None,
  Chroma,
  Super
}

export namespace Chroma {
  export const toString = (chroma: Chroma) => Chroma[chroma];
  export const toID = (chroma: string) => (
    Chroma as any
  )[chroma];
}

export interface IGenItem {
  multiplier?: number,
  genName: string,
  genValue: number,
  style?: CSSProperties
}


export enum Species {
  Unknown,
  Nissel,
  Finantis,
  Karoite,
  Nuvea,
  Hodeon,
  Eulocelus,
  Arnoriel,
  Raptoriel,
  Carcoid,
  Adhamandra,
  Ainepolux,
  Kapryno,
  Kitsul,
  Kitsumbra,
  Rattuos,
  Beldar,
  Belpillar,
  Beldarion,
  Firemon,
  Obryos,
  Mosuo,
  Lumi,
  Glaumer,
  Zhilumian,
  Onydae,
  Skycyx,
  Cinyx,
  Droserace,
  Hydraserace,
  Kerval,
  Kervalio,
  Megakeras,
  Gwenbee,
  Shazark,
  Krokon,
  Kradarkus,
  Clocarstone,
  Qwarzil,
  Tokaleaf,
  Sunopendra,
  Pendraminax,
  Yotnar,
  Hikarul,
  Opal,
  Aubelyon,
  Flint,
  Kraker,
  Venuserpien,
  Drakava,
  Espyke,
  Mobyd,
  Orcabyd,
  Ghorgon,
  Mellio,
  Fugush,
  Morphee,
  Morphian,
  Morphoon,
  Lounn,
  Lumiann,
  Uzumebach,
  Zumestra,
  Gemarites,
  Methyst,
  Spectross,
  Tamandu,
  Kanitro,
  Tytan,
  Moffunap,
  Nymphel,
  Buzzel,
  Jarel,
  Lumel,
  Vultrel,
  Allacrow,
  Corvalloy,
  Jokull,
  Vulpyro,
  Vulcario,
  Vulkran,
  Fayde,
  Kasscade,
  Ruard,
  Caerthos,
  Ryomizu,
  Obsy,
  Ceflora,
  Carnivyan,
  Dhaek,
  Drapex,
  Metheo,
  Glazzyx,
  Nythe,
  Nyferr,
  Wargrim,
  Meissa,
  Fluozacil,
  Zacirel,
  Vramakan,
  Cyarabat,
  Darkali,
  Struthor,
  Istral,
  Magistral,
  Norax,
  Cyzorak,
  Rhinurak,
  Trizorak,
  Kaos,
  Bird01,
  Bird02,
  Fish1geo,
  Fish2geo,
  Cephlare,
  Cephalopot,
  Krakenoa,
  Athel,
  Athidel,
  Athalasia,
  Lamphal,
  Lamphanuar,
  Geckaiba,
  Draxill,
  Kyrun,
  Sauderon,
  Ayacinth,
  Zhytrous,
  CuerpoHeraldo,
  Pikrel,
  Puffel
}

export const Season1Species = [
  Species.Unknown,
  Species.Raptoriel,
  Species.Kitsumbra,
  Species.Belpillar,
  Species.Beldarion,
  Species.Mosuo,
  Species.Glaumer,
  Species.Zhilumian,
  Species.Cinyx,
  Species.Hydraserace,
  Species.Kervalio,
  Species.Megakeras,
  Species.Kradarkus,
  Species.Qwarzil,
  Species.Opal,
  Species.Pendraminax,
  Species.Kraker,
  Species.Drakava,
  Species.Orcabyd,
  Species.Morphian,
  Species.Morphoon,
  Species.Lumiann,
  Species.Zumestra,
  Species.Spectross,
  Species.Kanitro,
  Species.Buzzel,
  Species.Jarel,
  Species.Lumel,
  Species.Vultrel,
  Species.Corvalloy,
  Species.Vulcario,
  Species.Vulkran,
  Species.Kasscade,
  Species.Ceflora,
  Species.Carnivyan,
  Species.Drapex,
  Species.Glazzyx,
  Species.Nyferr,
  Species.Wargrim,
  Species.Zacirel,
  Species.Vramakan,
  Species.Darkali,
  Species.Magistral,
  Species.Norax,
  Species.Rhinurak,
  Species.Trizorak,
  Species.Bird01,
  Species.Bird02,
  Species.Fish1geo,
  Species.Fish2geo,
  Species.Cephlare,
  Species.Cephalopot,
  Species.Krakenoa,
  Species.Athidel,
  Species.Athalasia,
  Species.Lamphanuar,
  Species.Draxill,
  Species.Kyrun,
  Species.Ayacinth,
  Species.Zhytrous,
  Species.CuerpoHeraldo,
  Species.Pikrel,
  Species.Puffel,
]

export namespace Species {
  export const toString = (species: Species) => Species[species];
  export const toID = (species: string) => (Species as any)[species];
  export const isSeason0 = (species: Species) => !Season1Species.includes(species);
}

export enum Gender {
  Male,
  Female
}

export namespace Gender {
  export const toString = (gender: Gender) => Gender[gender];
  export const toID = (gender: string) => (Gender as any)[gender];
}

export enum Nature {
  Dauntless,
  Executive,
  Restless,
  Nervous,
  Cunning,
  Energetic,
  Clever,
  Confident,
  Ignorant,
  Arrogant,
  Biting,
  Aggressive,
  Patient,
  Mature,
  Sensible,
  Calm,
  Rude,
  Cautious,
  Curious,
  Discrete,
  Loyal,
}

export namespace Nature {
  export const toString = (nature: Nature) => Nature[nature];
  export const toID = (nature: string) => (Nature as any)[nature];
}

export enum Move {
  None
}

export namespace Move {
  export const toString = (move: Move) => Move[move];
  export const toID = (move: string) => (Move as any)[move];
}

export interface IMoves {
  move0: Move;
  move1: Move;
  move2: Move;
  move3: Move;
}

export enum Stat {
  None,
  Health,
  Attack,
  Defense,
  Special,
  Resistance,
  Speed
}

export namespace Stat {
  export const toString = (stat: Stat) => Stat[stat];
  export const toID = (stat: string) => (Stat as any)[stat];
}

export interface IStats {
  health: number;
  attack: number;
  defense: number;
  special: number;
  resistance: number;
  speed: number;
}

export interface IBreeds {
  total: number;
  remaining: number;
  lastBreedTime: number;
}

export interface IAttributes {
  gender: string;
  chroma: string;
  primaryType: string;
  secondaryType: string;
  nature: string;
  size: number;
}

export interface IEvo {
  tokenId: number;
  species: Species;
  generation: number;
  experience: number;
  owner: string;
  attributes: IAttributes;
  stats: IStats;
  breeds: IBreeds;
  moves: IMoves;
}

export interface IEgg {
  tokenId: number;
  species: Species;
  generation: number;
  owner: string;
  parents: number[];
  treated: boolean;
  createdAt: number;
}
