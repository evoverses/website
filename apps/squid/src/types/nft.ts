import { ContractType } from "../model";
import type { LogGenericEventData } from "./shared";

export type MetadataUpdateEventData = {
  fromTokenId: bigint;
  toTokenId: bigint;
  contract: string;
  type: ContractType;
  timestamp: Date;
}

type BaseTransferEventData = {
  from: string;
  to: string;
  fromTokenId: bigint;
  toTokenId: bigint;
  contract: string;
  timestamp: Date;
}

export type TransferEventData = BaseTransferEventData & ({
  type: ContractType.ERC721;
} | {
  type: ContractType.ERC1155;
  value: bigint;
})

export type AttributeData = {
  traitType: string,
  value: string,
  displayType: string | null,
}

export type BreedRequestedEventData = LogGenericEventData & {
  breeder: string,
  parent1: bigint,
  parent2: bigint,
  amountPaid: bigint
}

export type BreedMintedEventData = LogGenericEventData & {
  to: string,
  tokenId: bigint,
  mintedBy: string
}
