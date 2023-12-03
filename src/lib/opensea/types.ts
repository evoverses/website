export namespace OpenSeaAPI {
  export type Address = `0x${string}`;

  export type TestnetChain =
    "goerli"
    | "sepolia"
    | "mumbai"
    | "baobab"
    | "bsctestnet"
    | "arbitrum_sepolia"
    | "avalanche_fuji"
    | "optimism_goerli"
    | "soldev"
    | "base_goerli"
    | "zora_testnet";

  export type MainnetChain =
    "ethereum"
    | "matic"
    | "klaytn"
    | "bsc"
    | "arbitrum"
    | "arbitrum_nova"
    | "avalanche"
    | "optimism"
    | "solana"
    | "base"
    | "zora";

  export type Chain = MainnetChain | TestnetChain;

  export namespace Accounts {
    export type SocialMediaAccount = {
      platform: string
      username: string
    }

    export type Account = {
      address: Address
      username: string
      profile_image_url: string
      banner_image_url: string
      website: string
      social_media_accounts: SocialMediaAccount[]
      bio: string
      joined_date: string
    }
  }

  export namespace Collections {
    export type Collection = {
      collection: string,
      name: string,
      description: string,
      image_url: string,
      banner_image_url: string,
      owner: string,
      safelist_status: string,
      category: string,
      is_disabled: boolean,
      is_nsfw: boolean,
      trait_offers_enabled: boolean,
      collection_offers_enabled: boolean,
      opensea_url: string,
      project_url: string,
      wiki_url: string,
      discord_url: string,
      telegram_url: string,
      twitter_username: string,
      instagram_username: string,
      contracts: Contract[],
      editors: Address[]
      fees: Fee[]
    }

    export type Contract = {
      address: Address,
      chain: Chain
    }

    export type Fee = {
      fee: number,
      recipient: Address
      required: boolean
    }

    export type Interval = "one_day" | "one_week" | "one_month";
    export type StatsTotal = {
      volume: number
      sales: number
      average_price: number
      num_owners: number
      market_cap: number
      floor_price: number
      floor_price_symbol: string
    }

    export type StatsInterval = {
      interval: Interval,
      volume: number,
      volume_diff: number,
      volume_change: number,
      sales: number,
      sales_diff: number,
      average_price: number
    }
    export namespace Responses {
      export type CollectionsResponse = {
        collections: Collection[],
        next?: string
      }

      export type CollectionStatsResponse = {
        total: StatsTotal,
        intervals: StatsInterval[]
      }
    }
  }

  export namespace NFTs {

    export type Standard = "erc721" | "erc1155";

    export type TraitKindType = "string" | "number";

    export type DisplayType = "number" | "boost_percentage" | "boost_number" | "author" | "date" | null;

    export type Identifier = `${number}`;

    export interface Trait {
      trait_type: string,
      display_type: DisplayType,
      max_value: number | null,
      value: string | number
    }

    export interface Owner {
      address: Address,
      quantity: number,
    }

    export type Contract = {
      address: Address
      chain: Chain
      collection: string
      contract_standard: Standard
      name: string
      supply: number
    }

    /**
     * Represents an NFT (Non-Fungible Token) from the OpenSea platform.
     *
     * @property {string} identifier - The NFT's unique identifier within the smart contract (also known as token_id)
     * @property {string} collection - The name (or slug) of the collection the NFT belongs to
     * @property {Address} contract - The address of the smart contract associated with the NFT
     * @property {Standard} token_standard - Specifies the token standard of the NFT
     * @property {string} name - The given name of the NFT
     * @property {string} description - A description of the NFT
     * @property {string} image_url - A link to an image associated with the NFT
     * @property {string} metadata_url - A link to the off-chain metadata store for the NFT
     * @property {string} created_at - The date the NFT was originally added to OpenSea
     * @property {string} updated_at - The last date the metadata for the NFT was updated on OpenSea
     * @property {boolean} is_disabled - Indicates if the NFT item is currently unable to be bought or sold on OpenSea
     *   (true), or can be traded (false)
     * @property {boolean} is_nsfw - Indicates if the NFT item is currently marked as 'Not Safe for Work' on OpenSea
     *   (true), or is safe (false)
     */
    export type NFT = {
      /** The NFT's unique identifier within the smart contract (also known as token_id) */
      identifier: Identifier
      /** The name (or slug) of the collection the NFT belongs to */
      collection: string
      /** The address of the smart contract associated with the NFT */
      contract: Address
      /** Specifies the token standard of the NFT */
      token_standard: Standard
      /** The given name of the NFT */
      name: string
      /** A description of the NFT */
      description: string
      /** A link to an image associated with the NFT */
      image_url: string
      /** A link to the off-chain metadata store for the NFT */
      metadata_url: string
      /** The date the NFT was originally added to OpenSea */
      created_at: string
      /** The last date the metadata for the NFT was updated on OpenSea */
      updated_at: string
      /** Indicates if the NFT item is currently unable to be bought or sold on OpenSea (true), or can be traded (false) */
      is_disabled: boolean
      /** Indicates if the NFT item is currently marked as 'Not Safe for Work' on OpenSea (true), or is safe (false) */
      is_nsfw: boolean
    }

    /**
     * Represents an NFT (Non-Fungible Token) from the OpenSea platform.
     * @extends NFT
     *
     * @property {boolean} is_suspicious - Returns true if the item has been reported for suspicious activity and false
     * otherwise
     * @property {Owner[]} owners - A list of Owner objects. <b>for NFTs with more than 50 owners, this field
     * will be null</b>
     * @property {Address} creator - The address of the creator
     * @property {Trait[]} traits - A list of Trait objects. <b>For NFTs with more than 50 traits, this
     * field will be null</b>
     * @property {object} rarity - A Rarity object
     */
    export type DetailedNFT = NFT & {
      /** Returns true if the item has been reported for suspicious activity and false otherwise */
      is_suspicious: boolean
      /** A list of Owner objects. <b>for NFTs with more than 50 owners, this field will be null</b> */
      owners: Owner[] | null
      /** The address of the creator */
      creator: Address
      /** A list of Trait objects. <b>For NFTs with more than 50 traits, this field will be null</b> */
      traits: Trait[]
      /** A Rarity object */
      rarity: Rarity | null
    }

    export type RarityStrategy = "openrarity";

    export type Rarity = {
      strategy_id: RarityStrategy
      rank: number
    }

    export namespace Events {
      export type EventType = "all" | "cancel" | "order" | "redemption" | "sale" | "transfer";
      export type OrderType = "listing" | "auction" | "item_offer" | "collection_offer" | "trait_offer";

      export type Payment = {
        quantity: number
        token_address: Address
        decimals: number
        symbol: string
        transaction: string
      }

      export type Criteria = {
        collection: {
          slug: string
        }
        contract: {
          address: Address
        },
        trait: {
          type: string
          value: string
          encoded_token_ids: string
        }
      }
      export type CancelEvent = {
        event_type: "cancel"
        order_hash: string
        chain: Chain
      }

      export type OrderEvent = {
        event_type: "order"
        order_hash: string
        order_type: OrderType
        chain: Chain
        protocol_address: Address
        start_date: number
        expiration_date: number
        asset: NFT
        quantity: number
        maker: Address
        taker: Address
        payment: Payment
        criteria: Criteria
      }

      export type SaleEvent = {
        event_type: "sale"
        order_hash: string
        chain: Chain
        protocol_address: Address
        closing_date: number
        nft: NFT
        quantity: number
        maker: Address
        taker: string
        payment: Payment
        transaction: string
      }

      export type TransferEvent = {
        event_type: "transfer"
        chain: Chain
        transaction: string
        from_address: Address
        to_address: Address
        quantity: number
      }

      export type RedemptionEvent = {
        event_type: "redemption"
        chain: Chain
        from_address: Address
        to_address: Address
        asset: NFT
        quantity: number
        transaction: string
      }
      export type Event = CancelEvent | OrderEvent | SaleEvent | TransferEvent | RedemptionEvent;

      export namespace Responses {
        export type EventsResponse = {
          asset_events: Event[],
          next?: string
        }
      }
    }
    export namespace Responses {
      export type NFTResponse = {
        nft: DetailedNFT
      }

      export type NFTsResponse = {
        nfts: NFT[],
        next?: string
      }

      export interface TraitsResponse {
        categories: Record<string, TraitKindType>;
        counts: Record<string, { min: number, max: number }> | Record<string, number>;
      }
    }
  }
}
