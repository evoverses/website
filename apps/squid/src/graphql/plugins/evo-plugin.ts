import { PoolClient } from "pg";
import { gql, makeExtendSchemaPlugin } from "postgraphile";
import { clamp } from "../../utils";

export const EvoPlugin = makeExtendSchemaPlugin(() => (
  {
    typeDefs: gql`
      enum SortOrder {
        PRICE_LOW_TO_HIGH
        PRICE_HIGH_TO_LOW
        RECENTLY_LISTED
        HIGHEST_LAST_SALE
        LOWEST_LAST_SALE
        TOP_OFFER
        RECENTLY_SOLD
      }
      type AssetMetadataAttribute {
        traitType: String
        value: String
        displayType: String
        rarity: Float
        count: Int
      }

      type Evo {
        tokenId: String!
        chainId: String!
        address: String!
        owner: String!
        metadata: JSON!
        offers: [JSON!]!
        listings: [JSON!]!
        auctions: [JSON!]!
      }

      type Evos {
        items: [Evo!]!
        nextPage: Int
        total: Int!
      }

      type EvoMarketplaceSummary {
        floorPrice: String!
        topOffer: String!
        totalVolume: String!
        activeListings: Int!
        uniqueOwners: Int!
        total: Int!
      }
      extend type Query {
        evoById(tokenId: String!): Evo
        evosByQuery(
          tokenIds: [String!],
          owners: [String!],
          listed: Boolean,
          limit: Int = 30,
          page: Int = 0,
          sort: SortOrder = PRICE_LOW_TO_HIGH
          attributes: JSON
        ): Evos!
        evosMarketplaceSummary: EvoMarketplaceSummary!
      }
    `,
    resolvers: {
      Query: {
        evoById: async (_query, args, context, _info) => {
          const client: PoolClient = context.pgClient;
          const result = await client.query("SELECT * FROM metadata.get_evo($1)", [ args.tokenId ]);
          const row = result.rows[0];
          if (!row) {
            return null;
          }

          return mapEvoRow(row);
        },
        evosByQuery: async (_query, args, context, _info) => {
          console.log("QUERY ARGS:", args);
          const client: PoolClient = context.pgClient;
          const limit = clamp(args.limit, 1, 50);
          const page = Math.max(0, args.page);
          const sort = args.sort || "PRICE_LOW_TO_HIGH";
          const owners = args.owners ? args.owners.map((o: string) => o.toLowerCase()) : null;
          const listed = args.listed;
          const attributes = args.attributes ?? null;
          console.log("ATTRIBUTES", attributes);
          const raw = await client.query(
            "SELECT * FROM metadata.get_evos($1, $2, $3, $4, $5, $6)",
            [ limit, page, sort, owners, listed, attributes ],
          );
          const query = raw.rows[0]?.get_evos;
          if (!query || !query.items || query.items.length === 0) {
            return {
              items: [],
              nextPage: null,
              total: 0,
            };
          }

          return {
            items: query.items.map(mapEvoRow),
            nextPage: query.next_page ? page + 1 : null,
            total: query.total_count,
          };
        },
        evosMarketplaceSummary: async (_query, _args, context) => {
          const client: PoolClient = context.pgClient;
          const raw = await client.query("SELECT * FROM metadata.evos_marketplace_summary_aggregated_view");
          const query = raw.rows[0];
          if (!query) {
            return {
              floorPrice: "0",
              topOffer: "0",
              totalVolume: "0",
              activeListings: 0,
              uniqueOwners: 0,
              total: 0,
            };
          }
          return {
            floorPrice: query.floor_price ?? "0",
            topOffer: query.top_offer ?? "0",
            totalVolume: query.total_volume ?? "0",
            activeListings: query.listed,
            uniqueOwners: query.unique_owners,
            total: query.total,
          };
        },
      },
    },
  }
));

const mapEvoRow = (row: any) => {
  if (!row) {
    return null;
  }
  const { id, token_id, ...metadata } = row.metadata;
  if (toArray(row.listings).length > 0) {
    console.log("LISTINGS", toArray(row.listings));
  }
  return {
    tokenId: row.tokenid || row.tokenId || row.token_id,
    chainId: row.chainid || row.chainId || row.chain_id,
    address: row.address,
    owner: row.owner,
    metadata: {
      ...Object.entries(metadata).reduce((acc, [ k, v ]) => {
        acc[k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = v;
        return acc;
      }, {} as Record<string, unknown>),
    },
    offers: toArray(row.offers).map(mapOffer),
    listings: toArray(row.listings).map(mapListing),
    auctions: toArray(row.auctions).map(mapAuction),
  };
};

const toArray = (array: any) => {
  if (!array || array === "{}") {
    return [];
  }
  if (typeof array === "object" && Object.keys(array).length === 0) {
    return [];
  }
  return array;
};
const mapOffer = (offer: any) => {

  const { id, offerId, offerorId, currencyId, ...o } = offer;
  return {
    ...o,
    offeror: offerorId.split("-").pop(),
    currency: currencyId,
    id: offerId,
  };
};

const mapListing = (listing: any) => {
  const { id, listingId, creatorId, currencyId, ...o } = listing;
  const result = {
    ...o,
    creator: creatorId.split("-").pop(),
    currency: currencyId,
    id: listingId,
  };
  if (result.status === "CREATED") {
    const now = Math.floor(Date.now() / 1000);
    const startAt = Math.floor(Date.parse(listing.startAt) / 1000);
    const endAt = Math.floor(Date.parse(listing.endAt) / 1000);
    console.log(now, startAt, endAt);
    if (endAt < now) {
      result.status = "EXPIRED";
      return result;
    } else if (startAt < now) {
      result.status = "ACTIVE";
      return result;
    }
  }
  return result;
};

const mapAuction = (auction: any) => {
  const { id, auctionId, creatorId, currencyId, ...o } = auction;
  return {
    ...o,
    creator: creatorId.split("-").pop(),
    currency: currencyId,
    id: auctionId,
  };
};
