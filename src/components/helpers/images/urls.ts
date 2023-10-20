import { Species, Type } from '@/components/evo-card/types';
import { getTypes } from "@/components/helpers";


export const getBGImageURL = (species: Species) => {
  return 'https://images.evoverses.com/card/background/' + Type.toString(getTypes(species)?.[0])
}
