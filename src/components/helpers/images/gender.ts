import Female from "@/assets/evo/Female.svg";
import Male from "@/assets/evo/Male.svg";

export const getGenderImage = (gender: string) => gender === "Male" ? Male.src : Female.src;
