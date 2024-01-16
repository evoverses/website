import Female from "@/assets/evo/Female.svg";
import Male from "@/assets/evo/Male.svg";

import CAir from "@/assets/evo/types/Colored_Air_Type_Circle.svg";
import CBug from "@/assets/evo/types/Colored_Bug_Type_Circle.svg";
import CCorrupt from "@/assets/evo/types/Colored_Corrupt_Type_Circle.svg";
import CDark from "@/assets/evo/types/Colored_Dark_Type_Circle.svg";
import CEarthly from "@/assets/evo/types/Colored_Earthly_Type_Circle.svg";
import CEther from "@/assets/evo/types/Colored_Ether_Type_Circle.svg";
import CFire from "@/assets/evo/types/Colored_Fire_Type_Circle.svg";
import CLight from "@/assets/evo/types/Colored_Light_Type_Circle.svg";
import CMineral from "@/assets/evo/types/Colored_Mineral_Type_Circle.svg";
import CMonster from "@/assets/evo/types/Colored_Monster_Type_Circle.svg";
import CPlant from "@/assets/evo/types/Colored_Plant_Type_Circle.svg";
import CWater from "@/assets/evo/types/Colored_Water_Type_Circle.svg";

export const getElementSvg = (type: string) => {
  switch (type) {
    case "Monster":
      return CMonster;
    case "Bug":
      return CBug;
    case "Mineral":
      return CMineral;
    case "Ether":
      return CEther;
    case "Corrupt":
      return CCorrupt;
    case "Earth":
      return CEarthly;
    case "Air":
      return CAir;
    case "Water":
      return CWater;
    case "Fire":
      return CFire;
    case "Dark":
      return CDark;
    case "Light":
      return CLight;
    case "Plant":
      return CPlant;
    default:
      return "";
  }
};
export const getGenderImage = (gender: string) => gender === "Male" ? Male.src : Female.src;

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export const getShimmer = (w: number, h: number): `data:image/${string}` => `data:image/svg+xml;base64,${toBase64(
  shimmer(w, h))}`;
