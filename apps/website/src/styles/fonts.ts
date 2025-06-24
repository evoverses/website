import { cn } from "@workspace/ui/lib/utils";
import { Nunito, Sono } from "next/font/google";

const sans = Nunito({ subsets: [ "latin" ], variable: "--font-sans" });
const mono = Sono({ subsets: [ "latin" ], axes: [ "MONO" ], variable: "--font-mono" });

export const fontVariables = cn(sans.variable, mono.variable);
