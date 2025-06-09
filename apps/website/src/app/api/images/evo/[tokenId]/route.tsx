/* eslint-disable @next/next/no-img-element,react/no-unknown-property */
// noinspection TypeScriptValidateTypes

import { ColoredTypeCircleIcon } from "@/components/icons/colored-type-circle-icons";
import { GenderIcon } from "@/components/icons/gender-icons";
import { fetchSquidAsset } from "@/lib/evo/fetch";
import { hasChroma, hasRarity, hasTypes, isEggMetadata } from "@/lib/evo/utils";
import { getLevelOfEvo } from "@/lib/evoverses/math";
import { StatNameAbbreviation } from "@/lib/evoverses/types";
import type { SquidAsset, SquidAssetEvoMetadata } from "@/lib/squid/types";
import { secondsSince, timeSince } from "@/utils/numbers";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const baseApiUrl = "https://api.evoverses.com" as const;
const baseImageApiUrl = `${baseApiUrl}/images`;

const getEvoUrl = (evo: SquidAsset) => {
  const metadata = evo.metadata;
  const base = `${baseImageApiUrl}/evo/${metadata.species}`;
  const isEgg = metadata.type === "EGG";
  if (isEgg) {
    return `${base}/${metadata.generation === 0 ? Number(evo.tokenId) % 4 : "egg"}`;
  }
  return hasChroma(metadata) ? `${base}/${metadata.chroma}` : base;
};

const getCardBorder = (evo: SquidAsset) => {
  const metadata = evo.metadata;
  let color = "silver";
  if (hasRarity(metadata)) {
    color = "silver"; // TODO: metadata.rarity === TBD;
  }
  return `${baseImageApiUrl}/card/border/${color}-metallic/4`;
};

