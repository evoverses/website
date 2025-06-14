import type { Species } from "@/lib/evoverses/types";

export const currentGroup = 6;

export const animations = [ "idle", "attack", "special", "dash", "backUp", "hit", "death" ] as const;
export type Animation = typeof animations[number];

export type EvoAnimationProgress = {
  id: number
  species: Species
} & { [k in Animation]?: boolean }

export const groups: Species[][] = [
  [ "tamandu", "skycyx" ],
  [ "ruard", "dhaek", "nythe", "struthor", "geckaiba" ],
  [ "shazark", "sunopendra", "hikarul", "aubelyon", "kaos" ],
  [ "onydae", "mobyd", "ghorgon", "nymphel", "cyarabat" ],
  [ "eulocelus", "venuserpien", "methyst", "tytan", "moffunap" ],
  [ "nissel", "finantis", "allacrow", "fayde", "yotnar" ],
  [ "karoite", "nuvea", "ainepolux", "morphee", "metheo" ],
  [ "hodeon", "rattuos", "tokaleaf", "flint", "lamphal" ],
  [ "lumi", "droserace", "clocarstone", "fugush", "obsy" ],
  [ "gwenbee", "uzumebach", "meissa", "athel", "sauderon" ],
  [ "mellio", "ryomizu", "beldar", "lounn", "fluozacil" ],
  [ "kapryno", "firemon", "kerval", "espyke", "gemarites" ],
  [ "arnoriel", "adhamandra", "obryos", "krokon", "caerthos" ],
  [ "jokull", "istral", "cyzorak" ],
];

export const inProgress: Species[] = groups[currentGroup]!;

const originalData: EvoAnimationProgress[] = [
  { id: 1, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "nissel" },
  { id: 2, idle: true, attack: true, hit: true, species: "finantis" },
  { id: 3, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "karoite" },
  { id: 4, species: "nuvea" },
  { id: 5, species: "hodeon" },
  { id: 6, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "eulocelus" },
  { id: 7, species: "arnoriel" },
  { id: 9, idle: true, attack: true, backUp: true, hit: true, death: true, species: "carcoid" },
  { id: 10, idle: true, species: "adhamandra" },
  { id: 11, idle: true, dash: true, backUp: true, hit: true, special: true, species: "ainepolux" },
  { id: 12, idle: true, species: "kapryno" },
  { id: 13, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "kitsul" },
  { id: 15, species: "rattuos" },
  { id: 16, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "beldar" },
  { id: 19, species: "firemon" },
  { id: 20, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "obryos" },
  { id: 22, species: "lumi" },
  { id: 25, species: "onydae" },
  { id: 26, idle: true, species: "skycyx" },
  { id: 28, idle: true, attack: true, backUp: true, species: "droserace" },
  { id: 30, species: "kerval" },
  { id: 33, idle: true, dash: true, backUp: true, hit: true, special: true, species: "gwenbee" },
  { id: 34, species: "shazark" },
  { id: 35, idle: true, species: "krokon" },
  { id: 37, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "clocarstone" },
  { id: 39, idle: true, species: "tokaleaf" },
  { id: 40, species: "sunopendra" },
  { id: 42, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "yotnar" },
  { id: 43, species: "hikarul" },
  { id: 45, species: "aubelyon" },
  { id: 46, idle: true, species: "flint" },
  { id: 48, species: "venuserpien" },
  { id: 50, species: "espyke" },
  { id: 51, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "mobyd" },
  { id: 53, idle: true, species: "ghorgon" },
  { id: 54, species: "mellio" },
  { id: 55, species: "fugush" },
  { id: 56, idle: true, species: "morphee" },
  { id: 59, idle: true, special: true, species: "lounn" },
  { id: 61, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "uzumebach" },
  { id: 63, idle: true, species: "gemarites" },
  { id: 64, species: "methyst" },
  { id: 66, idle: true, species: "tamandu" },
  { id: 68, species: "tytan" },
  { id: 69, species: "moffunap" },
  { id: 70, idle: true, species: "nymphel" },
  { id: 75, species: "allacrow" },
  { id: 77, species: "jokull" },
  { id: 78, idle: true, special: true, species: "vulpyro" },
  { id: 81, species: "fayde" },
  { id: 83, idle: true, species: "ruard" },
  { id: 84, species: "caerthos" },
  { id: 85, species: "ryomizu" },
  { id: 86, idle: true, species: "obsy" },
  { id: 89, idle: true, species: "dhaek" },
  { id: 91, idle: true, species: "metheo" },
  { id: 93, idle: true, species: "nythe" },
  { id: 96, idle: true, species: "meissa" },
  { id: 97, species: "fluozacil" },
  { id: 100, species: "cyarabat" },
  { id: 102, species: "struthor" },
  { id: 103, species: "istral" },
  { id: 106, species: "cyzorak" },
  { id: 109, idle: true, dash: true, backUp: true, hit: true, special: true, species: "kaos" },
  { id: 117, idle: true, dash: true, backUp: true, hit: true, special: true, species: "athel" },
  { id: 120, idle: true, hit: true, special: true, species: "lamphal" },
  { id: 122, species: "geckaiba" },
  { id: 125, species: "sauderon" },
];

const findGroupOfEvo = (e: EvoAnimationProgress) => groups.indexOf(groups.find(g => g.includes(e.species as Species))!);

export const isComplete = (e: EvoAnimationProgress) => findGroupOfEvo(e) < currentGroup;

export const data = originalData.map(e => {
  const eap: EvoAnimationProgress & { group: number } = { ...e, group: findGroupOfEvo(e) };
  animations.forEach(a => {
    if (!(
      a in eap
    )) {
      eap[a] = false;
    }
  });
  const result = eap.group < currentGroup ? Object.entries(eap)
    .reduce((acc, [ k, v ]) => (
      { ...acc, [k]: typeof v === "boolean" ? true : v }
    )) : eap;
  return result as Required<EvoAnimationProgress>;
});
