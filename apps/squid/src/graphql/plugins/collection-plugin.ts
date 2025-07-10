import { PoolClient } from "pg";
import { gql, makeExtendSchemaPlugin } from "postgraphile";
import { mapCurrencyRow } from "./utils";

export const CollectionPlugin = makeExtendSchemaPlugin(() => (
{
  typeDefs: gql`
    type CollectionMetadataEntity {
      chainId: String!
      address: String!
      name: String
      slug: String
      description: String
      avatar: String
      banner: String
      featuredImage: String
      website: String
      category: String
      owner: String
      creator: String
      verified: Boolean
      nsfw: Boolean
      nonTransferable: Boolean
      type: String
      itemDisplayStyle: String
      socials: JSON
      disabled: Boolean
      featured: Boolean
      promoted: Boolean
    }
    type CollectionTokenCounters {
      tokenId: String!
      listed: Int!
      owners: Int!
      total: Int!
    }
    type CollectionCounters {
      listed: Int
      owners: Int
      total: Int
      tokens: [CollectionTokenCounters]
    }

    type CollectionVolume {
      currency: Currency!
      d1: String!
      d7: String!
      d30: String!
      d365: String!
      total: String!
    }

    type CollectionFloorListing {
      tokenId: String!
      price: String!
      currency: Currency!
      creator: String!
      startAt: Int!
      endAt: Int!
      id: String!
      listingId: String!
      metadata: JSON
    }
    type CollectionFloor {
      items: [CollectionFloorListing!]!
      change1d: Float!
    }
    type CollectionEntity {
      metadata: CollectionMetadataEntity
      volume: CollectionVolume
      floor: CollectionFloor
      counts: CollectionCounters
    }
    type CollectionTopWeeklySalesCount {
      chainId: String!
      address: String!
      count: String!
    }
    type Currency {
      address: String!
      decimals: Int!
      symbol: String!
    }
    type MinimalCollectionEntity {
      chainId: String!
      address: String!
    }
    type CollectionAttributesEntity {
      count: Int!
      displayType: String
      rarity: Float!
      traitType: String!
      value: String!
    }

    extend type Query {
      collection(chainId: String!, address: String!): CollectionEntity
      collectionAttributes(chainId: String, address: String!): [CollectionAttributesEntity!]!
    }
  `,

  resolvers: {
    Query: {
      collection: async (_root, args, context) => {
        const client: PoolClient = context.pgClient;
        const { chainId, address } = args;
        const lowerAddress = address.toLowerCase();
        const [ metadataRes, volumeRes, countsRes, floorRes ] = await Promise.all([
          client.query("SELECT * FROM metadata.collection_metadata($1, $2)", [ chainId, lowerAddress ]),
          client.query("SELECT * FROM public.collection_volume_v2($1, $2)", [ chainId, lowerAddress ]),
          client.query("SELECT * FROM public.collection_counters_v2($1, $2)", [ chainId, lowerAddress ]),
          client.query("SELECT * FROM public.collection_floor_v2($1, $2)", [ chainId, lowerAddress ]),
        ]);

        const floor = await makeFloorResult(client, floorRes, args);

        return {
          volume: volumeRes.rows[0] ? mapCollectionVolumeRow(volumeRes.rows[0]) : null,
          counts: mapCollectionCounters(countsRes.rows[0]),
          floor,
        };
      },
      collectionAttributes: async (_root, args, context) => {
        const client: PoolClient = context.pgClient;
        const result = await client.query(
          "SELECT * FROM public.collection_attributes($1, $2)", [ args.chainId, args.address.toLowerCase() ]);
        return result.rows.map(r => (
          {
            count: r.count,
            displayType: r.display_type,
            rarity: r.rarity,
            traitType: r.trait_type,
            value: r.value,
          }
        ));
      },
    },
  },
}
));

const mapCollectionVolumeRow = (row: any) => {
  return {
    currency: mapCurrencyRow(row),
    d1: row.d1 || "0",
    d7: row.d7 || "0",
    d30: row.d30 || "0",
    d365: row.d365 || "0",
    total: row.total || "0",
  };
};

const mapCollectionFloorRow = (row: any) => {
  return {
    tokenId: row.token_id,
    price: row.price,
    currency: mapCurrencyRow(row),
    creator: row.creator,
    startAt: Number(row.start_at),
    endAt: Number(row.end_at),
    id: row.listing_id,
    listingId: row.listing_listing_id,
    metadata: (
      row.image || row.animation_url || row.name
    ) ? {
      image: row.image,
      animationUrl: row.animation_url,
      name: row.name,
    } : null,
  };
};

const makeFloorResult = async (client: PoolClient, result: any, args: any) => {
  if (!result.rows[0]) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;
  const items = result.rows.map(mapCollectionFloorRow);
  const floorPrice = items[0]?.price;

  const prevFloorResult = await client.query(
    "SELECT * FROM public.collection_previous_floor($1, $2, $3, $4)",
    [ args.chainId, args.address.toLowerCase(), items[0]!.currency.address, oneDayAgo ],
  );

  let change1d = 0;
  const prevFloorPrice = prevFloorResult.rows[0] ? parseFloat(prevFloorResult.rows[0].price) : null;
  if (floorPrice && prevFloorPrice && Number(prevFloorPrice) > 0) {
    change1d =
      (
        parseFloat(floorPrice) - prevFloorPrice
      ) / prevFloorPrice;
  }
  return {
    items,
    change1d,
  };
};

const mapCollectionCounters = (row: any) => row ? (
  {
    listed: row.listed || row.listed_count || 0,
    owners: row.owners || row.owners_count || 0,
    total: row.total || row.total_count || 0,
    tokens: row.tokens ? row.tokens.map((r: any) => (
      {
        tokenId: r.token_id,
        listed: r.listed_count || 0,
        owners: r.owner_count || 0,
        total: r.total_count || 0,
      }
    )) : null,
  }
) : (
  {
    listed: 0,
    owners: 0,
    total: 0,
    tokens: null,
  }
);

const formatType = (type: string) => {
  switch (type) {
    case "ERC20":
    case "ERC-20":
      return "ERC-20";
    case "ERC1155":
    case "ERC-1155":
      return "ERC-1155";
    case "ERC721":
    case "ERC-721":
      return "ERC-721";
    default:
      return type || "UNKNOWN";
  }
};
