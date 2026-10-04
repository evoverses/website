import type { Metadata } from "next";
import { KeeperHeader } from "@/components/nursery/keeper-header";
import { Breeder } from "@/components/nursery/breeder";
export const metadata: Metadata = { title: "Breeder Bertha" };
export default function BerthaPage() {
  return (
    <main className="page max-w-6xl mx-auto px-4 py-8 sm:px-8">
      <KeeperHeader keeper="bertha">
        Choose two compatible Evos from your wallet. Bertha will take care of
        the rest.
      </KeeperHeader>
      <Breeder />
    </main>
  );
}
