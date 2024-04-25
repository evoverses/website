/* eslint-disable @next/next/no-img-element */
import EvoToken from "@/assets/images/evo-token.png";
import { getLevelOfEvo } from "@/lib/evoverses/math";
import { getElementSvg, getGenderImage } from "@/lib/evoverses/svgs";
import { RawEvo, RawEvoEgg, StatAbbrev } from "@/lib/evoverses/types";
import { getCollectionItem } from "@/lib/prisma/server";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const baseApiUrl = "https://api.evoverses.com" as const;
const baseImageApiUrl = `${baseApiUrl}/images`;

const getEvoUrl = (evo: RawEvo | RawEvoEgg) => {
  const base = `${baseImageApiUrl}/evo/${evo.species}`;
  const isEgg = "treated" in evo;
  if (isEgg) {
    return `${base}/${evo.generation === 0 ? Number(evo.tokenId) % 4 : "egg"}`;
  }
  return (
    !evo.chroma || evo.chroma === "None"
  ) ? base : `${base}/${evo.chroma}`;
};

const getCardBorder = (evo: RawEvo | RawEvoEgg) => {
  let color = "silver";
  if (!(
    "treated" in evo
  ) && evo.chroma && evo.chroma !== "None") {
    color = evo.chroma === "Super" ? "gold" : "purple";
  }
  return `${baseImageApiUrl}/card/border/${color}-metallic/4`;
};

export const GET = async (req: NextRequest, { params }: { params: { tokenId: string | string[] | undefined } }) => {
  if (!params.tokenId) {
    console.log("No tokenId. Original URL:", req.url);
    return new Response(`Failed to generate the image: No tokenId`, { status: 500 });
  }
  if (Array.isArray(params.tokenId)) {
    console.log("Too many tokenIds. Original URL:", req.url);
    return new Response(`Failed to generate the image: Too many tokenIds`, { status: 500 });
  }
  try {
    const tokenId = params.tokenId.replace(/[^0-9]/g, "");
    // const resp = await fetch(`${baseApiUrl}/metadata/evo/${tokenId}?raw=true`, {
    //   headers: {
    //     "x-api-key": process.env.EVOVERSES_API_KEY!,
    //   },
    //   next: {
    //     tags: [ "evo", tokenId ],
    //     revalidate: 43_200,
    //   },
    // });
    // if (!resp.ok) {
    //   console.log(
    //     `Failed to fetch metadata for tokenId ${tokenId}. Original URL:`,
    //     req.url,
    //     "Error:",
    //     resp.status,
    //     await resp.text(),
    //   );
    //   return new Response(`Failed to generate the image: Failed to fetch metadata for tokenId ${tokenId}`, {
    //     status: 500,
    //   });
    // }
    // const metadata = await resp.json();
    const metadata = await getCollectionItem("evo", Number(tokenId), true);
    // @ts-ignore
    const evo = "treated" in metadata ? metadata as RawEvo : metadata as RawEvoEgg;
    const isEgg = "treated" in evo;
    const ageSeconds = Math.floor((
      Date.now() - Date.parse(evo.createdAt)
    ) / 1000);
    const pctComplete = ageSeconds * 100 / 28800;
    const ageDays = Math.floor(ageSeconds / 86400);

    const baseUrl = req.url.split("/api")[0];

    return new ImageResponse(
      (
        <div id="container" tw="w-[512px] h-[725px] rounded-[20px] relative flex text-white font-black text-base">
          <img
            id="background"
            src={`${baseImageApiUrl}/card/background/${isEgg && evo.generation === 0 ? "genesis" : evo.types.primary}`}
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
          <img id="logo" src={`${baseUrl}${EvoToken.src}`} alt="gender" tw="w-7 h-7 absolute top-2.5 left-2.5" />
          <p id="species" tw="absolute top-8 left-8">
            {isEgg && evo.generation === 0 ? "Genesis Unknown" : evo.species}
          </p>
          {[ evo.types.primary, evo.types.secondary || "None" ]
            .filter(s => s !== "None")
            .reverse()
            .map((t, i, a) => (
              <img
                key={`type-${t}`}
                id={`type-${t}`}
                src={`${baseUrl}${getElementSvg(t).src}`}
                alt="Species"
                tw="absolute flex w-[18px] h-[18px] absolute top-[54px]"
                style={{ left: a.length === 1 ? `155px` : `${i === 0 ? 162 : 148}px` }}
              />
            ))}
          {!isEgg && (
            <img
              src={`${baseUrl}${getGenderImage(evo.gender)}`}
              alt="gender"
              tw="w-4 h-4 absolute top-[56px] left-[120px]"
            />
          )}
          <p id="level-info" tw="absolute top-[82px] left-[32px]">
            {isEgg ? "Egg" : `Level ${getLevelOfEvo(evo)}`}
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
            {isEgg ? `Age: ${ageDays} Day${ageDays === 1 ? "" : "s"}` : evo.nature}
          </p>
          {isEgg ? (
            <div tw="flex flex-col justify-center items-center w-full max-w-[300px] mx-auto top-[65px]">
              <p tw="absolute left-1/2 bottom-[230px]" style={{ transform: `translateX(-50%)` }}>
                {evo.generation > 0 ? <>Parents: {evo.parents.map(n => `#${n.tokenId}`).join(" & ")}</> : "Genesis"}
              </p>
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
              <GenItem stat="ATK" value={evo.attack} />
              <GenItem stat="SP" value={evo.special} />
              <GenItem stat="DEF" value={evo.defense} />
              <GenItem stat="RES" value={evo.resistance} />
              <GenItem stat="SPD" value={evo.speed} />
            </div>
          )}
          <p tw="absolute left-1/2 bottom-[88px]" style={{ transform: `translateX(-50%)` }}>
            {isEgg ? evo.treated ? "Treated" : "Untreated" : `${evo.generation === 0
              ? "Total Breeds"
              : "Breeds Left"}: ${evo.generation === 0 ? evo.totalBreeds : 5 - evo.totalBreeds}`}
          </p>
          <p tw="text-black absolute flex right-8 bottom-[81px]">#{evo.tokenId}</p>
          <p tw="text-black absolute flex right-8 bottom-[35px]">Generation {evo.generation}</p>
          {evo.types.primary && evo.types.primary !== "None" && (
            <img
              src={`${baseUrl}${getElementSvg(evo.types.primary).src}`}
              tw="absolute w-7 h-7 bottom-2.5 right-2.5"
              alt="type"
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
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
};

const GenItem = ({ stat, value }: { stat: StatAbbrev, value: number }) => {
  return (
    <div tw="flex justify-center h-8 w-[110px] items-center">
      <p tw="text-right m-0 p-0">{stat}:</p>
      <p tw="text-right m-0 ml-1 p-0">
        <span tw="text-[#ffd700]">{value}</span>
      </p>
    </div>
  );
};
