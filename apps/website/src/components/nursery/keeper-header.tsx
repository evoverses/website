import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export function KeeperHeader({
  keeper,
  children,
}: {
  keeper: "bertha" | "hermann";
  children: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      <Link
        href="/nursery"
        className="inline-flex gap-2 items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to Nursery
      </Link>
      <div className="flex gap-5 items-center">
        <Image
          src={`/nursery/${keeper}.png?v=2`}
          alt={keeper === "bertha" ? "Breeder Bertha" : "Hatcher Hermann"}
          width={96}
          height={96}
          className="size-20 sm:size-24 object-cover rounded-2xl"
          priority
        />
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black">
            {keeper === "bertha" ? "Breeder Bertha" : "Hatcher Hermann"}
          </h1>
          <p className="text-muted-foreground max-w-xl">{children}</p>
        </div>
      </div>
      <nav aria-label="Nursery" className="flex gap-5 mt-6 text-sm font-bold">
        <Link
          href="/nursery/bertha"
          aria-current={keeper === "bertha" ? "page" : undefined}
          className={
            keeper === "bertha" ? "text-primary" : "text-muted-foreground"
          }
        >
          Breed Evos
        </Link>
        <Link
          href="/nursery/hermann"
          aria-current={keeper === "hermann" ? "page" : undefined}
          className={
            keeper === "hermann" ? "text-primary" : "text-muted-foreground"
          }
        >
          Treat &amp; hatch
        </Link>
      </nav>
    </header>
  );
}
