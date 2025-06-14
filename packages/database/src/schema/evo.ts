import { metadataSchema } from "@workspace/database/schema/shared";
import { relations } from "drizzle-orm";
import { boolean, integer, numeric, serial, text, timestamp } from "drizzle-orm/pg-core";

export const genderPgEnum = metadataSchema.enum("gender", [ "unknown", "male", "female" ]);
export const naturePgEnum = metadataSchema.enum(
  "nature",
  [ "unknown", "dauntless", "executive", "restless", "nervous", "cunning", "energetic",
    "clever", "confident", "ignorant", "arrogant", "biting", "aggressive", "patient", "mature", "sensible", "calm",
    "rude", "cautious", "curious", "discrete", "loyal" ],
);
export const elementPgEnum = metadataSchema.enum(
  "element",
  [ "none", "water", "fire", "air", "plant", "earth", "light", "dark", "mineral", "corrupt", "ether", "bug",
    "monster" ],
);
export const rarityPgEnum = metadataSchema.enum("rarity", [ "unknown" ]);
export const chromaPgEnum = metadataSchema.enum("chroma", [ "none", "chroma", "super" ]);

export const evoTable = metadataSchema.table("evo", {
  id: serial("id").primaryKey(),
  tokenId: numeric("token_id").unique("token_id_unique", { nulls: "not distinct" }),
  gender: genderPgEnum("gender").notNull().default("unknown"),
  generation: integer("generation").notNull(),
  nature: naturePgEnum("nature").notNull().default("unknown"),
  rarity: rarityPgEnum("rarity").notNull().default("unknown"),
  chroma: chromaPgEnum("chroma").notNull().default("none"),
  totalBreeds: integer("total_breeds").notNull().default(0),
  lastBreedTime: timestamp("last_breed_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  hatchedAt: timestamp("hatched_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  attack: integer("attack").notNull().default(0),
  special: integer("special").notNull().default(0),
  defense: integer("defense").notNull().default(0),
  resistance: integer("resistance").notNull().default(0),
  speed: integer("speed").notNull().default(0),
  size: integer("size").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  treated: boolean("treated").notNull().default(false),
  speciesId: integer("species_id").references(() => speciesTable.id).notNull().default(0),
  parent1TokenId: numeric("parent1_token_id"),
  parent2TokenId: numeric("parent2_token_id"),
});

export const speciesRelations = relations(
  evoTable,
  ({ one }) => (
    {
      species: one(
        speciesTable,
        { fields: [ evoTable.speciesId ], references: [ speciesTable.id ], relationName: "species" },
      ),
      parent1: one(
        evoTable,
        { fields: [ evoTable.parent1TokenId ], references: [ evoTable.tokenId ], relationName: "parent1" },
      ),
      parent2: one(
        evoTable,
        { fields: [ evoTable.parent2TokenId ], references: [ evoTable.tokenId ], relationName: "parent2" },
      ),
    }
  ),
);

export const speciesTable = metadataSchema.table("species", {
  id: integer("id").primaryKey(),
  species: text("species"),
  primaryType: elementPgEnum("primary_type").notNull(),
  secondaryType: elementPgEnum("secondary_type").notNull(),
});
