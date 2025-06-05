import {
  type BlockData,
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { processor } from "../processor";

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Blocks = BlockData<Fields>[]
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
export type ProcessorContext = DataHandlerContext<Store, Fields>
