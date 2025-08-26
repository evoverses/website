import type { EventParams as EParams, FunctionArguments, FunctionReturn } from "@subsquid/evm-abi";
import { ContractBase, event, fun, indexed, viewFun } from "@subsquid/evm-abi";
import * as p from "@subsquid/evm-codec";

export const events = {
  AuthorityUpdated: event(
    "0x2f658b440c35314f52658ea8a740e05b284cdc84dc9ae01e891f21b8933e7cad",
    "AuthorityUpdated(address)",
    { "authority": p.address },
  ),
  BreedMinted: event(
    "0xffe9634963c8effe29cb4e395db1dcd1e49a1327b97e2b0361e1bde251c0c22d",
    "BreedMinted(address,uint256,address)",
    { "to": indexed(p.address), "tokenId": indexed(p.uint256), "mintedBy": indexed(p.address) },
  ),
  BreedRequested: event(
    "0x0a6a5568867171fa9f4cda316884c0ca1a2cdcb79d7952a11ed6ae44cd9feae9",
    "BreedRequested(address,uint256,uint256,uint256)",
    {
      "breeder": indexed(p.address),
      "parent1": indexed(p.uint256),
      "parent2": indexed(p.uint256),
      "amountPaid": p.uint256,
    },
  ),
  Initialized: event(
    "0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2",
    "Initialized(uint64)",
    { "version": p.uint64 },
  ),
  Paused: event(
    "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258",
    "Paused(address)",
    { "account": p.address },
  ),
  Unpaused: event(
    "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa",
    "Unpaused(address)",
    { "account": p.address },
  ),
  Upgraded: event(
    "0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b",
    "Upgraded(address)",
    { "implementation": indexed(p.address) },
  ),
};

export const functions = {
  UPGRADE_INTERFACE_VERSION: viewFun("0xad3cb1cc", "UPGRADE_INTERFACE_VERSION()", {}, p.string),
  authority: viewFun("0xbf7e214f", "authority()", {}, p.address),
  evoNft: viewFun("0xa99d47bc", "evoNft()", {}, p.address),
  evoToken: viewFun("0x2705dbc8", "evoToken()", {}, p.address),
  initialize: fun("0x8129fc1c", "initialize()", {}),
  isConsumingScheduledOp: viewFun("0x8fb36037", "isConsumingScheduledOp()", {}, p.bytes4),
  mintApprovedBreed: fun(
    "0xaff7cce5",
    "mintApprovedBreed(address,uint256)",
    { "to": p.address, "tokenId": p.uint256 },
  ),
  pause: fun("0x8456cb59", "pause()", {}),
  paused: viewFun("0x5c975abb", "paused()", {}, p.bool),
  proxiableUUID: viewFun("0x52d1902d", "proxiableUUID()", {}, p.bytes32),
  requestBreed: fun(
    "0x021dbc5c",
    "requestBreed(uint256,uint256,uint256)",
    { "parent1": p.uint256, "parent2": p.uint256, "amount": p.uint256 },
  ),
  setAuthority: fun("0x7a9e5e4b", "setAuthority(address)", { "newAuthority": p.address }),
  treasury: viewFun("0x61d027b3", "treasury()", {}, p.address),
  unpause: fun("0x3f4ba83a", "unpause()", {}),
  upgradeToAndCall: fun(
    "0x4f1ef286",
    "upgradeToAndCall(address,bytes)",
    { "newImplementation": p.address, "data": p.bytes },
  ),
};

export class Contract extends ContractBase {

  UPGRADE_INTERFACE_VERSION() {
    return this.eth_call(functions.UPGRADE_INTERFACE_VERSION, {});
  }

  authority() {
    return this.eth_call(functions.authority, {});
  }

  evoNft() {
    return this.eth_call(functions.evoNft, {});
  }

  evoToken() {
    return this.eth_call(functions.evoToken, {});
  }

  isConsumingScheduledOp() {
    return this.eth_call(functions.isConsumingScheduledOp, {});
  }

  paused() {
    return this.eth_call(functions.paused, {});
  }

  proxiableUUID() {
    return this.eth_call(functions.proxiableUUID, {});
  }

  treasury() {
    return this.eth_call(functions.treasury, {});
  }
}

/// Event types
export type AuthorityUpdatedEventArgs = EParams<typeof events.AuthorityUpdated>
export type BreedMintedEventArgs = EParams<typeof events.BreedMinted>
export type BreedRequestedEventArgs = EParams<typeof events.BreedRequested>
export type InitializedEventArgs = EParams<typeof events.Initialized>
export type PausedEventArgs = EParams<typeof events.Paused>
export type UnpausedEventArgs = EParams<typeof events.Unpaused>
export type UpgradedEventArgs = EParams<typeof events.Upgraded>

/// Function types
export type UPGRADE_INTERFACE_VERSIONParams = FunctionArguments<typeof functions.UPGRADE_INTERFACE_VERSION>
export type UPGRADE_INTERFACE_VERSIONReturn = FunctionReturn<typeof functions.UPGRADE_INTERFACE_VERSION>

export type AuthorityParams = FunctionArguments<typeof functions.authority>
export type AuthorityReturn = FunctionReturn<typeof functions.authority>

export type EvoNftParams = FunctionArguments<typeof functions.evoNft>
export type EvoNftReturn = FunctionReturn<typeof functions.evoNft>

export type EvoTokenParams = FunctionArguments<typeof functions.evoToken>
export type EvoTokenReturn = FunctionReturn<typeof functions.evoToken>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type IsConsumingScheduledOpParams = FunctionArguments<typeof functions.isConsumingScheduledOp>
export type IsConsumingScheduledOpReturn = FunctionReturn<typeof functions.isConsumingScheduledOp>

export type MintApprovedBreedParams = FunctionArguments<typeof functions.mintApprovedBreed>
export type MintApprovedBreedReturn = FunctionReturn<typeof functions.mintApprovedBreed>

export type PauseParams = FunctionArguments<typeof functions.pause>
export type PauseReturn = FunctionReturn<typeof functions.pause>

export type PausedParams = FunctionArguments<typeof functions.paused>
export type PausedReturn = FunctionReturn<typeof functions.paused>

export type ProxiableUUIDParams = FunctionArguments<typeof functions.proxiableUUID>
export type ProxiableUUIDReturn = FunctionReturn<typeof functions.proxiableUUID>

export type RequestBreedParams = FunctionArguments<typeof functions.requestBreed>
export type RequestBreedReturn = FunctionReturn<typeof functions.requestBreed>

export type SetAuthorityParams = FunctionArguments<typeof functions.setAuthority>
export type SetAuthorityReturn = FunctionReturn<typeof functions.setAuthority>

export type TreasuryParams = FunctionArguments<typeof functions.treasury>
export type TreasuryReturn = FunctionReturn<typeof functions.treasury>

export type UnpauseParams = FunctionArguments<typeof functions.unpause>
export type UnpauseReturn = FunctionReturn<typeof functions.unpause>

export type UpgradeToAndCallParams = FunctionArguments<typeof functions.upgradeToAndCall>
export type UpgradeToAndCallReturn = FunctionReturn<typeof functions.upgradeToAndCall>
