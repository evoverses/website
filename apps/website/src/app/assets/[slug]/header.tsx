import EvoBannerOpensea from "@/assets/collections/evos/banner.png";
import { getCollectionMetadata } from "@/lib/evoverses/metadata";
import { getOpenSeaCollectionStats } from "@/lib/opensea";
import { Slug } from "@/types/core";

const CollectionHeader = async ({ slug }: { slug: Slug }) => {
  const [ collection, rawStats ] = await Promise.all([
    getCollectionMetadata("evo"),
    getOpenSeaCollectionStats(`evoverses-${slug}`),
  ]);

  const stats = [
    { title: "Volume", value: rawStats.total.volume, suffix: true },
    { title: "Sales", value: rawStats.total.sales },
    { title: "Avg. Price", value: rawStats.total.average_price, suffix: true },
    { title: "Owners", value: rawStats.total.num_owners },
    { title: "Floor Price", value: rawStats.total.floor_price, suffix: true },
  ];
  return (
    <div
      className="flex justify-between h-80 items-end p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${EvoBannerOpensea.src})` }}
    >
      <div className="sm:max-w-[50%]">
        <h1>{collection.name}</h1>
        <h4>{collection.description}</h4>
      </div>
      <div className="hidden sm:flex space-x-4 items-end">
        {stats.map(s => (
          <div className="flex flex-col" key={s.title}>
            <h5>
              {Number(s.value.toFixed(2))} {s.suffix ? rawStats.total.floor_price_symbol : ""}
            </h5>
            <h4>{s.title}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};
CollectionHeader.displayName = "CollectionHeader";

export { CollectionHeader };
