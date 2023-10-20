import { Gender } from '@/components/evo-card/types';
import Male from '@/assets/evo/Male.svg';
import Female from '@/assets/evo/Female.svg';

export const getGenderImage = (gender: Gender) => gender === Gender.Male ? Male.src : Female.src;
