import CAir from '@/assets/evo/types/Colored_Air_Type_Circle.svg';
import CBug from '@/assets/evo/types/Colored_Bug_Type_Circle.svg';
import CCorrupt from '@/assets/evo/types/Colored_Corrupt_Type_Circle.svg';
import CDark from '@/assets/evo/types/Colored_Dark_Type_Circle.svg';
import CEarthly from '@/assets/evo/types/Colored_Earthly_Type_Circle.svg';
import CEther from '@/assets/evo/types/Colored_Ether_Type_Circle.svg';
import CFire from '@/assets/evo/types/Colored_Fire_Type_Circle.svg';
import CLight from '@/assets/evo/types/Colored_Light_Type_Circle.svg';
import CMineral from '@/assets/evo/types/Colored_Mineral_Type_Circle.svg';
import CMonster from '@/assets/evo/types/Colored_Monster_Type_Circle.svg';
import CPlant from '@/assets/evo/types/Colored_Plant_Type_Circle.svg';
import CWater from '@/assets/evo/types/Colored_Water_Type_Circle.svg';
import { Type } from '@/components/evo-card/types';

export const getTypeImage = (type: Type) => {
  switch (type) {
    case Type.Monster:
      return CMonster;
    case Type.Bug:
      return CBug;
    case Type.Mineral:
      return CMineral;
    case Type.Ether:
      return CEther;
    case Type.Corrupt:
      return CCorrupt;
    case Type.Earth:
      return CEarthly;
    case Type.Air:
      return CAir;
    case Type.Water:
      return CWater;
    case Type.Fire:
      return CFire;
    case Type.Dark:
      return CDark;
    case Type.Light:
      return CLight;
    case Type.Plant:
      return CPlant;
    default:
      return '';
  }
};
