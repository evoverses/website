import { Nature, Stat } from '@/components/evo-card/types';

export const natureEffects = {
  [Nature.Dauntless]: {
    positive: Stat.Speed,
    negative: Stat.Defense
  },
  [Nature.Executive]: {
    positive: Stat.Speed,
    negative: Stat.Attack
  },
  [Nature.Restless]: {
    positive: Stat.Speed,
    negative: Stat.Resistance
  },
  [Nature.Nervous]: {
    positive: Stat.Speed,
    negative: Stat.Special
  },
  [Nature.Cunning]: {
    positive: Stat.Special,
    negative: Stat.Resistance
  },
  [Nature.Energetic]: {
    positive: Stat.Special,
    negative: Stat.Defense
  },
  [Nature.Clever]: {
    positive: Stat.Special,
    negative: Stat.Attack
  },
  [Nature.Confident]: {
    positive: Stat.Special,
    negative: Stat.Speed
  },
  [Nature.Ignorant]: {
    positive: Stat.Attack,
    negative: Stat.Special
  },
  [Nature.Arrogant]: {
    positive: Stat.Attack,
    negative: Stat.Defense
  },
  [Nature.Biting]: {
    positive: Stat.Attack,
    negative: Stat.Resistance
  },
  [Nature.Aggressive]: {
    positive: Stat.Attack,
    negative: Stat.Speed
  },
  [Nature.Patient]: {
  positive: Stat.Resistance,
    negative: Stat.Speed
  },
  [Nature.Mature]: {
    positive: Stat.Resistance,
    negative: Stat.Attack
  },
  [Nature.Sensible]: {
    positive: Stat.Resistance,
    negative: Stat.Defense
  },
  [Nature.Calm]: {
    positive: Stat.Resistance,
    negative: Stat.Special
  },
  [Nature.Rude]: {
    positive: Stat.Defense,
    negative: Stat.Special
  },
  [Nature.Cautious]: {
    positive: Stat.Defense,
    negative: Stat.Speed
  },
  [Nature.Curious]: {
    positive: Stat.Defense,
    negative: Stat.Resistance
  },
  [Nature.Discrete]: {
    positive: Stat.Defense,
    negative: Stat.Attack
  },
  [Nature.Loyal]: {
    positive: Stat.None,
    negative: Stat.None
  }
}

export const getNatureEffect = (nature: Nature, stat: Stat) => {
  const effects = natureEffects[nature];
  if (effects.positive === stat) {
    return 1;
  } else if (effects.negative === stat) {
    return -1;
  } else {
    return 0;
  }
}
