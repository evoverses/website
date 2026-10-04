import type { Metadata } from "next";
import { KeeperHeader } from "@/components/nursery/keeper-header";
import { Hatchery } from "@/components/nursery/hatchery";
export const metadata: Metadata = { title: "Hatcher Hermann" };
export default function HermannPage() {
  return (
    <main className="page max-w-7xl mx-auto px-4 py-8 sm:px-8">
      <KeeperHeader keeper="hermann">
        Your eggs, in good hands. Add a treatment, then hatch after three days
        of incubation.
      </KeeperHeader>
      <Hatchery />
    </main>
  );
}
