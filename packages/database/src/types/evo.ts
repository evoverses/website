import { chromaPgEnum, elementPgEnum, genderPgEnum, naturePgEnum, rarityPgEnum } from "@workspace/database/schema/evo";
import { z } from "zod";

export const chromaSchema = z.enum(chromaPgEnum.enumValues);
export const chromas = chromaSchema.options;
export const Chroma = chromaSchema.enum;
export type Chroma = z.infer<typeof chromaSchema>;

export const elementSchema = z.enum(elementPgEnum.enumValues);
export const elements = elementSchema.options;
export const Element = elementSchema.enum;
export type Element = z.infer<typeof elementSchema>;

export const natureSchema = z.enum(naturePgEnum.enumValues);
export const natures = natureSchema.options;
export const Nature = natureSchema.enum;
export type Nature = z.infer<typeof natureSchema>;

export const raritySchema = z.enum(rarityPgEnum.enumValues);
export const rarities = raritySchema.options;
export const Rarity = typeof raritySchema.enum;
export type Rarity = z.infer<typeof raritySchema>;

export const genderSchema = z.enum(genderPgEnum.enumValues);
export const genders = genderSchema.options;
export const Gender = genderSchema.enum;
export type Gender = z.infer<typeof genderSchema>;

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
