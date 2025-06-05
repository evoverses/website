import type { Block } from "@subsquid/evm-abi/lib/contract-base";
import { RpcClient as RpcClientInterface } from "@subsquid/evm-processor/lib/interfaces/chain";
import { Logger } from "@subsquid/logger";
import { RpcClient } from "@subsquid/rpc-client";
import { EXPLORER_DOMAINS, RPC_URLS } from "../constants";
import { Chain } from "../model";
import type { Blocks } from "../types/processor";
import { type EntityManager } from "./entity-manager";

export class Context {
  public readonly log: Logger;
  private readonly client: RpcClient;
  public readonly chain: Chain;
  public readonly blockHeader: Block;

  constructor(
    public entities: EntityManager,
    log: Logger,
    opts: { blocks?: Blocks, client?: RpcClient | RpcClientInterface } = {},
  ) {
    this.chain = entities.chain;
    if (!this.chain) {
      throw new Error("No chainId found");
    }
    this.log = log.child({ chainId: this.chain.id });
    const rpcUrl = RPC_URLS[this.chain.id];
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${this.chain.id}`);
    }
    this.client = opts.client as RpcClient ?? new RpcClient({
      url: rpcUrl,
      maxBatchCallSize: 100,
      requestTimeout: 30_000,
      capacity: 10,
      rateLimit: 100,
      retryAttempts: 3,
    });
    this.blockHeader =
      (
        opts.blocks && opts.blocks.length > 0
      ) ? [ ...opts.blocks ].pop()!.header : { height: 0 };
  }

  // noinspection FunctionNamingConventionJS
  get _chain() {
    return {
      client: this.client,
    };
  }

  get explorerDomain() {
    return EXPLORER_DOMAINS[this.chain.id];
  }

}
