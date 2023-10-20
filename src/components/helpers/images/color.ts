import { Rarity } from '@/components/evo-card/types';

export const getNameColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.Epic:
      return '#2B3674';
    case Rarity.Chroma:
      return '#FFFFFF';
    case Rarity.Normal:
    default:
      return '#2B3674';
  }
};
export const getIDColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.Epic:
      return '#ffffffb5';
    case Rarity.Chroma:
      return '#ffffffb5';
    case Rarity.Normal:
    default:
      return 'rgba(0,0,0,1)';
  }
};
