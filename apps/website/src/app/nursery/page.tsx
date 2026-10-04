import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@workspace/ui/components/card";
export const metadata: Metadata = {
  title: "Nursery",
  description:
    "Meet Breeder Bertha and Hatcher Hermann. A new beginning for your Evos.",
};
const keepers = [
  {
    name: "Breeder Bertha",
    image: "bertha",
    href: "/nursery/bertha",
    description:
      "Find the perfect pair. Bertha will help your Evos welcome a little one.",
    action: "Visit Bertha",
    detail: "Choose parents · Breed an egg",
  },
  {
    name: "Hatcher Hermann",
    image: "hermann",
    href: "/nursery/hermann",
    description:
      "A little care goes a long way. Let Hermann look after your next adventure.",
    action: "Visit Hermann",
    detail: "Treat eggs · Hatch your Evo",
  },
];
export default function NurseryPage() {
  return (
    <main className="page min-h-[80cqh] px-4 py-10 sm:py-14">
      <header className="text-center mb-10 space-y-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          A new beginning
        </p>
        <h1 className="text-4xl sm:text-5xl font-black">
          Welcome to the Nursery
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          From the perfect pair to the first little hatch. Your next Evo
          adventure starts here.
        </p>
      </header>
      <div className="flex flex-col sm:flex-row justify-center items-center sm:items-stretch gap-8">
        {keepers.map((keeper) => (
          <Card
            key={keeper.name}
            className="w-full max-w-87.5 pt-0 overflow-hidden"
          >
            <Link href={keeper.href} aria-label={keeper.action}>
              <Image
                src={`/nursery/${keeper.image}.png?v=2`}
                alt={
                  keeper.image === "bertha"
                    ? "Breeder Bertha, a cheerful anime nursery keeper holding an Evo egg"
                    : "Hatcher Hermann, a rugged keeper holding a newly hatched Kitsul in its eggshell"
                }
                width={1024}
                height={1024}
                priority
                className="w-full aspect-square object-cover"
              />
            </Link>
            <CardHeader>
              <p className="text-xs text-primary font-semibold">
                {keeper.detail}
              </p>
              <CardTitle className="text-2xl">{keeper.name}</CardTitle>
              <CardDescription>{keeper.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button className="w-full font-bold" asChild>
                <Link href={keeper.href}>{keeper.action}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
