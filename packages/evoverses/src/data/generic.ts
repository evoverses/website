import { Element } from "@workspace/database/types/evo";

type HexColor = `#${string}`;
export const elementColorMap: Record<Element, HexColor> = {
  [Element.bug]: "#347C3E",
  [Element.air]: "#A7C1F2",
  [Element.dark]: "#350079",
  [Element.earth]: "#904808",
  [Element.ether]: "#F6D407",
  [Element.water]: "#0DC2E7",
  [Element.mineral]: "#E63AEA",
  [Element.fire]: "#CE3311",
  [Element.monster]: "#B7295B",
  [Element.plant]: "#598C15",
  [Element.light]: "#FFAB08",
  [Element.corrupt]: "#7C169B",
  [Element.none]: "#000000",
};
