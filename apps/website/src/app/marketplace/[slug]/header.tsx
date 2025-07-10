import EvoBannerOpensea from "@/assets/collections/evos/banner.png";
import { collections } from "@/data/collections";
import { Slug } from "@/types/core";

const CollectionHeader = ({ slug }: { slug: Slug }) => {
  const collection = collections.find(c => c.slug.startsWith(slug))!;
  const rawStats =
    { total: { volume: 0, sales: 0, average_price: 0, num_owners: 0, floor_price: 0, floor_price_symbol: "" } };

  const stats = [
    { title: "Floor Price", value: rawStats.total.floor_price, suffix: true },
    { title: "Top Offer", value: rawStats.total.floor_price, suffix: true },
    { title: "Total Volume", value: rawStats.total.volume, suffix: true },
    { title: "Listed", value: rawStats.total.sales },
    { title: "Owners (Unique)", value: rawStats.total.num_owners },
  ];
  return (
    <div
      className="sticky pb-2 -top-50 h-80 p-4 bg-cover bg-center z-10 dark"
      style={{ backgroundImage: `url(${EvoBannerOpensea.src})` }}
    >
      <div className="flex h-full justify-between items-end ">
        <div className="sm:max-w-[50%]">
          <h1>{collection.name}</h1>
          <h4>{collection.description}</h4>
        </div>
        <div className="hidden sm:flex space-x-4 items-end">
          {stats.map(s => (
            <div className="flex flex-col text-right gap-1" key={s.title}>
              <span className="text-muted-foreground">{s.title}</span>
              <span className="font-semibold">
                {Number(s.value.toFixed(2))} {s.suffix ? "EVO" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
CollectionHeader.displayName = "CollectionHeader";

export { CollectionHeader };
