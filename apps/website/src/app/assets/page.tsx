import { collections } from "@/data/collections";
import { marketplaces } from "@/data/links";
import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Collections",
};

const AssetsPage = () => {

  return (
    <main className="flex flex-grow flex-col items-center justify-around pt-6 px-4 sm:px-24">
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
                {!c.features.comingSoon && (
                  <div className="w-full flex gap-2">
                    {marketplaces.map(({ icon: Icon, href, buttonClassName }, key) => (
                      <Button key={key} className={cn("flex-1", buttonClassName)} asChild>
                        <Link href={href} referrerPolicy="no-referrer" target="_blank" prefetch={false}>
                          <Icon className={cn("h-6 w-6")} />
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
                <Button
                  className="w-full font-bold"
                  asChild={!c.features.comingSoon}
                  disabled={c.features.comingSoon}
                >
                  {c.features.comingSoon ? "Coming Soon" : (
                    <Link href={`/collection/${c.slug}`}>
                      Explore {c.name}
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
//         {comingSoonCollections.map(collection => {
//           const name = collection.name.replace("EvoVerses", "").trim();
//           return (
//             <Card key={collection.collection} className="w-87.5 flex flex-col pt-0 overflow-hidden">
//               <Image
//                 src={collection.image_url}
//                 alt={collection.name}
//                 width={350}
//                 height={350}
//               />
//               <CardHeader>
//                 <CardTitle>{name}s</CardTitle>
//                 <CardDescription>{collection.description}</CardDescription>
//               </CardHeader>
//               <CardFooter className="mt-auto">
//                 <Button disabled className="w-full font-bold">
//                   Mint Coming Soon!
//                 </Button>
//               </CardFooter>
//             </Card>
//           );
//         })}
