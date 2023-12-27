import { Chroma } from "@/components/evo-card/types";

export const getNameColor = (chroma: string) => {
  switch (chroma) {
    case "Super":
      return '#2B3674';
    case "Chroma":
      return '#FFFFFF';
    case "None":
    default:
      return "#FFFFFF";
  }
};
export const getIDColor = (chroma: string) => {
  switch (chroma) {
    case "Super":
      return "#FFFFFF";
    case "Chroma":
      return "#FFFFFF";
    case "None":
    default:
      return 'rgba(0,0,0,1)';
  }
};
