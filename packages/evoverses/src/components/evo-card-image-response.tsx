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

export const evoCardImageResponse = (asset: SquidAsset) => <EvoCardImageResponse asset={asset} />;
export const EvoCardImageResponse = ({ asset }: { asset: SquidAsset }) => {
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
    <div id="container" tw="w-[512px] h-[725px] rounded-[20px] relative flex text-white font-black text-base">
      <img
        id="background"
        src={getEvoCardElementBackgroundUrl(asset)}
        tw="w-full h-full rounded-[30px] absolute top-0 left-0"
        alt="background"
      />
      <img
        id="evo"
        src={getEvoCardEvoImageUrl(asset)}
        tw="w-100 h-[400px] absolute top-[80px] left-1/2"
        style={{ transform: `translateX(-50%)` }}
        alt="evo image"
      />
      <img id="border" tw="absolute w-full h-full" src={getEvoCardBorderUrl(asset)} alt="border" />
      <img id="logo" src={evoversesIconUrl} alt="logo" tw="w-7 h-7 absolute top-2.5 left-2.5" />
      <p id="species" tw="absolute top-8 left-8">
        {isGenesisEgg(asset) ? "Genesis Unknown" : toTitleCase(asset.metadata.species)}
      </p>
      {hasElements(asset) && [ asset.metadata.primaryType, asset.metadata.secondaryType ]
        .filter(s => s !== Element.none)
        .reverse()
        .map((t, i, a) => (
          <ElementIcon
            key={`type-${t}`}
            id={`type-${t}`}
            value={t}
            tw="absolute flex w-[18px] h-[18px] absolute top-[54px]"
            style={{ left: a.length === 1 ? `155px` : `${i === 0 ? 162 : 148}px` }}
          />
        ))}
      {isEvoAsset(asset) && (
        <GenderIcon value={asset.metadata.gender} tw="w-4 h-4 absolute top-[56px] left-[120px]" />
      )}
      <p id="level-info" tw="absolute top-[82px] left-[32px]">
        {isEvoAsset(asset) ? `Level ${getLevelOfEvo(asset as SquidAsset<SquidAssetEvoMetadata>)}` : "Egg"}
      </p>
      <img
        id="info-overlay"
        tw="absolute w-full h-full top-[60px] opacity-80"
        style={{ filter: "invert(100%)" }}
        src={getInfoIslandUrl()}
        alt="info-overlay-bg"
      />
      <p
        tw="absolute left-1/2 bottom-[212px]"
        style={{ transform: "translateX(-50%)" }}
      >
        {isEvoAsset(asset) ? toTitleCase(asset.metadata.nature) : `Age: ${age} ${pluralize(age, "Day")}`}
      </p>
      {isEgg(asset) ? (
        <div tw="flex flex-col justify-center items-center w-full max-w-75 mx-auto top-[65px]">
          {hasElements(asset) && asset.metadata.parent1Id && (
            <p tw="absolute left-1/2 bottom-[230px]" style={{ transform: `translateX(-50%)` }}>
              {isGen0(asset)
                ? "Genesis"
                : <>Parents: {[ asset.metadata.parent1Id, asset.metadata.parent2Id ].filter(Boolean)
                  .map(n => `#${n}`)
                  .join(" & ")}</>}
            </p>
          )}
          <div tw="flex justify-center items-center w-full max-w-75 mx-auto top-[135px]">
            <div tw="flex h-1 mx-4 w-full rounded-lg overflow-hidden bg-white">
              <div
                tw="bg-[#51FFFE] h-full"
                style={{
                  width: Math.min(daysSince(asset.metadata.createdAt), 1)
                    .toLocaleString("en", { maximumFractionDigits: 2, style: "percent" }),
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          tw="w-[350px] h-[64px] absolute bottom-[148px] pl-2 left-1/2 flex items-center flex-wrap"
          style={{ transform: "translateX(-50%)" }}
        >
          {stats.map(({ stat, value }, i) => (
            <div key={`stat-${i}`} tw="flex justify-center h-8 w-[110px] items-center">
              <p tw="text-right m-0 p-0">{stat.toUpperCase()}:</p>
              <p tw="text-right m-0 ml-1 p-0">
                <span tw="text-[#ffd700]">{value}</span>
              </p>
            </div>
          ))}
        </div>
      )}
      <p tw="absolute left-1/2 bottom-[88px]" style={{ transform: `translateX(-50%)` }}>
        {isEvo(asset)
          ? `${isGen0(asset) ? "Total Breeds" : "Breeds Left"}: ${isGen0(asset) ? asset.metadata.totalBreeds : 5
            - asset.metadata.totalBreeds}`
          : isTreated(asset) ? "Treated" : "Untreated"}
      </p>
      <p tw="text-black absolute flex right-8 bottom-[81px]">#{asset.tokenId}</p>
      <p tw="text-black absolute flex right-8 bottom-[35px]">Generation {asset.metadata.generation}</p>
      {hasElements(asset) && (
        <ElementIcon value={asset.metadata.primaryType} tw="absolute w-7 h-7 bottom-2.5 right-2.5" />
      )}
    </div>
  );
};
