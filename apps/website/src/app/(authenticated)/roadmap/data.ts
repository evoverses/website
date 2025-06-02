import type { Species } from "@/lib/evoverses/types";

export const currentGroup = 6;

export const animations = [ "idle", "attack", "special", "dash", "backUp", "hit", "death" ] as const;
export type Animation = typeof animations[number];

export type EvoAnimationProgress = {
  id: number
  species: Species
} & { [k in Animation]?: boolean }

export const groups: Species[][] = [
  [ "Tamandu", "Skycyx" ],
  [ "Ruard", "Dhaek", "Nythe", "Struthor", "Geckaiba" ],
  [ "Shazark", "Sunopendra", "Hikarul", "Aubelyon", "Kaos" ],
  [ "Onydae", "Mobyd", "Ghorgon", "Nymphel", "Cyarabat" ],
  [ "Eulocelus", "Venuserpien", "Methyst", "Tytan", "Moffunap" ],
  [ "Nissel", "Finantis", "Allacrow", "Fayde", "Yotnar" ],
  [ "Karoite", "Nuvea", "Ainepolux", "Morphee", "Metheo" ],
  [ "Hodeon", "Rattuos", "Tokaleaf", "Flint", "Lamphal" ],
  [ "Lumi", "Droserace", "Clocarstone", "Fugush", "Obsy" ],
  [ "Gwenbee", "Uzumebach", "Meissa", "Athel", "Sauderon" ],
  [ "Mellio", "Ryomizu", "Beldar", "Lounn", "Fluozacil" ],
  [ "Kapryno", "Firemon", "Kerval", "Espyke", "Gemarites" ],
  [ "Arnoriel", "Adhamandra", "Obryos", "Krokon", "Caerthos" ],
  [ "Jokull", "Istral", "Cyzorak" ],
];

export const inProgress: Species[] = groups[currentGroup];

const originalData: EvoAnimationProgress[] = [
  { id: 1, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Nissel" },
  { id: 2, idle: true, attack: true, hit: true, species: "Finantis" },
  { id: 3, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Karoite" },
  { id: 4, species: "Nuvea" },
  { id: 5, species: "Hodeon" },
  { id: 6, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Eulocelus" },
  { id: 7, species: "Arnoriel" },
  { id: 9, idle: true, attack: true, backUp: true, hit: true, death: true, species: "Carcoid" },
  { id: 10, idle: true, species: "Adhamandra" },
  { id: 11, idle: true, dash: true, backUp: true, hit: true, special: true, species: "Ainepolux" },
  { id: 12, idle: true, species: "Kapryno" },
  { id: 13, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Kitsul" },
  { id: 15, species: "Rattuos" },
  { id: 16, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Beldar" },
  { id: 19, species: "Firemon" },
  { id: 20, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Obryos" },
  { id: 22, species: "Lumi" },
  { id: 25, species: "Onydae" },
  { id: 26, idle: true, species: "Skycyx" },
  { id: 28, idle: true, attack: true, backUp: true, species: "Droserace" },
  { id: 30, species: "Kerval" },
  { id: 33, idle: true, dash: true, backUp: true, hit: true, special: true, species: "Gwenbee" },
  { id: 34, species: "Shazark" },
  { id: 35, idle: true, species: "Krokon" },
  { id: 37, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Clocarstone" },
  { id: 39, idle: true, species: "Tokaleaf" },
  { id: 40, species: "Sunopendra" },
  { id: 42, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Yotnar" },
  { id: 43, species: "Hikarul" },
  { id: 45, species: "Aubelyon" },
  { id: 46, idle: true, species: "Flint" },
  { id: 48, species: "Venuserpien" },
  { id: 50, species: "Espyke" },
  { id: 51, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Mobyd" },
  { id: 53, idle: true, species: "Ghorgon" },
  { id: 54, species: "Mellio" },
  { id: 55, species: "Fugush" },
  { id: 56, idle: true, species: "Morphee" },
  { id: 59, idle: true, special: true, species: "Lounn" },
  { id: 61, idle: true, attack: true, dash: true, backUp: true, hit: true, species: "Uzumebach" },
  { id: 63, idle: true, species: "Gemarites" },
  { id: 64, species: "Methyst" },
  { id: 66, idle: true, species: "Tamandu" },
  { id: 68, species: "Tytan" },
  { id: 69, species: "Moffunap" },
  { id: 70, idle: true, species: "Nymphel" },
  { id: 75, species: "Allacrow" },
  { id: 77, species: "Jokull" },
  { id: 78, idle: true, special: true, species: "Vulpyro" },
  { id: 81, species: "Fayde" },
  { id: 83, idle: true, species: "Ruard" },
  { id: 84, species: "Caerthos" },
  { id: 85, species: "Ryomizu" },
  { id: 86, idle: true, species: "Obsy" },
  { id: 89, idle: true, species: "Dhaek" },
  { id: 91, idle: true, species: "Metheo" },
  { id: 93, idle: true, species: "Nythe" },
  { id: 96, idle: true, species: "Meissa" },
  { id: 97, species: "Fluozacil" },
  { id: 100, species: "Cyarabat" },
  { id: 102, species: "Struthor" },
  { id: 103, species: "Istral" },
  { id: 106, species: "Cyzorak" },
  { id: 109, idle: true, dash: true, backUp: true, hit: true, special: true, species: "Kaos" },
  { id: 117, idle: true, dash: true, backUp: true, hit: true, special: true, species: "Athel" },
  { id: 120, idle: true, hit: true, special: true, species: "Lamphal" },
  { id: 122, species: "Geckaiba" },
  { id: 125, species: "Sauderon" },
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
