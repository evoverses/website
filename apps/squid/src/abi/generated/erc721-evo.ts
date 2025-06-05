import * as p from "@subsquid/evm-codec";
import { event, fun, viewFun, indexed, ContractBase } from "@subsquid/evm-abi";
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from "@subsquid/evm-abi";

export const events = {
  Approval: event(
    "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    "Approval(address,address,uint256)",
    { "owner": indexed(p.address), "approved": indexed(p.address), "tokenId": indexed(p.uint256) },
  ),
  ApprovalForAll: event(
    "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
    "ApprovalForAll(address,address,bool)",
    { "owner": indexed(p.address), "operator": indexed(p.address), "approved": p.bool },
  ),
  AuthorityUpdated: event(
    "0x2f658b440c35314f52658ea8a740e05b284cdc84dc9ae01e891f21b8933e7cad",
    "AuthorityUpdated(address)",
    { "authority": p.address },
  ),
  BatchMetadataUpdate: event(
    "0x6bd5c950a8d8df17f772f5af37cb3655737899cbf903264b9795592da439661c",
    "BatchMetadataUpdate(uint256,uint256)",
    { "_fromTokenId": p.uint256, "_toTokenId": p.uint256 },
  ),
  Initialized: event(
    "0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2",
    "Initialized(uint64)",
    { "version": p.uint64 },
  ),
  MetadataUpdate: event(
    "0xf8e1a15aba9398e019f0b49df1a4fde98ee17ae345cb5f6b5e2c27f5033e8ce7",
    "MetadataUpdate(uint256)",
    { "_tokenId": p.uint256 },
  ),
  Paused: event(
    "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258",
    "Paused(address)",
    { "account": p.address },
  ),
  Transfer: event(
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "Transfer(address,address,uint256)",
    { "from": indexed(p.address), "to": indexed(p.address), "tokenId": indexed(p.uint256) },
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
  adminTransfer: fun(
    "0xca61f313",
    "adminTransfer(address[],address[],uint256[])",
    { "from": p.array(p.address), "to": p.array(p.address), "tokenIds": p.array(p.uint256) },
  ),
  approve: fun("0x095ea7b3", "approve(address,uint256)", { "to": p.address, "tokenId": p.uint256 }),
  authority: viewFun("0xbf7e214f", "authority()", {}, p.address),
  balanceOf: viewFun("0x70a08231", "balanceOf(address)", { "owner": p.address }, p.uint256),
  batchMintNew: fun("0x589376fb", "batchMintNew(address[])", { "to": p.array(p.address) }),
  batchMintTo: fun(
    "0x0379b1d0",
    "batchMintTo(address[],uint256[])",
    { "to": p.array(p.address), "tokenIds": p.array(p.uint256) },
  ),
  burn: fun("0x42966c68", "burn(uint256)", { "tokenId": p.uint256 }),
  contractURI: viewFun("0xe8a3d485", "contractURI()", {}, p.string),
  getApproved: viewFun("0x081812fc", "getApproved(uint256)", { "tokenId": p.uint256 }, p.address),
  initialize: fun("0x8129fc1c", "initialize()", {}),
  isApprovedForAll: viewFun(
    "0xe985e9c5",
    "isApprovedForAll(address,address)",
    { "owner": p.address, "operator": p.address },
    p.bool,
  ),
  isConsumingScheduledOp: viewFun("0x8fb36037", "isConsumingScheduledOp()", {}, p.bytes4),
  mintNew: fun("0x7fc06c07", "mintNew(address)", { "to": p.address }),
  mintTo: fun("0x449a52f8", "mintTo(address,uint256)", { "to": p.address, "tokenId": p.uint256 }),
  name: viewFun("0x06fdde03", "name()", {}, p.string),
  ownerOf: viewFun("0x6352211e", "ownerOf(uint256)", { "tokenId": p.uint256 }, p.address),
  pause: fun("0x8456cb59", "pause()", {}),
  paused: viewFun("0x5c975abb", "paused()", {}, p.bool),
  proxiableUUID: viewFun("0x52d1902d", "proxiableUUID()", {}, p.bytes32),
  requestBatchMetadataUpdate: fun(
    "0x4b9ddedc",
    "requestBatchMetadataUpdate(uint256,uint256)",
    { "_fromTokenId": p.uint256, "_toTokenId": p.uint256 },
  ),
  requestMetadataUpdate: fun("0xcfc570b0", "requestMetadataUpdate(uint256)", { "_tokenId": p.uint256 }),
  royaltyInfo: viewFun(
    "0x2a55205a",
    "royaltyInfo(uint256,uint256)",
    { "tokenId": p.uint256, "salePrice": p.uint256 },
    { "_0": p.address, "_1": p.uint256 },
  ),
  "safeTransferFrom(address,address,uint256)": fun(
    "0x42842e0e",
    "safeTransferFrom(address,address,uint256)",
    { "from": p.address, "to": p.address, "tokenId": p.uint256 },
  ),
  "safeTransferFrom(address,address,uint256,bytes)": fun(
    "0xb88d4fde",
    "safeTransferFrom(address,address,uint256,bytes)",
    { "from": p.address, "to": p.address, "tokenId": p.uint256, "data": p.bytes },
  ),
  setApprovalForAll: fun(
    "0xa22cb465",
    "setApprovalForAll(address,bool)",
    { "operator": p.address, "approved": p.bool },
  ),
  setAuthority: fun("0x7a9e5e4b", "setAuthority(address)", { "newAuthority": p.address }),
  supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", { "interfaceId": p.bytes4 }, p.bool),
  symbol: viewFun("0x95d89b41", "symbol()", {}, p.string),
  tokenByIndex: viewFun("0x4f6ccce7", "tokenByIndex(uint256)", { "index": p.uint256 }, p.uint256),
  tokenOfOwnerByIndex: viewFun(
    "0x2f745c59",
    "tokenOfOwnerByIndex(address,uint256)",
    { "owner": p.address, "index": p.uint256 },
    p.uint256,
  ),
  tokenURI: viewFun("0xc87b56dd", "tokenURI(uint256)", { "tokenId": p.uint256 }, p.string),
  totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
  transferFrom: fun(
    "0x23b872dd",
    "transferFrom(address,address,uint256)",
    { "from": p.address, "to": p.address, "tokenId": p.uint256 },
  ),
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

  balanceOf(owner: BalanceOfParams["owner"]) {
    return this.eth_call(functions.balanceOf, { owner });
  }

  contractURI() {
    return this.eth_call(functions.contractURI, {});
  }

  getApproved(tokenId: GetApprovedParams["tokenId"]) {
    return this.eth_call(functions.getApproved, { tokenId });
  }

  isApprovedForAll(owner: IsApprovedForAllParams["owner"], operator: IsApprovedForAllParams["operator"]) {
    return this.eth_call(functions.isApprovedForAll, { owner, operator });
  }

  isConsumingScheduledOp() {
    return this.eth_call(functions.isConsumingScheduledOp, {});
  }

  name() {
    return this.eth_call(functions.name, {});
  }

  ownerOf(tokenId: OwnerOfParams["tokenId"]) {
    return this.eth_call(functions.ownerOf, { tokenId });
  }

  paused() {
    return this.eth_call(functions.paused, {});
  }

  proxiableUUID() {
    return this.eth_call(functions.proxiableUUID, {});
  }

  royaltyInfo(tokenId: RoyaltyInfoParams["tokenId"], salePrice: RoyaltyInfoParams["salePrice"]) {
    return this.eth_call(functions.royaltyInfo, { tokenId, salePrice });
  }

  supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
    return this.eth_call(functions.supportsInterface, { interfaceId });
  }

  symbol() {
    return this.eth_call(functions.symbol, {});
  }

  tokenByIndex(index: TokenByIndexParams["index"]) {
    return this.eth_call(functions.tokenByIndex, { index });
  }

  tokenOfOwnerByIndex(owner: TokenOfOwnerByIndexParams["owner"], index: TokenOfOwnerByIndexParams["index"]) {
    return this.eth_call(functions.tokenOfOwnerByIndex, { owner, index });
  }

  tokenURI(tokenId: TokenURIParams["tokenId"]) {
    return this.eth_call(functions.tokenURI, { tokenId });
  }

  totalSupply() {
    return this.eth_call(functions.totalSupply, {});
  }
}

