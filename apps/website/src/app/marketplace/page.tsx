import { collections } from "@/data/collections";
import { Button } from "@workspace/ui/components/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { StoreIcon } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marketplace",
};

const AssetsPage = () => {

  return (
    <main className="min-h-[80cqh] flex flex-col items-center justify-around pt-6 pb-4 page sm:px-24">
      <div className="flex flex-col sm:flex-row gap-8">
        {collections.map(c => {
          return (
            <Card key={c.slug} className="w-87.5 pt-0 overflow-hidden">
              <Image
                src={c.images.avatar}
                alt={c.name}
                className="size-87.5"
              />
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto flex flex-col gap-2">
                <Button
                  className="w-full font-bold"
                  asChild={!c.features.comingSoon}
                  disabled={c.features.comingSoon}
                >
                  {c.features.comingSoon ? "Coming Soon" : (
                    <Link href={`/marketplace/${c.slug}`}>
                      <StoreIcon />
                      <span>Explore {c.name}</span>
                    </Link>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
};

export default AssetsPage;
