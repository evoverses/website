import { ContractType } from "../model";

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
