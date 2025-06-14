import { maxXpTable } from "@/lib/evoverses/data";
import type { SquidAsset, SquidAssetEvoMetadata } from "@/lib/squid/types";

export const getLevelOfEvo = (evo: SquidAsset<SquidAssetEvoMetadata>): number =>
  Array.from(Array(100)) // Create an array with 100 items
    .fill(1) // fill that array with 1s
    .map((n, i) => n + i) // change those numbers to be 1-100
    .reduce(
      (cLevel, level) => // get just 1 number by iterating over the array and doing the math
        // if evo experience is greater than or equal to the max cumulative xp of this level, return this level,
        // else return the last saved level
        evo.metadata.xp >= Math.round(Math.pow(level, 3) * (
          maxXpTable[evo.metadata.species] / 1_000_000
        ))
          ? level
          : cLevel,
      1,
    );
