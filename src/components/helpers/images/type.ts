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

export const getTypeImage = (type: string) => {
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
      return '';
  }
};
