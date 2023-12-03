import { Viewer, ViewerLoading } from "@/app/(authenticated)/assets/[collection_slug]/viewer";
import EvoBannerOpensea from "@/assets/images/evo-banner-opensea.png";
import { getCollection, getCollectionStats, getContract } from "@/lib/opensea";

import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Assets",
};

const AssetPage = async ({ params: { collection_slug } }: { params: { collection_slug: string } }) => {
  const slug = `evoverses-${collection_slug}`;
  const [ collection, rawStats ] = await Promise.all([
    getCollection(slug),
    getCollectionStats(slug),
  ]);
  const contract = await getContract(collection.contracts[0].address, collection.contracts[0].chain);
  const name = collection.name.replace("EvoVerses", "").trim();
  const stats = [
    { title: "Volume", value: rawStats.total.volume, suffix: true },
    { title: "Sales", value: rawStats.total.sales },
    { title: "Avg. Price", value: rawStats.total.average_price, suffix: true },
    { title: "Owners", value: rawStats.total.num_owners },
    { title: "Floor Price", value: rawStats.total.floor_price, suffix: true },
  ];

  return (
    <main className="flex flex-col w-full p-4 sm:p-24 space-y-10">
      <div
        className="flex justify-between h-80 items-end p-4 bg-cover bg-center"
        style={{ backgroundImage: `url(${EvoBannerOpensea.src})` }}
      >
        <div className="sm:max-w-[50%]">
          <h1>{name}</h1>
          <h4>{collection.description}</h4>
        </div>
        <div className="hidden sm:flex space-x-4 items-end">
          {stats.map(s => (
            <div className="flex flex-col" key={s.title}>
              <h5>{Number(s.value.toFixed(2))} {s.suffix ? rawStats.total.floor_price_symbol : ""}</h5>
              <h4>Volume</h4>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Suspense fallback={<ViewerLoading />}>
          <Viewer contract={contract} />
        </Suspense>
      </div>
    </main>
  );
};

export default AssetPage;