/// Event types
export type ApprovalEventArgs = EParams<typeof events.Approval>
export type ApprovalForAllEventArgs = EParams<typeof events.ApprovalForAll>
export type AuthorityUpdatedEventArgs = EParams<typeof events.AuthorityUpdated>
export type BatchMetadataUpdateEventArgs = EParams<typeof events.BatchMetadataUpdate>
export type InitializedEventArgs = EParams<typeof events.Initialized>
export type MetadataUpdateEventArgs = EParams<typeof events.MetadataUpdate>
export type PausedEventArgs = EParams<typeof events.Paused>
export type TransferEventArgs = EParams<typeof events.Transfer>
export type UnpausedEventArgs = EParams<typeof events.Unpaused>
export type UpgradedEventArgs = EParams<typeof events.Upgraded>

/// Function types
export type UPGRADE_INTERFACE_VERSIONParams = FunctionArguments<typeof functions.UPGRADE_INTERFACE_VERSION>
export type UPGRADE_INTERFACE_VERSIONReturn = FunctionReturn<typeof functions.UPGRADE_INTERFACE_VERSION>

export type AdminTransferParams = FunctionArguments<typeof functions.adminTransfer>
export type AdminTransferReturn = FunctionReturn<typeof functions.adminTransfer>

export type ApproveParams = FunctionArguments<typeof functions.approve>
export type ApproveReturn = FunctionReturn<typeof functions.approve>

