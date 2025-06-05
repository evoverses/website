import type { FunctionArguments, FunctionReturn } from "@subsquid/evm-abi";
import { type AbiFunction, ContractBase } from "@subsquid/evm-abi";
import type { Block } from "@subsquid/evm-abi/lib/contract-base";
import { MULTICALL3_ADDRESS } from "../constants";
import { fetchBlockHeight, splitSlice } from "../utils";
import type { Context } from "../utils/context";
import { functions } from "./generated/multicall3-internal";

export type Multicall3Result<T extends AbiFunction<any, any>> =
  | { success: true; value: FunctionReturn<T> }
  | { success: false; returnData?: string; value?: undefined }

type Aggregate3Call<T extends AbiFunction<any, any> = AbiFunction<any, any>> = [
  func: T,
  address: string,
  allowFailure: boolean,
  args: FunctionArguments<T>
]

export class Multicall3 extends ContractBase {
  aggregate<TF extends AbiFunction<any, any>>(
    func: TF,
    calls: [ address: string, allowFailure: boolean, args: FunctionArguments<TF> ][] | Aggregate3Call<TF>[],
    paging?: number,
  ): Promise<Multicall3Result<TF>[]> {
    const isAggregate3Tuple = (arg: any): arg is Aggregate3Call<TF> =>
      Array.isArray(arg) && typeof arg[0] === "object" && typeof arg[1] === "string";

    const normalized: Aggregate3Call<TF>[] = (
      calls as any[]
    ).map((c) =>
      isAggregate3Tuple(c)
        ? c
        : [ func, c[0], c[1], c[2] ], // c is [address, allowFailure, args]
    );

    return this.aggregateInternal(normalized, paging);
  }

  private async aggregateInternal<TF extends AbiFunction<any, any>>(
    calls: Aggregate3Call<TF>[],
    paging = Number.MAX_SAFE_INTEGER,
  ): Promise<Multicall3Result<TF>[]> {
    const size = calls.length;
    const results = new Array<Multicall3Result<TF>>(size);
    const encodedCalls = calls.map(([ f, address, allowFailure, args ]) => (
      {
        target: address,
        allowFailure,
        callData: f.encode(args),
      }
    ));
    const funcs = calls.map(([ f ]) => f);

    for (let [ from, to ] of splitSlice(size, paging)) {
      const batch = encodedCalls.slice(from, to);
      const response = await this.eth_call(functions.aggregate3, { calls: batch });

      for (let i = from; i < to; i++) {
        const res = response[i - from]!;
        if (res.success) {
          try {
            results[i] = {
              success: true,
              value: funcs[i]!.decodeResult(res.returnData),
            };
          } catch {
            results[i] = { success: false, returnData: res.returnData };
          }
        } else {
          results[i] = { success: false, returnData: res.returnData };
        }
      }
    }

    return results;
  }
}

export function getMulticallContract(ctx: Context): Promise<Multicall3>;
export function getMulticallContract(ctx: Context, block: Block): Multicall3;
export function getMulticallContract(ctx: Context, block?: Block) {
  if (block) {
    return new Multicall3(ctx, block, MULTICALL3_ADDRESS);
  } else {
    return fetchBlockHeight(ctx).then(height => new Multicall3(ctx, { height }, MULTICALL3_ADDRESS));
  }
}
