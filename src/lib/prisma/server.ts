import "server-only";
import { evoNftContract } from "@/data/contracts";
import { getOwnedNftIds } from "@/lib/glacier/glacier";
import prisma from "@/lib/prisma/client";
import type { Address } from "abitype";
import { cache } from "react";

export const getCollectionItemsLocal = cache(async (
  collection: "evo" | "egg",
  owner?: Address,
  limit: number = 50,
  offset: number = 0,
) => {
  const where: any = {};
  if (owner) {
    const ids = await getOwnedNftIds(evoNftContract.address, owner);
    where.tokenId = { in: ids };
  }

  switch (collection.toLowerCase()) {
    case "evo":
      return {
        items: await prisma.evo.findMany({
          skip: offset,
          take: limit,
          where,
        }),
        total: await prisma.evo.count(owner ? { where } : undefined),
      };
    case "egg":
      return {
        items: await prisma.egg.findMany({
          skip: offset,
          take: limit,
          where: { ...where, hatchedAt: null },
        }),
        total: await prisma.egg.count({
          where: {
            hatchedAt: null, ...(
              owner ? where : {}
            ),
          },
        }),
      };
    default:
      throw new Error("Invalid collection");
  }
});

export const getCollectionItem = cache(async (collection: "evo" | "egg" = "evo", tokenId: number, raw: boolean) => {
  switch (collection.toLowerCase()) {
    case "evo":
      try {
        const evo = await prisma.evo.findUniqueOrThrow({
          where: { tokenId },
          include: {
            // @ts-ignore
            children: {
              select: {
                tokenId: true,
              },
            },
            types: {
              select: {
                primary: true,
                secondary: true,
              },
            },
          },
        });
        return raw ? evo : evoToMetadata(evo);
      } catch (e) {
        const egg = await prisma.egg.findUniqueOrThrow({
          where: { tokenId },
          // @ts-ignore
          include: {
            parents: {
              select: {
                tokenId: true,
              },
            },
            types: {
              select: {
                primary: true,
                secondary: true,
              },
            },
          },
        });
        return raw ? egg : eggToMetadata(egg);

      }
    case "egg": {
      const egg = await prisma.egg.findUniqueOrThrow({
        where: { tokenId },
        // @ts-ignore
        include: {
          parents: {
            select: {
              tokenId: true,
            },
          },
          types: {
            select: {
              primary: true,
              secondary: true,
            },
          },
        },
      });
      return raw ? egg : eggToMetadata(egg);
    }
    // case "trainer":
    //   body = await prisma.trainer.findUniqueOrThrow({
    //     where: { tokenId },
    //     include: {
    //       bonuses: true
    //     }
    //   });
    //   break;
    default:
      throw new Error("Invalid collection");
  }
});

const evoToMetadata = (evo: any) => {
  return {
    name: `${evo.species} #${evo.tokenId}`,
    description: "EvoVerses Evo",
    image: `https://evoverses.com/api/images/evo/${evo.tokenId}.png`,
    attributes: [
      { trait_type: "Species", value: evo.species },
      { trait_type: "Chroma", value: evo.chroma },
      { trait_type: "Gender", value: evo.gender },
      { trait_type: "Generation", value: evo.generation, display_type: "number" },
      { trait_type: "Primary Type", value: evo.types.primary },
      { trait_type: "Secondary Type", value: evo.types.secondary },
      { trait_type: "Breeds Remaining", value: evo.generation === 0 ? undefined : 5 - evo.totalBreeds, max_value: 5 },
      { trait_type: "Total Breeds", value: evo.generation === 0 ? evo.totalBreeds : undefined, display_type: "number" },
      { trait_type: "Level", value: 1, display_type: "number" },
      { trait_type: "Nature", value: evo.nature },
      { trait_type: "Attack", value: evo.attack, max_value: 50 },
      { trait_type: "Defense", value: evo.defense, max_value: 50 },
      { trait_type: "Special", value: evo.special, max_value: 50 },
      { trait_type: "Resistance", value: evo.resistance, max_value: 50 },
      { trait_type: "Speed", value: evo.speed, max_value: 50 },
      { trait_type: "Size", value: evo.size, display_type: "boost_percentage" },
      {
        trait_type: "Last Breed Time",
        value: evo.lastBreedTime ? Math.floor(Date.parse(evo.lastBreedTime) / 1000) : undefined,
        display_type: "date",
      },
      {
        trait_type: "Hatched At",
        value: evo.createdAt ? Math.floor(Date.parse(evo.createdAt) / 1000) : undefined,
        display_type: "date",
      },
    ].filter(trait => ![ undefined, "#undefined", "None", NaN, null ].includes(trait.value)),
  };
};

const eggToMetadata = (egg: any) => {
  return {
    name: `${egg.generation === 0 ? "Genesis" : egg.species} Egg #${egg.tokenId}`,
    description: "EvoVerses Evo Egg",
    image: `https://evoverses.com/api/images/evo/${egg.tokenId}.png`,
    attributes: [
      { trait_type: "Species", value: egg.species },
      { trait_type: "Generation", value: egg.generation, display_type: "number" },
      { trait_type: "Primary Type", value: egg.types.primary },
      { trait_type: "Secondary Type", value: egg.types.secondary },
      {
        trait_type: "Created At",
        value: egg.createdAt ? Math.floor(Date.parse(egg.createdAt) / 1000) : undefined,
        display_type: "date",
      },
      { value: "Egg" },
      { value: egg.treated ? "Treated" : undefined },
    ].filter(trait => ![ undefined, "#undefined", "None", NaN, null ].includes(trait.value)),
  };
};
