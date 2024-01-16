import EvoToken from "@/assets/images/evo-token.png";
import { getLevelOfEvo } from "@/lib/evoverses/math";
import { getElementSvg, getGenderImage } from "@/lib/evoverses/svgs";
import { RawEvo, RawEvoEgg, StatAbbrev } from "@/lib/evoverses/types";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

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
    const resp = await fetch(`${baseApiUrl}/metadata/evo/${tokenId}?raw=true`, {
      next: {
        tags: [ "evo", tokenId ],
        revalidate: 43_200,
      },
    });
    const metadata = await resp.json();

    const evo = "treated" in metadata ? metadata as RawEvo : metadata as RawEvoEgg;
    const isEgg = "treated" in evo;
    const ageSeconds = Math.floor((
      Date.now() - Date.parse(evo.createdAt)
    ) / 1000);
    const percentComplete = ageSeconds * 100 / 28800;
    const ageDays = Math.floor(ageSeconds / 86400);

    const baseUrl = req.url.split("/api")[0];
    const nunito = await fetch(
      new URL(`/fonts/Nunito.ttf`, baseUrl),
    ).then((res) => res.arrayBuffer());
    const nunitoBold = await fetch(
      new URL(`/fonts/Nunito-Bold.ttf`, baseUrl),
    ).then((res) => res.arrayBuffer());
    const nunitoSemiBold = await fetch(
      new URL(`/fonts/Nunito-SemiBold.ttf`, baseUrl),
    ).then((res) => res.arrayBuffer());
    return new ImageResponse(
      (
        <div
          id="container"
          style={{
            width: 512,
            height: 725,
            borderRadius: 20,
            position: "relative",
            display: "flex",
          }}
        >
          <img
            id="background"
            src={`${baseImageApiUrl}/card/background/${isEgg && evo.generation === 0 ? "genesis" : evo.types.primary}`}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 30,
              position: "absolute",
              top: 0,
              left: 0,
            }}
            alt="background"
          />
          <img
            id="evo"
            src={getEvoUrl(evo)}
            style={{
              position: "absolute",
              width: `400px`,
              height: `400px`,
              left: `50%`,
              transform: `translateX(-50%)`,
              top: `80px`,
            }}
            alt="evo image"
          />
          <img
            id="border"
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
            src={getCardBorder(evo)}
            alt="border"
          />
          <img
            id="logo"
            src={`${baseUrl}${EvoToken.src}`}
            alt="gender"
            style={{
              position: "absolute",
              width: `28px`,
              height: `28px`,
              top: `10px`,
              left: `10px`,
            }}
          />
          <p
            id="species"
            style={{
              fontFamily: "Nunito",
              color: "#FFFFFF",
              fontWeight: "900",
              fontSize: `16px`,
              position: "absolute",
              top: `35px`,
              left: `32px`,
            }}
          >
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
                style={{
                  position: "absolute",
                  display: "flex",
                  width: `18px`,
                  height: `18px`,
                  top: `54px`,
                  left: a.length === 1 ? `155px` : `${i === 0 ? 162 : 148}px`,
                }}
              />
            ))}
          {!isEgg && (
            <img
              src={`${baseUrl}${getGenderImage(evo.gender)}`}
              alt="gender"
              style={{
                position: "absolute",
                width: `16px`,
                height: `16px`,
                top: `56px`,
                left: `120px`,
              }}
            />
          )}
          <p
            id="level-info"
            style={{
              fontFamily: "Nunito",
              color: "#FFFFFF",
              fontWeight: "900",
              fontSize: `16px`,
              position: "absolute",
              top: `85px`,
              left: `32px`,
            }}
          >
            {isEgg ? "Egg" : `Level ${getLevelOfEvo(evo)}`}
          </p>
          <img
            id="info-overlay"
            style={{
              position: "absolute",
              width: `512px`,
              height: `725px`,
              top: `60px`,
              opacity: 0.8,
              filter: "invert(100%)",
            }}
            src={`${baseImageApiUrl}/card/overlay/info-island`}
            alt="info-overlay-bg"
          />
          <p
            style={{
              fontFamily: "Nunito",
              fontWeight: 900,
              color: "#FFFFFF",
              position: "absolute",
              fontSize: `16px`,
              left: "50%",
              transform: "translateX(-50%)",
              bottom: `215px`,
            }}
          >
            {isEgg ? `Age: ${ageDays} Day${ageDays === 1 ? "" : "s"}` : evo.nature}
          </p>
          {isEgg ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                maxWidth: `300px`,
                marginLeft: "auto",
                marginRight: "auto",
                top: `65px`,
              }}
            >
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "Nunito",
                  fontWeight: 900,
                  fontSize: `16px`,
                  color: "#FFFFFF",
                  position: "absolute",
                  bottom: `230px`,
                  left: `50%`,
                  transform: `translateX(-50%)`,
                }}
              >
                {evo.generation > 0 ? <>Parents: {evo.parents.map(n => `#${n.tokenId}`).join(" & ")}</> : "Genesis"}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: `300px`,
                  marginLeft: "auto",
                  marginRight: "auto",
                  top: `135px`,
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    width: "100%",
                    marginLeft: "16px",
                    marginRight: "16px",
                    height: "4px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#51FFFE",
                      width: `${percentComplete > 100 ? 100 : percentComplete}%`,
                      height: "100%",
                    }}
                  />
                </div>
              </div>
            </div>

          ) : (
            <div
              style={{
                width: "350px",
                height: `64px`,
                position: "absolute",
                bottom: "148px",
                left: "50%",
                transform: "translateX(-50%)",
                paddingLeft: `8px`,
                display: "flex",
                justifyItems: "center",
                flexWrap: "wrap",
              }}
            >
              <GenItem stat="HP" value={50} />
              <GenItem stat="ATK" value={evo.attack} />
              <GenItem stat="SP" value={evo.special} />
              <GenItem stat="DEF" value={evo.defense} />
              <GenItem stat="RES" value={evo.resistance} />
              <GenItem stat="SPD" value={evo.speed} />
            </div>
          )}
          <p
            style={{
              fontFamily: "Nunito",
              fontWeight: 900,
              position: "absolute",
              fontSize: `16px`,
              color: "#FFFFFF",
              left: `50%`,
              transform: `translateX(-50%)`,
              bottom: `88px`,
            }}
          >
            {isEgg ? evo.treated ? "Treated" : "Untreated" : `${evo.generation === 0
              ? "Total Breeds"
              : "Breeds Left"}: ${evo.generation === 0 ? evo.totalBreeds : 5 - evo.totalBreeds}`}
          </p>
          <p
            style={{
              fontFamily: "Nunito",
              color: "#000000",
              fontWeight: "900",
              fontSize: `16px`,
              position: "absolute",
              bottom: `83px`,
              right: `32px`,
              display: "flex",
            }}
          >
            #{evo.tokenId}
          </p>
          <p
            style={{
              fontFamily: "Nunito",
              color: "#000000",
              fontWeight: "900",
              fontSize: `16px`,
              position: "absolute",
              bottom: `37px`,
              right: `32px`,
              display: "flex",
            }}
          >
            Generation {evo.generation}
          </p>
          {evo.types.primary && evo.types.primary !== "None" && (
            <img
              src={`${baseUrl}${getElementSvg(evo.types.primary).src}`}
              style={{
                position: "absolute",
                width: `28px`,
                height: `28px`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain",
                bottom: `10px`,
                right: `10px`,
              }}
              alt="type"
            />
          )}
        </div>
      ),
      {
        width: 512,
        height: 725,
        fonts: [
          { name: "Nunito", data: nunito, weight: 400, style: "normal" },
          { name: "Nunito", data: nunitoSemiBold, weight: 500, style: "normal" },
          { name: "Nunito", data: nunitoBold, weight: 900, style: "normal" },
        ],
      },
    )
      ;
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, { status: 500 });
  }

};

const GenItem = ({ stat, value }: { stat: StatAbbrev, value: number }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: "32px",
        width: "110px",
      }}
    >
      <p
        style={{
          textAlign: "right",
          fontFamily: "Nunito",
          fontWeight: 900,
          fontSize: `16px`,
          color: "#FFF",
          margin: 0,
          padding: 0,
        }}
      >
        {stat}:
      </p>
      <p
        style={{
          textAlign: "right",
          fontFamily: "Nunito",
          fontWeight: 900,
          fontSize: `16px`,
          margin: 0,
          marginLeft: "4px",
          padding: 0,
        }}
      >
        <span style={{ color: `rgb(255, 215, 0)` }}>{value}</span>
      </p>
    </div>
  );
};
