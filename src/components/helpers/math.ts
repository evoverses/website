import { maxXpTable } from "@/components/evo-card/data";
import { IEvo, Rarity } from "@/components/evo-card/types";



export const getLevelOfEvo = (evo: IEvo): number =>
  Array.from(Array(100)) // Create an array with 100 items
    .fill(1) // fill that array with 1s
    .map((n, i) => n + i) // change those numbers to be 1-100
    .reduce((cLevel, level) => // get just 1 number by iterating over the array and doing the math
        // if evo experience is greater than or equal to the max cumulative xp of this level, return this level,
        // else return the last saved level
      evo.experience >= Math.round(Math.pow(level,3) * (maxXpTable[evo.species as unknown as string] / 1_000_000))
        ? level
        : cLevel,
      1)

export const getRarityGemWidth = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.Epic:
      return 24;
    case Rarity.Chroma:
      return 22;
    case Rarity.Normal:
    default:
      return 0;
  }
}

export const getRarityGemHeight = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.Epic:
      return 25.19;
    case Rarity.Chroma:
      return 22;
    case Rarity.Normal:
    default:
      return 0;
  }
}

export const getNumberAvailableBreeds = (evo: IEvo) => {
  if (evo.generation === 0) {
    return "∞";
  }
  return (5 - evo.breeds.total).toString();
}

export const getNextBreedTimestamp = (evo: IEvo): number => {
  const baseTime = 7 * 86400;

  let breedTime = 86400;
  if (evo.generation < 6) {
    breedTime = baseTime - (evo.generation * 86400);
  }
  return evo.breeds.lastBreedTime + breedTime;
}
