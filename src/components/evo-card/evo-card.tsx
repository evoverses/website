/* eslint-disable @next/next/no-img-element */
import EvoToken from "@/assets/images/evo-token.png";
import { IEgg, IEvo } from "@/components/evo-card/types";
import { getGenderImage, getIDColor, getLevelOfEvo, getTypeImage } from "@/components/helpers";

import { GenItem } from "./GenItem";

export interface EvoCardProps {
  multiplier?: number;
  evo: IEvo;
  useVideo?: boolean;
  baseUrl?: string;
}

const OldChromaMap: Record<string, string> = {
  None: "Normal",
  Chroma: "Chroma",
  Super: "Epic",
};

export const EvoCardPng = ({ multiplier = 1, evo, baseUrl = "http://localhost:3000" }: EvoCardProps) => {
  const imageCDN = "https://images.evoverses.com/card";
  const rawCDN = "https://imagedelivery.net/rnUCH_14xCvfZoyELQslRQ";
  const egg: IEgg = evo as unknown as IEgg;
  const isEgg = "treated" in egg;
  const ageSeconds = Math.floor(Date.now() / 1000) - egg?.createdAt;
  const percentComplete = ageSeconds * 100 / 28800;
  const ageDays = Math.floor(ageSeconds / 86400);
  const characterUrl = `${imageCDN}/evo/${evo.species}/${isEgg
    ? evo.generation === 0 ? evo.tokenId % 4 : "egg"
    : OldChromaMap[evo.attributes.chroma]}`;

  console.log(evo);
  console.log(characterUrl);
  return (
    <div
      id="container"
      style={{
        width: 512 * multiplier,
        height: 725 * multiplier,
        borderRadius: 20 * multiplier,
        position: "relative",
        display: "flex",
      }}
    >
      <img
        id="background"
        src={`${imageCDN}/background/${evo.attributes.primaryType}`}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 30 * multiplier,
          position: "absolute",
          top: 0,
          left: 0,
        }}
        alt="background"
      />
      <img
        id="evo"
        src={characterUrl}
        style={{
          position: "absolute",
          width: `${512 * multiplier}px`,
          height: `${(
            isEgg ? 512 : 725
          ) * multiplier}px`,
          bottom: `${(
            isEgg ? 240 : 80
          ) * multiplier}px`,
        }}
        alt="evo image"
      />
      <img
        id="border"
        style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
        src={`${rawCDN}/card/border/${{
          None: "silver",
          Chroma: "purple",
          Super: "gold",
        }[isEgg ? "None" : String(evo.attributes.chroma)]}-metallic/4/public`}
        alt="border"
      />
      <img
        id="logo"
        src={`${baseUrl}${EvoToken.src}`}
        alt="gender"
        style={{
          position: "absolute",
          width: `${28 * multiplier}px`,
          height: `${28 * multiplier}px`,
          top: `${10 * multiplier}px`,
          left: `${10 * multiplier}px`,
        }}
      />
      <p
        id="species"
        style={{
          fontFamily: "Nunito",
          color: "#FFFFFF",
          fontWeight: "900",
          fontSize: `${16 * multiplier}px`,
          position: "absolute",
          top: `${35 * multiplier}px`,
          left: `${32 * multiplier}px`,
        }}
      >
        {isEgg && evo.generation === 0 ? "Genesis Unknown" : evo.species}
      </p>
      {[ evo.attributes.primaryType, evo.attributes.secondaryType ]
        .filter(s => s !== "None")
        .reverse()
        .map((t, i, a) => (
          <img
            key={`type-${t}`}
            id={`type-${t}`}
            src={`${baseUrl}${getTypeImage(t).src}`}
            alt="Species"
            style={{
              position: "absolute",
              display: "flex",
              width: `${18 * multiplier}px`,
              height: `${18 * multiplier}px`,
              top: `${54 * multiplier}px`,
              left: a.length === 1 ? `${155 * multiplier}px` : `${(
                i === 0 ? 162 : 148
              ) * multiplier}px`,
            }}
          />
        ))}
      {!isEgg && (
        <img
          src={`${baseUrl}${getGenderImage(evo.attributes.gender)}`}
          alt="gender"
          style={{
            position: "absolute",
            width: `${16 * multiplier}px`,
            height: `${16 * multiplier}px`,
            top: `${56 * multiplier}px`,
            left: `${120 * multiplier}px`,
          }}
        />
      )}
      <p
        id="level-info"
        style={{
          fontFamily: "Nunito",
          color: "#FFFFFF",
          fontWeight: "900",
          fontSize: `${16 * multiplier}px`,
          position: "absolute",
          top: `${85 * multiplier}px`,
          left: `${32 * multiplier}px`,
        }}
      >
        {isEgg ? "Egg" : `Level ${getLevelOfEvo(evo)}`}
      </p>
      <img
        id="info-overlay"
        style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, opacity: 0.8, filter: "invert(100%)" }}
        src={`${rawCDN}/card/overlay/info-island/public`}
        alt="info-overlay-bg"
      />
      <p
        style={{
          fontFamily: "Nunito",
          fontWeight: 900,
          color: "#FFF",
          position: "absolute",
          fontSize: `${16 * multiplier}px`,
          left: "50%",
          transform: "translateX(-50%)",
          top: `${395 * multiplier}px`,
        }}
      >
        {isEgg ? `Age: ${ageDays} Day${ageDays === 1 ? "" : "s"}` : evo.attributes.nature}
      </p>
      {isEgg ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            maxWidth: `${300 * multiplier}px`,
            marginLeft: "auto",
            marginRight: "auto",
            top: `${65 * multiplier}px`,
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontFamily: "Nunito",
              fontWeight: 900,
              fontSize: `${16 * multiplier}px`,
              color: "rgba(255,255,255, 1)",
              position: "absolute",
              bottom: `${300 * multiplier}px`,
              left: `50%`,
              transform: `translateX(-50%)`,
            }}
          >
            {egg.generation > 0 ? <>Parents: {egg.parents.map(n => `#${n}`).join(" & ")}</> : "Genesis"}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              maxWidth: `${300 * multiplier}px`,
              marginLeft: "auto",
              marginRight: "auto",
              top: `${65 * multiplier}px`,
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
            width: `${350 * multiplier}px`,
            height: `${64 * multiplier}px`,
            position: "absolute",
            bottom: `${207.5 * multiplier}px`,
            left: "50%",
            transform: "translateX(-50%)",
            paddingLeft: `${8 * multiplier}px`,
            display: "flex",
            justifyItems: "center",
            flexWrap: "wrap",
          }}
        >
          <GenItem multiplier={multiplier} genName="HP" genValue={evo.stats.health} />
          <GenItem multiplier={multiplier} genName="ATK" genValue={evo.stats.attack} />
          <GenItem multiplier={multiplier} genName="SP" genValue={evo.stats.special} />
          <GenItem multiplier={multiplier} genName="DEF" genValue={evo.stats.defense} />
          <GenItem multiplier={multiplier} genName="RES" genValue={evo.stats.resistance} />
          <GenItem multiplier={multiplier} genName="SPD" genValue={evo.stats.speed} />
        </div>
      )}
      <p
        style={{
          fontFamily: "Nunito",
          fontWeight: 900,
          position: "absolute",
          fontSize: `${16 * multiplier}px`,
          color: "#FFF",
          left: `50%`,
          transform: `translateX(-50%)`,
          bottom: `${148 * multiplier}px`,
        }}
      >
        {isEgg
          ? egg.treated ? "Treated" : "Untreated"
          : `${evo.generation === 0 ? "Total Breeds" : "Breeds Left"}: ${evo.generation === 0 ? evo.breeds.total : 5
            - evo.breeds.total}`}
      </p>
      <p
        style={{
          fontFamily: "Nunito",
          color: getIDColor(evo.attributes.chroma),
          fontWeight: "900",
          fontSize: `${16 * multiplier}px`,
          position: "absolute",
          bottom: `${83 * multiplier}px`,
          right: `${32 * multiplier}px`,
          display: "flex",
        }}
      >
        #{evo.tokenId.toLocaleString("en-us")}
      </p>
      <p
        style={{
          fontFamily: "Nunito",
          color: getIDColor(evo.attributes.chroma),
          fontWeight: "900",
          fontSize: `${16 * multiplier}px`,
          position: "absolute",
          bottom: `${37 * multiplier}px`,
          right: `${32 * multiplier}px`,
          display: "flex",
        }}
      >
        Generation {evo.generation}
      </p>
      {evo.attributes.primaryType !== "None" && (
        <img
          src={`${baseUrl}${getTypeImage(evo.attributes.primaryType).src}`}
          style={{
            position: "absolute",
            width: `${28 * multiplier}px`,
            height: `${28 * multiplier}px`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            bottom: `${10 * multiplier}px`,
            right: `${10 * multiplier}px`,
          }}
          alt="type"
        />
      )}
    </div>
  );
};
