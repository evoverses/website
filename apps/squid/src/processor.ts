import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { assertNotNull } from "@subsquid/util-internal";
import {
  CHAIN_ID,
  GATEWAY_URL,
  MARKETPLACE_ADDRESSES,
  NFT_ADDRESSES,
  RPC_CAPACITY,
  RPC_MAX_BATCH_CALL_SIZE,
  RPC_RATE_LIMIT,
  RPC_URLS,
  watchedMarketplaceTopics,
  watchedNftTopics,
} from "./utils/constants";

export const processor = new EvmBatchProcessor()
  .setGateway(GATEWAY_URL)
  .setRpcEndpoint({
    url: assertNotNull(
      RPC_URLS[assertNotNull(CHAIN_ID, "CHAIN ID not supplied")],
      "NO RPC URL FOR CHAIN ID ${CHAIN_ID}",
    ),
    rateLimit: RPC_RATE_LIMIT,
    maxBatchCallSize: RPC_MAX_BATCH_CALL_SIZE,
    capacity: RPC_CAPACITY,
    requestTimeout: 5_5000,
    retryAttempts: 3,
  })
  .setFinalityConfirmation(1)
  .addLog({ address: MARKETPLACE_ADDRESSES, topic0: watchedMarketplaceTopics, transaction: true })
  .addLog({ address: NFT_ADDRESSES, topic0: watchedNftTopics, transaction: true })
  .setFields({
    log: { transactionHash: true },
    transaction: {
      gas: true,
      gasPrice: true,
      maxFeePerGas: true,
      maxPriorityFeePerGas: true,
      input: true,
      nonce: true,
      value: true,
      v: true,
      r: true,
      s: true,
      yParity: true,
      chainId: true,
      gasUsed: true,
      cumulativeGasUsed: true,
      effectiveGasUsed: true,
      contractAddress: true,
      type: true,
      status: true,
      sighash: true,
      // l1Fee: true
      // l1FeeScalar: true
      // l1GasPrice: true
      // l1GasUsed: true
      // l1BlobBaseFee: true
      // l1BlobBaseFeeScalar: true
      // l1BaseFeeScalar: true
    },
    block: {
      nonce: true,
      sha3Uncles: true,
      logsBloom: true,
      transactionsRoot: true,
      stateRoot: true,
      receiptsRoot: true,
      mixHash: true,
      miner: true,
      difficulty: true,
      totalDifficulty: true,
      extraData: true,
      size: true,
      gasLimit: true,
      gasUsed: true,
      baseFeePerGas: true,
      // l1BlockNumber: number
    },
  });