export type AuthorityParams = FunctionArguments<typeof functions.authority>
export type AuthorityReturn = FunctionReturn<typeof functions.authority>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BatchMintNewParams = FunctionArguments<typeof functions.batchMintNew>
export type BatchMintNewReturn = FunctionReturn<typeof functions.batchMintNew>

export type BatchMintToParams = FunctionArguments<typeof functions.batchMintTo>
export type BatchMintToReturn = FunctionReturn<typeof functions.batchMintTo>

export type BurnParams = FunctionArguments<typeof functions.burn>
export type BurnReturn = FunctionReturn<typeof functions.burn>

export type ContractURIParams = FunctionArguments<typeof functions.contractURI>
export type ContractURIReturn = FunctionReturn<typeof functions.contractURI>

export type GetApprovedParams = FunctionArguments<typeof functions.getApproved>
export type GetApprovedReturn = FunctionReturn<typeof functions.getApproved>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type IsApprovedForAllParams = FunctionArguments<typeof functions.isApprovedForAll>
export type IsApprovedForAllReturn = FunctionReturn<typeof functions.isApprovedForAll>

export type IsConsumingScheduledOpParams = FunctionArguments<typeof functions.isConsumingScheduledOp>
export type IsConsumingScheduledOpReturn = FunctionReturn<typeof functions.isConsumingScheduledOp>

export type MintNewParams = FunctionArguments<typeof functions.mintNew>
export type MintNewReturn = FunctionReturn<typeof functions.mintNew>

export type MintToParams = FunctionArguments<typeof functions.mintTo>
export type MintToReturn = FunctionReturn<typeof functions.mintTo>

export type NameParams = FunctionArguments<typeof functions.name>
export type NameReturn = FunctionReturn<typeof functions.name>

export type OwnerOfParams = FunctionArguments<typeof functions.ownerOf>
export type OwnerOfReturn = FunctionReturn<typeof functions.ownerOf>

export type PauseParams = FunctionArguments<typeof functions.pause>
export type PauseReturn = FunctionReturn<typeof functions.pause>

export type PausedParams = FunctionArguments<typeof functions.paused>
export type PausedReturn = FunctionReturn<typeof functions.paused>

export type ProxiableUUIDParams = FunctionArguments<typeof functions.proxiableUUID>
export type ProxiableUUIDReturn = FunctionReturn<typeof functions.proxiableUUID>

export type RequestBatchMetadataUpdateParams = FunctionArguments<typeof functions.requestBatchMetadataUpdate>
export type RequestBatchMetadataUpdateReturn = FunctionReturn<typeof functions.requestBatchMetadataUpdate>

export type RequestMetadataUpdateParams = FunctionArguments<typeof functions.requestMetadataUpdate>
export type RequestMetadataUpdateReturn = FunctionReturn<typeof functions.requestMetadataUpdate>

export type RoyaltyInfoParams = FunctionArguments<typeof functions.royaltyInfo>
export type RoyaltyInfoReturn = FunctionReturn<typeof functions.royaltyInfo>

export type SafeTransferFromParams_0 = FunctionArguments<typeof functions["safeTransferFrom(address,address,uint256)"]>
export type SafeTransferFromReturn_0 = FunctionReturn<typeof functions["safeTransferFrom(address,address,uint256)"]>

export type SafeTransferFromParams_1 = FunctionArguments<typeof functions["safeTransferFrom(address,address,uint256,bytes)"]>
export type SafeTransferFromReturn_1 = FunctionReturn<typeof functions["safeTransferFrom(address,address,uint256,bytes)"]>

export type SetApprovalForAllParams = FunctionArguments<typeof functions.setApprovalForAll>
export type SetApprovalForAllReturn = FunctionReturn<typeof functions.setApprovalForAll>

export type SetAuthorityParams = FunctionArguments<typeof functions.setAuthority>
export type SetAuthorityReturn = FunctionReturn<typeof functions.setAuthority>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type SymbolParams = FunctionArguments<typeof functions.symbol>
export type SymbolReturn = FunctionReturn<typeof functions.symbol>

export type TokenByIndexParams = FunctionArguments<typeof functions.tokenByIndex>
export type TokenByIndexReturn = FunctionReturn<typeof functions.tokenByIndex>

export type TokenOfOwnerByIndexParams = FunctionArguments<typeof functions.tokenOfOwnerByIndex>
export type TokenOfOwnerByIndexReturn = FunctionReturn<typeof functions.tokenOfOwnerByIndex>

export type TokenURIParams = FunctionArguments<typeof functions.tokenURI>
export type TokenURIReturn = FunctionReturn<typeof functions.tokenURI>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferFromParams = FunctionArguments<typeof functions.transferFrom>
export type TransferFromReturn = FunctionReturn<typeof functions.transferFrom>

export type UnpauseParams = FunctionArguments<typeof functions.unpause>
export type UnpauseReturn = FunctionReturn<typeof functions.unpause>

export type UpgradeToAndCallParams = FunctionArguments<typeof functions.upgradeToAndCall>
export type UpgradeToAndCallReturn = FunctionReturn<typeof functions.upgradeToAndCall>
