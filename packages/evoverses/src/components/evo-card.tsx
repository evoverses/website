import "@workspace/evoverses/types/next";
import { currentLevelHealth } from "@workspace/evoverses/lib/asset/health";
import { Element, StatNameAbbreviation } from "@workspace/database/types/evo";
import { EvoImage } from "@workspace/evoverses/components/evo-image";
import { ElementIcon } from "@workspace/evoverses/components/icons/element-icon";
import { GenderIcon } from "@workspace/evoverses/components/icons/gender-icon";
import type { SquidAsset, SquidAssetEvoMetadata } from "@workspace/evoverses/lib/asset/types";
import {
  evoversesIconUrl,
  getEvoCardBorderUrl,
  getEvoCardElementBackgroundUrl,
  getLevelOfEvo,
  hasElements,
  isEgg,
  isEvo,
  isEvoAsset,
  isGen0,
  isGenesisEgg,
  isTreated,
} from "@workspace/evoverses/lib/asset/utils";
import { ageFormatter, daysSince } from "@workspace/evoverses/utils/numbers";
import { toTitleCase } from "@workspace/evoverses/utils/strings";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";

export const EvoCard = ({ className, asset, ...props }: ComponentProps<"div"> & { asset: SquidAsset }) => {

  const age = daysSince(asset.metadata.createdAt);
  const stats = isEvo(asset) ? [
    { stat: StatNameAbbreviation.hp, value: currentLevelHealth(asset.metadata.species, asset.metadata.xp) ?? "—" },
    { stat: StatNameAbbreviation.atk, value: asset.metadata.attack },
    { stat: StatNameAbbreviation.sp, value: asset.metadata.special },
    { stat: StatNameAbbreviation.def, value: asset.metadata.defense },
    { stat: StatNameAbbreviation.res, value: asset.metadata.resistance },
    { stat: StatNameAbbreviation.spd, value: asset.metadata.speed },
  ] : [];
  return (
    <div
      className={cn(
        "@container w-full aspect-card overflow-hidden rounded-[1.25rem] relative flex text-white font-black text-base",
        className,
      )}
      data-evo-card
      {...props}
    >
      <img
        src={getEvoCardElementBackgroundUrl(asset)}
        className="w-full h-full rounded-[1.875rem] absolute top-0 left-0 select-none pointer-events-none"
        alt="background"
      />
      <EvoImage asset={asset} data-evo-card-art className="absolute w-[82cqw] h-[70cqw] object-contain top-[27cqw] left-1/2 -translate-x-1/2" />
      <img className="absolute w-full select-none pointer-events-none" src={getEvoCardBorderUrl(asset)} alt="border" />
      <img
        src={evoversesIconUrl}
        alt="logo"
        className="absolute w-[5.469cqw] aspect-square top-[2cqw] left-[2cqw] select-none"
      />
      <div data-evo-card-bar="species" className="absolute top-[9.78cqw] h-[4.98cqw] left-[6.25cqw] flex w-[34.375cqw] items-center justify-between">
        <span className="text-black text-[3.625cqw] leading-none">
          {isGenesisEgg(asset) ? "Genesis Unknown" : toTitleCase(asset.metadata.species)}
        </span>
        <div className="flex gap-[1cqw] items-center">
          {isEvoAsset(asset) && (
            <GenderIcon value={asset.metadata.gender} className="size-[3.625cqw] text-black" />
          )}
          <div className="flex">
            {hasElements(asset) && [ asset.metadata.primaryType, asset.metadata.secondaryType ]
              .filter(s => s !== Element.none)
              .map((t, i, a) => (
                <ElementIcon
                  key={`type-${t}`}
                  value={t}
                  className="size-[3.625cqw]"
                  style={{
                    ...(
                      i === 0 ? { zIndex: 2 } : {}
                    ), marginLeft: a.length === 1 ? 0 : `${i === 0 ? 0 : -1}cqw`,
                  }}
                />
              ))}
          </div>
        </div>
      </div>
      <span data-evo-card-bar="level" className="absolute top-[19.56cqw] h-[4.98cqw] left-[6.25cqw] flex items-center text-[3.625cqw] leading-none text-black">
        {isEvoAsset(asset) ? `Level ${getLevelOfEvo(asset as SquidAsset<SquidAssetEvoMetadata>)}` : "Egg"}
      </span>
      {/* A compact panel keeps stats and breeding text clear of the right-hand identity bars. */}
      <div data-evo-card-info className="absolute bottom-[9.58cqw] h-[31cqw] w-[40cqw] left-[9.61cqw] rounded-[3cqw] bg-black/70 flex flex-col justify-between items-center px-[3cqw] py-[1.5cqw] leading-[1.2]">
        <div className="relative h-full w-full flex flex-col justify-between items-center">
          <div className="h-[5cqw] w-full flex justify-center items-center text-center">
            <span className="text-[3.625cqw]">
              {isEvoAsset(asset) ? toTitleCase(asset.metadata.nature) : `Age: ${ageFormatter(age)}`}
            </span>
          </div>
          {isEgg(asset) ? (
            <div className="flex flex-col justify-center items-center w-full mx-auto">
              {hasElements(asset) && asset.metadata.parent1Id && (
                <span className="text-[3cqw] text-center">
                  {isGen0(asset)
                    ? "Genesis"
                    : <>Parents: {[ asset.metadata.parent1Id, asset.metadata.parent2Id ].filter(Boolean)
                      .map(n => `#${n}`)
                      .join(" & ")}</>}
                </span>
              )}
              <div className="flex justify-center items-center w-full">
                <div className="flex h-[0.78cqw] mx-[3.125cqw] w-full rounded-lg overflow-hidden bg-white">
                  <div
                    className="bg-[#51FFFE] h-full"
                    style={{
                      width: Math.min(daysSince(asset.metadata.createdAt), 1)
                        .toLocaleString("en", { maximumFractionDigits: 2, style: "percent" }),
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid w-full grid-cols-2 gap-x-[3cqw] gap-y-[0.5cqw]">
              {stats.map(({ stat, value }, i) => (
                <div
                  key={`stat-${i}`}
                  className="flex gap-[0.78cqw] justify-between h-[4.5cqw] items-center text-[3.2cqw]"
                >
                  <span>{stat.toUpperCase()}:</span>
                  <span className="text-[#ffd700]">{value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="h-[5.5cqw] w-full border-t border-white/20 flex justify-center items-center text-center">
            <span className="text-[3cqw] whitespace-nowrap">
              {isEvo(asset)
                ? `${isGen0(asset) ? "Total Breeds" : "Breeds Left"}: ${isGen0(asset) ? asset.metadata.totalBreeds : 5
                  - asset.metadata.totalBreeds}`
                : isTreated(asset) ? "Treated" : "Untreated"}
            </span>
          </div>
        </div>
      </div>
      <span data-evo-card-number data-evo-card-bar="number" className="text-black absolute h-[4.8cqw] flex items-center text-[3.625cqw] leading-none right-[6.25cqw] bottom-[18.81cqw]">#{asset.tokenId}</span>
      <span data-evo-card-bar="generation" className="text-black absolute h-[4.98cqw] flex items-center text-[3.625cqw] leading-none right-[6.25cqw] bottom-[9.58cqw]">Generation {asset.metadata.generation}</span>
      <span className="text-black absolute h-[4.6cqw] flex items-center text-[3.625cqw] leading-none left-[6.25cqw] bottom-0">Owner: {asset.owner.slice(-6)}</span>
      {hasElements(asset) && (
        <ElementIcon
          value={asset.metadata.primaryType}
          className="absolute size-[5.5cqw] bottom-[1.9cqw] right-[1.9cqw]"
        />
      )}
    </div>
  );
};
