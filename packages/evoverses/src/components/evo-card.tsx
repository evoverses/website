import "@workspace/evoverses/types/next";
import { Element, StatNameAbbreviation } from "@workspace/database/types/evo";
import { ElementIcon } from "@workspace/evoverses/components/icons/element-icon";
import { GenderIcon } from "@workspace/evoverses/components/icons/gender-icon";
import type { SquidAsset, SquidAssetEvoMetadata } from "@workspace/evoverses/lib/asset/types";
import {
  evoversesIconUrl,
  getEvoCardBorderUrl,
  getEvoCardElementBackgroundUrl,
  getEvoCardEvoImageUrl,
  getInfoIslandUrl,
  getLevelOfEvo,
  hasElements,
  isEgg,
  isEvo,
  isEvoAsset,
  isGen0,
  isGenesisEgg,
  isTreated,
} from "@workspace/evoverses/lib/asset/utils";
import { daysSince } from "@workspace/evoverses/utils/numbers";
import { pluralize, toTitleCase } from "@workspace/evoverses/utils/strings";

const ageFormatter = (days: number) => {
  const age = daysSince(days);
  if (age < 1) {
    return "< 1 Day";
  }
  if (age < 7) {
    return `${Math.floor(age)} ${pluralize(Math.floor(age), "Day")}`;
  }
  if (age < 28) {
    return `${Math.floor(age / 7)} ${pluralize(Math.floor(age / 7), "Week")}`;
  }
  if (age < 365) {
    return `${Math.floor(age / 30) || 1} ${pluralize(Math.floor(age / 30) || 1, "Day")}`;
  }
  return `${Math.floor(age / 365)} ${pluralize(Math.floor(age / 365), "Year")}`;
};
export const EvoCard = ({ asset }: { asset: SquidAsset }) => {
  const age = daysSince(asset.metadata.createdAt);
  const stats = isEvo(asset) ? [
    { stat: StatNameAbbreviation.hp, value: 50 },
    { stat: StatNameAbbreviation.atk, value: asset.metadata.attack },
    { stat: StatNameAbbreviation.sp, value: asset.metadata.special },
    { stat: StatNameAbbreviation.def, value: asset.metadata.defense },
    { stat: StatNameAbbreviation.res, value: asset.metadata.resistance },
    { stat: StatNameAbbreviation.spd, value: asset.metadata.speed },
  ] : [];
  return (
    <div className="@container absolute w-full aspect-card rounded-[1.25rem] relative flex text-white font-black text-base">
      <img
        src={getEvoCardElementBackgroundUrl(asset)}
        className="w-full h-full rounded-[1.875rem] absolute top-0 left-0 select-none pointer-events-none"
        alt="background"
      />
      <img
        src={getEvoCardEvoImageUrl(asset)}
        className="absolute aspect-square w-[78.125cqw] top-20 left-1/2 -translate-x-1/2 select-none pointer-events-none"
        alt="evo image"
      />
      <img className="absolute w-full select-none pointer-events-none" src={getEvoCardBorderUrl(asset)} alt="border" />
      <img
        src={evoversesIconUrl}
        alt="logo"
        className="absolute w-[5.469cqw] aspect-square top-[2cqw] left-[2cqw] select-none"
      />
      <div className="absolute top-[10cqw] h-[4.5cqw] left-[6.25cqw] flex w-[34.375cqw] justify-between">
        <span className="text-black text-[3.625cqw]">
          {isGenesisEgg(asset) ? "Genesis Unknown" : toTitleCase(asset.metadata.species)}
        </span>
        <div className="flex gap-3 items-center">
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
                    ), marginLeft: a.length === 1 ? 0 : `${i === 0 ? 0 : -5}px`,
                  }}
                />
              ))}
          </div>
        </div>
      </div>
      <span className="absolute top-[20.31cqw] left-[6.25cqw] text-[3.625cqw] text-black">
        {isEvoAsset(asset) ? `Level ${getLevelOfEvo(asset as SquidAsset<SquidAssetEvoMetadata>)}` : "Egg"}
      </span>
      <img
        className="absolute w-full opacity-80 invert top-5 select-none"
        src={getInfoIslandUrl()}
        alt="info-overlay-bg"
      />
      <div className="absolute bottom-[20.3cqw] h-[34cqw] left-1/2 -translate-x-1/2 flex flex-col justify-between items-center">
        <div className="h-[7cqw] flex items-center text-center">
          <span className="text-[3.625cqw]">
            {isEvoAsset(asset) ? toTitleCase(asset.metadata.nature) : `Age: ${ageFormatter(age)}`}
          </span>
        </div>
        {isEgg(asset) ? (
          <div className="flex flex-col justify-center items-center w-[58.6cqw] mx-auto">
            {hasElements(asset) && asset.metadata.parent1Id && (
              <span className="absolute left-1/2 bottom-[230px]" style={{ transform: `translateX(-50%)` }}>
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
          <div className="grid grid-cols-3 gap-x-[4cqw] pb-[1.56cqw]">
            {stats.map(({ stat, value }, i) => (
              <div
                key={`stat-${i}`}
                className="flex gap-[0.78cqw] justify-center h-[6.25cqw] items-center text-[3.625cqw]"
              >
                <span>{stat.toUpperCase()}:</span>
                <span className="text-[#ffd700]">{value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="h-[7.8cqw] flex items-center text-center">
          <span className="pb-[1.56cqw] text-[3.225cqw]">
            {isEvo(asset)
              ? `${isGen0(asset) ? "Total Breeds" : "Breeds Left"}: ${isGen0(asset) ? asset.metadata.totalBreeds : 5
                - asset.metadata.totalBreeds}`
              : isTreated(asset) ? "Treated" : "Untreated"}
          </span>
        </div>
      </div>
      <span className="text-black absolute text-[3.625cqw] right-[6.25cqw] bottom-[19.5cqw]">#{asset.tokenId}</span>
      <span className="text-black absolute text-[3.625cqw] right-[6.25cqw] bottom-[10.5cqw]">Generation {asset.metadata.generation}</span>
      <span className="text-black absolute text-[3.625cqw] left-[6.25cqw] bottom-[1cqw]">Owner: {asset.owner.slice(-6)}</span>
      {hasElements(asset) && (
        <ElementIcon
          value={asset.metadata.primaryType}
          className="absolute size-[5.5cqw] bottom-[1.9cqw] right-[1.9cqw]"
        />
      )}
    </div>
  );
};
