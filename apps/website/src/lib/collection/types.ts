import type { ComponentProps } from "react";
import { Address } from "viem";
import type Image from "next/image";

export type CollectionFee = {
  fee: number,
  recipient: Address
  required: boolean
}

export type CollectionContract = {
  chainId: string,
  address: Address
}

export type Collection = {
  name: string,
  description: string,
  slug: string,
  images: Record<"avatar" | "banner", ComponentProps<typeof Image>["src"]>
  features: {
    traitOffers?: boolean,
    collectionOffers?: boolean,
    comingSoon?: boolean,
  }
  marketplaces: {
    opensea?: string,
    joepegs?: string
  }
  contracts: CollectionContract[]
  fees: CollectionFee[]
}
