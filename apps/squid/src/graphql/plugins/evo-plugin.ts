import { PoolClient } from "pg";
import { gql, makeExtendSchemaPlugin } from "postgraphile";
import { mapCurrencyRow } from "./utils";

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
        nextOffset: Int
        total: Int!
      }

      extend type Query {
        evoById(tokenId: String!): Evo
        evosByQuery(
          tokenIds: [String!],
          owner: String,
          listed: Boolean,
          limit: Int = 30,
          offset: Int = 0,
          sort: SortOrder = PRICE_LOW_TO_HIGH
        ): Evos!
      }
    `,
    resolvers: {
      Query: {
        evoById: async (_query, args, context, _info) => {
          const squidClient: PoolClient = context.pgClient;
          const evosClient: PoolClient = context.evosClient;
          const { tokenId } = args;
          const metadataResult = await evosClient.query("SELECT * FROM evos.public.get_evo_metadata($1)", [ tokenId ]);
          const metadataRaw = metadataResult.rows[0]?.get_evo_metadata;
          if (!metadataRaw) {
            return null;
          }
          const { id, tokenId: tid, ...metadata } = metadataRaw;
          const marketplaceResult = await squidClient.query(
            "SELECT * FROM squid.public.get_evo_marketplace($1)",
            [ tokenId ],
          );
          const marketplace = marketplaceResult.rows[0];
          if (!marketplace) {
            return null;
          }
          console.log(marketplace.listings);
          return {
            tokenId,
            chainId: marketplace.chainId,
            address: marketplace.address,
            owner: marketplace.owner,
            metadata,
            offers: marketplace.offers.map((o: any) => (
              { ...o, offeror: o.offeror.split("-").pop() }
            )),
            listings: marketplace.listings.map((o: any) => (
              { ...o, creator: o.creator.split("-").pop() }
            )),
            auctions: marketplace.auctions.map((o: any) => (
              { ...o, creator: o.creator.split("-").pop() }
            )),
          };
        },
        evosByQuery: async (_query, args, context, _info) => {
          const client: PoolClient = context.pgClient;
          const q = args.query.trim().toLowerCase().replace(/\s+/g, " ");
          const limit = Math.min(args.limit ?? 10, 50);

          if (q.length === 0) {
            return [];
          }

          const raw = await client.query(
            "SELECT * FROM public.assets_by_query($1, $2)", [ `%${q}%`, limit ],
          );
          console.log("ASSETS BY QUERY:", raw.rows);
          return raw.rows.map((nft: any) => (
            {
              tokenId: nft.token_id,
              chainId: nft.chain_id,
              address: nft.collection_address,
              owner: nft.owner,
              type: null,
              metadata: nft.metadata?.metadata ? {
                ...nft.metadata.metadata,
                attributes: (
                  nft.metadata.attributes ?? []
                ).map((a: any) => (
                  {
                    traitType: a.trait_type,
                    value: a.value,
                    displayType: a.display_type,
                    rarity: 0,
                    count: 0,
                  }
                )),
              } : null,
              offers: [],
              listing: null,
              lastSale: null,
              balance: null,
              value: null,
              collection: null,
            }
          ));
        },
      },
    },
  }
));

const mapListingRow = (row: any) => row ? (
  {
    chainId: row.chain_id,
    address: row.collection_address,
    creator: row.creator,
    currency: {
      symbol: row.currency_symbol,
      address: row.currency_address,
      decimals: row.currency_decimals,
    },
    endAt: Number(row.end_at),
    startAt: Number(row.start_at),
    price: row.price,
    id: row.listing_id,
    tokenId: row.token_id,
  }
) : null;

const mapLastSaleRow = (row: any) => row ? (
  {
    id: row.sale_id,
    price: row.price,
    soldAt: row.sold_at,
    currency: mapCurrencyRow(row),
    quantity: row.quantity,
    tokenId: row.token_id,
    chainId: row.chain_id,
  }
) : null;

const mapAssetType = (type?: string) => {
  if (!type) {
    return "UNKNOWN";
  }
  switch (type) {
    case "ERC-721":
    case "ERC721":
      return "ERC-721";
    case "ERC-1155":
    case "ERC1155":
      return "ERC-1155";
    case "ERC-20":
    case "ERC20":
      return "ERC-20";
    default:
      return type;
  }
};