export const GET = async (
  req: NextRequest, context: { params: Promise<{ tokenId: string | string[] | undefined }> }) => {
  const params = await context.params;
  if (!params.tokenId) {
    console.error("No tokenId. Original URL:", req.url);
    return new Response(`Failed to generate the image: No tokenId`, { status: 500 });
  }
  if (Array.isArray(params.tokenId)) {
    console.error("Too many tokenIds. Original URL:", req.url);
    return new Response(`Failed to generate the image: Too many tokenIds`, { status: 500 });
  }
  try {
    const tokenId = params.tokenId.replace(/[^0-9]/g, "");
    const evo = await fetchSquidAsset(tokenId, { revalidate: 0 });
    const metadata = evo.metadata;
    const hasType = hasTypes(metadata);
    const isEgg = isEggMetadata(metadata);

    const ageSeconds = secondsSince(evo.metadata.createdAt);
    const pctComplete = ageSeconds * 100 / 28800;
    const ageDays = Math.floor(ageSeconds / 86400);

    const baseUrl = req.url.split("/api")[0];
    return new ImageResponse(
      (
        <div id="container" tw="w-[512px] h-[725px] rounded-[20px] relative flex text-white font-black text-base">
          <img
            id="background"
            src={`${baseImageApiUrl}/card/background/${hasType ? metadata.primaryType : "genesis"}`}
            tw="w-full h-full rounded-[30px] absolute top-0 left-0"
            alt="background"
          />
          <img
            id="evo"
            src={getEvoUrl(evo)}
            tw="w-[400px] h-[400px] absolute top-[80px] left-1/2"
            style={{ transform: `translateX(-50%)` }}
            alt="evo image"
          />
          <img id="border" tw="absolute w-full h-full" src={getCardBorder(evo)} alt="border" />
          <img
            id="logo"
            src="data:image/png;base64,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"
            alt="gender"
            tw="w-7 h-7 absolute top-2.5 left-2.5"
          />
          <p id="species" tw="absolute top-8 left-8">
            {isEgg && metadata.generation === 0 ? "Genesis Unknown" : metadata.species}
          </p>
          {hasType && [ metadata.primaryType, metadata.secondaryType ]
            .filter(s => s !== "None")
            .reverse()
            .map((t, i, a) => (
              <ColoredTypeCircleIcon
                key={`type-${t}`}
                id={`type-${t}`}
                type={t}
                // @ts-expect-error tw mismatch
                tw="absolute flex w-[18px] h-[18px] absolute top-[54px]"
                style={{ left: a.length === 1 ? `155px` : `${i === 0 ? 162 : 148}px` }}
              />
            ))}
          {!isEgg && (
            <GenderIcon
              gender={metadata.gender}
              // @ts-expect-error tw mismatch
              tw="w-4 h-4 absolute top-[56px] left-[120px]"
            />
          )}
          <p id="level-info" tw="absolute top-[82px] left-[32px]">
            {isEgg ? "Egg" : `Level ${getLevelOfEvo(evo as SquidAsset<SquidAssetEvoMetadata>)}`}
          </p>
          <img
            id="info-overlay"
            tw="absolute w-full h-full top-[60px] opacity-80"
            style={{ filter: "invert(100%)" }}
            src={`${baseImageApiUrl}/card/overlay/info-island`}
            alt="info-overlay-bg"
          />
          <p
            tw="absolute left-1/2 bottom-[212px]"
            style={{ transform: "translateX(-50%)" }}
          >
            {isEgg ? `Age: ${ageDays} Day${ageDays === 1 ? "" : "s"}` : metadata.nature}
          </p>
          {isEgg ? (
            <div tw="flex flex-col justify-center items-center w-full max-w-[300px] mx-auto top-[65px]">
              {hasType && metadata.parent1Id && (
                <p tw="absolute left-1/2 bottom-[230px]" style={{ transform: `translateX(-50%)` }}>
                  {metadata.generation > 0 ? <>Parents: {[ metadata.parent1Id, metadata.parent2Id ].filter(Boolean)
                    .map(n => `#${n}`)
                    .join(" & ")}</> : "Genesis"}
                </p>
              )}
              <div tw="flex justify-center items-center w-full max-w-[300px] mx-auto top-[135px]">
                <div tw="flex h-1 mx-4 w-full rounded-lg overflow-hidden bg-white">
                  <div tw="bg-[#51FFFE] h-full" style={{ width: `${pctComplete > 100 ? 100 : pctComplete}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div
              tw="w-[350px] h-[64px] absolute bottom-[148px] pl-2 left-1/2 flex items-center flex-wrap"
              style={{ transform: "translateX(-50%)" }}
            >
              <GenItem stat="HP" value={50} />
              <GenItem stat="ATK" value={metadata.attack} />
              <GenItem stat="SP" value={metadata.special} />
              <GenItem stat="DEF" value={metadata.defense} />
              <GenItem stat="RES" value={metadata.resistance} />
              <GenItem stat="SPD" value={metadata.speed} />
            </div>
          )}
          <p tw="absolute left-1/2 bottom-[88px]" style={{ transform: `translateX(-50%)` }}>
            {isEgg ? metadata.treated ? "Treated" : "Untreated" : `${metadata.generation === 0
              ? "Total Breeds"
              : "Breeds Left"}: ${metadata.generation === 0 ? metadata.totalBreeds : 5 - metadata.totalBreeds}`}
          </p>
          <p tw="text-black absolute flex right-8 bottom-[81px]">#{evo.tokenId}</p>
          <p tw="text-black absolute flex right-8 bottom-[35px]">Generation {metadata.generation}</p>
          {hasType && (
            <ColoredTypeCircleIcon
              type={metadata.primaryType}
              // @ts-expect-error tw mismatch
              tw="absolute w-7 h-7 bottom-2.5 right-2.5"
            />
          )}
        </div>
      ),
      {
        width: 512,
        height: 725,
        fonts: [
          {
            name: "Nunito",
            data: await fetch(new URL(`/fonts/Nunito-Bold.ttf`, baseUrl)).then((res) => res.arrayBuffer()),
            weight: 900,
            style: "normal",
          },
        ],
      },
    );
  } catch (e: unknown) {
    console.log(`${(
      e as Error
    ).message}`);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
};

const GenItem = ({ stat, value }: { stat: StatNameAbbreviation, value: number }) => {
  return (
    <div tw="flex justify-center h-8 w-[110px] items-center">
      <p tw="text-right m-0 p-0">{stat}:</p>
      <p tw="text-right m-0 ml-1 p-0">
        <span tw="text-[#ffd700]">{value}</span>
      </p>
    </div>
  );
};
