export type LogGenericEventData = {
  contract: string;
  timestamp: Date;
  blockNumber: number;
  txHash: string;
}

export type ContractURIUpdatedEventData = LogGenericEventData & {
  prevURI: string;
  newURI: string;
}

export type OwnerUpdatedEventData = LogGenericEventData & {
  prevOwner: string;
  newOwner: string;
}
export type Prop<O> = keyof O
export type PropType<O> = O[Prop<O>]
export type Arrayable<T> = T | T[]
export type Maybe<T> = T | undefined | null
export type Nullable<T> = T | null
export type Promisable<T> = Promise<T> | T
export type NumberIsh = number | bigint
