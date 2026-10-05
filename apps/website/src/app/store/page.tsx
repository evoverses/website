import type { Metadata } from "next";
import EvorosStore from "@/components/store/evoros-store";

export const metadata: Metadata = {
  title: "Evoros Store",
  description:
    "Choose Evoros bundles for the EvoVerses in-game shop. Pay with EVO or by card when purchases open.",
  alternates: { canonical: "/store" },
};
export default function StorePage() {
  return <EvorosStore />;
}
