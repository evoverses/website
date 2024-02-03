import FeaturedTrainer from "@/assets/images/featured-trainer.png";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { marketplaces } from "@/data/links";
import { getCollection } from "@/lib/opensea";
import { cn } from "@/lib/utils";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Assets",
};

const AssetsPage = async () => {
  const comingSoonCollections = [
    {
      name: "EvoVerses Trainer",
      description: "The most powerful beings in the universe, able to catch, train, and battle with Evos! Available soon...",
      collection: "evoverses-trainer",
      image_url: FeaturedTrainer,
    },
  ];
  const collectionSlugs = [ "evoverses-evo" ];
  const collections = await Promise.all(collectionSlugs.map(slug => getCollection(slug)));
  return (
    <main className="flex flex-grow flex-col items-center justify-around pt-6 px-4 sm:px-24">
      <div className="flex flex-col sm:flex-row gap-8">
        {collections.map(collection => {
          const name = collection.name.replace("EvoVerses", "").trim();
          return (
            <Card key={collection.collection} className="w-[350px]">
              <Image
                className="rounded-t-xl"
                src={collection.image_url}
                alt={collection.name}
                width={350}
                height={350}
              />
              <CardHeader>
                <CardTitle>{name}</CardTitle>
                <CardDescription>{collection.description}</CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-2">
                <div className="w-full flex gap-2">
                  {marketplaces.map(({ icon: Icon, href, buttonClassName }, key) => (
                    <Button key={key} className={cn("w-full", buttonClassName)} asChild>
                      <Link href={href} referrerPolicy="no-referrer" target="_blank" prefetch={false}>
                        <Icon className={cn("h-6 w-6")} />
                      </Link>
                    </Button>
                  ))}
                </div>

                <Link href={`/assets/${collection.collection.replace("evoverses-", "")}`} legacyBehavior>
                  <Button className="w-full font-bold">
                    Explore {name}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
        {comingSoonCollections.map(collection => {
          const name = collection.name.replace("EvoVerses", "").trim();
          return (
            <Card key={collection.collection} className="w-[350px] flex flex-col">
              <Image
                className="rounded-t-xl"
                src={collection.image_url}
                alt={collection.name}
                width={350}
                height={350}
              />
              <CardHeader>
                <CardTitle>{name}s</CardTitle>
                <CardDescription>{collection.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button disabled className="w-full font-bold">
                  Mint Coming Soon!
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
