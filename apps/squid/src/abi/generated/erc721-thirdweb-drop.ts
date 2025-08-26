import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    Approval: event("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", "Approval(address,address,uint256)", {"owner": indexed(p.address), "approved": indexed(p.address), "tokenId": indexed(p.uint256)}),
    ApprovalForAll: event("0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31", "ApprovalForAll(address,address,bool)", {"owner": indexed(p.address), "operator": indexed(p.address), "approved": p.bool}),
    BatchMetadataUpdate: event("0x6bd5c950a8d8df17f772f5af37cb3655737899cbf903264b9795592da439661c", "BatchMetadataUpdate(uint256,uint256)", {"_fromTokenId": p.uint256, "_toTokenId": p.uint256}),
    ClaimConditionsUpdated: event("0xbf4016fceeaaa4ac5cf4be865b559ff85825ab4ca7aa7b661d16e2f544c03098", "ClaimConditionsUpdated((uint256,uint256,uint256,uint256,bytes32,uint256,address,string)[],bool)", {"claimConditions": p.array(p.struct({"startTimestamp": p.uint256, "maxClaimableSupply": p.uint256, "supplyClaimed": p.uint256, "quantityLimitPerWallet": p.uint256, "merkleRoot": p.bytes32, "pricePerToken": p.uint256, "currency": p.address, "metadata": p.string})), "resetEligibility": p.bool}),
    ContractURIUpdated: event("0xc9c7c3fe08b88b4df9d4d47ef47d2c43d55c025a0ba88ca442580ed9e7348a16", "ContractURIUpdated(string,string)", {"prevURI": p.string, "newURI": p.string}),
    DefaultRoyalty: event("0x90d7ec04bcb8978719414f82e52e4cb651db41d0e6f8cea6118c2191e6183adb", "DefaultRoyalty(address,uint256)", {"newRoyaltyRecipient": indexed(p.address), "newRoyaltyBps": p.uint256}),
    FlatPlatformFeeUpdated: event("0xf8086cee80709bd44c82f89dbca54115ebd05e840a88ab81df9cf5be9754eb63", "FlatPlatformFeeUpdated(address,uint256)", {"platformFeeRecipient": p.address, "flatFee": p.uint256}),
    Initialized: event("0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498", "Initialized(uint8)", {"version": p.uint8}),
    MaxTotalSupplyUpdated: event("0xf2672935fc79f5237559e2e2999dbe743bf65430894ac2b37666890e7c69e1af", "MaxTotalSupplyUpdated(uint256)", {"maxTotalSupply": p.uint256}),
    MetadataFrozen: event("0xeef043febddf4e1d1cf1f72ff1407b84e036e805aa0934418cb82095da8d7164", "MetadataFrozen()", {}),
    OwnerUpdated: event("0x8292fce18fa69edf4db7b94ea2e58241df0ae57f97e0a6c9b29067028bf92d76", "OwnerUpdated(address,address)", {"prevOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    PlatformFeeInfoUpdated: event("0xe2497bd806ec41a6e0dd992c29a72efc0ef8fec9092d1978fd4a1e00b2f18304", "PlatformFeeInfoUpdated(address,uint256)", {"platformFeeRecipient": indexed(p.address), "platformFeeBps": p.uint256}),
    PlatformFeeTypeUpdated: event("0xd246da9440709ce0dd3f4fd669abc85ada012ab9774b8ecdcc5059ba1486b9c1", "PlatformFeeTypeUpdated(uint8)", {"feeType": p.uint8}),
    PrimarySaleRecipientUpdated: event("0x299d17e95023f496e0ffc4909cff1a61f74bb5eb18de6f900f4155bfa1b3b333", "PrimarySaleRecipientUpdated(address)", {"recipient": indexed(p.address)}),
    RoleAdminChanged: event("0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff", "RoleAdminChanged(bytes32,bytes32,bytes32)", {"role": indexed(p.bytes32), "previousAdminRole": indexed(p.bytes32), "newAdminRole": indexed(p.bytes32)}),
    RoleGranted: event("0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d", "RoleGranted(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoleRevoked: event("0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b", "RoleRevoked(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoyaltyForToken: event("0x7365cf4122f072a3365c20d54eff9b38d73c096c28e1892ec8f5b0e403a0f12d", "RoyaltyForToken(uint256,address,uint256)", {"tokenId": indexed(p.uint256), "royaltyRecipient": indexed(p.address), "royaltyBps": p.uint256}),
    TokenURIRevealed: event("0x6df1d8db2a036436ffe0b2d1833f2c5f1e624818dfce2578c0faa4b83ef9998d", "TokenURIRevealed(uint256,string)", {"index": indexed(p.uint256), "revealedURI": p.string}),
    TokensClaimed: event("0xfa76a4010d9533e3e964f2930a65fb6042a12fa6ff5b08281837a10b0be7321e", "TokensClaimed(uint256,address,address,uint256,uint256)", {"claimConditionIndex": indexed(p.uint256), "claimer": indexed(p.address), "receiver": indexed(p.address), "startTokenId": p.uint256, "quantityClaimed": p.uint256}),
    TokensLazyMinted: event("0x2a0365091ef1a40953c670dce28177e37520648a6fdc91506bffac0ab045570d", "TokensLazyMinted(uint256,uint256,string,bytes)", {"startTokenId": indexed(p.uint256), "endTokenId": p.uint256, "baseURI": p.string, "encryptedBaseURI": p.bytes}),
    Transfer: event("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", "Transfer(address,address,uint256)", {"from": indexed(p.address), "to": indexed(p.address), "tokenId": indexed(p.uint256)}),
}

export const functions = {
    DEFAULT_ADMIN_ROLE: viewFun("0xa217fddf", "DEFAULT_ADMIN_ROLE()", {}, p.bytes32),
    approve: fun("0x095ea7b3", "approve(address,uint256)", {"to": p.address, "tokenId": p.uint256}, ),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"owner": p.address}, p.uint256),
    batchFrozen: viewFun("0x83040532", "batchFrozen(uint256)", {"_0": p.uint256}, p.bool),
    burn: fun("0x42966c68", "burn(uint256)", {"tokenId": p.uint256}, ),
    claim: fun("0x84bb1e42", "claim(address,uint256,address,uint256,(bytes32[],uint256,uint256,address),bytes)", {"_receiver": p.address, "_quantity": p.uint256, "_currency": p.address, "_pricePerToken": p.uint256, "_allowlistProof": p.struct({"proof": p.array(p.bytes32), "quantityLimitPerWallet": p.uint256, "pricePerToken": p.uint256, "currency": p.address}), "_data": p.bytes}, ),
    claimCondition: viewFun("0xd637ed59", "claimCondition()", {}, {"currentStartId": p.uint256, "count": p.uint256}),
    contractType: viewFun("0xcb2ef6f7", "contractType()", {}, p.bytes32),
    contractURI: viewFun("0xe8a3d485", "contractURI()", {}, p.string),
    contractVersion: viewFun("0xa0a8e460", "contractVersion()", {}, p.uint8),
    encryptDecrypt: viewFun("0xe7150322", "encryptDecrypt(bytes,bytes)", {"data": p.bytes, "key": p.bytes}, p.bytes),
    encryptedData: viewFun("0xa05112fc", "encryptedData(uint256)", {"_0": p.uint256}, p.bytes),
    freezeBatchBaseURI: fun("0xa07ced9e", "freezeBatchBaseURI(uint256)", {"_index": p.uint256}, ),
    getActiveClaimConditionId: viewFun("0xc68907de", "getActiveClaimConditionId()", {}, p.uint256),
    getApproved: viewFun("0x081812fc", "getApproved(uint256)", {"tokenId": p.uint256}, p.address),
    getBaseURICount: viewFun("0x63b45e2d", "getBaseURICount()", {}, p.uint256),
    getBatchIdAtIndex: viewFun("0x2419f51b", "getBatchIdAtIndex(uint256)", {"_index": p.uint256}, p.uint256),
    getClaimConditionById: viewFun("0x6f8934f4", "getClaimConditionById(uint256)", {"_conditionId": p.uint256}, p.struct({"startTimestamp": p.uint256, "maxClaimableSupply": p.uint256, "supplyClaimed": p.uint256, "quantityLimitPerWallet": p.uint256, "merkleRoot": p.bytes32, "pricePerToken": p.uint256, "currency": p.address, "metadata": p.string})),
    getDefaultRoyaltyInfo: viewFun("0xb24f2d39", "getDefaultRoyaltyInfo()", {}, {"_0": p.address, "_1": p.uint16}),
    getFlatPlatformFeeInfo: viewFun("0xe57553da", "getFlatPlatformFeeInfo()", {}, {"_0": p.address, "_1": p.uint256}),
    getPlatformFeeInfo: viewFun("0xd45573f6", "getPlatformFeeInfo()", {}, {"_0": p.address, "_1": p.uint16}),
    getPlatformFeeType: viewFun("0xf28083c3", "getPlatformFeeType()", {}, p.uint8),
    getRevealURI: viewFun("0x9fc4d68f", "getRevealURI(uint256,bytes)", {"_batchId": p.uint256, "_key": p.bytes}, p.string),
    getRoleAdmin: viewFun("0x248a9ca3", "getRoleAdmin(bytes32)", {"role": p.bytes32}, p.bytes32),
    getRoleMember: viewFun("0x9010d07c", "getRoleMember(bytes32,uint256)", {"role": p.bytes32, "index": p.uint256}, p.address),
    getRoleMemberCount: viewFun("0xca15c873", "getRoleMemberCount(bytes32)", {"role": p.bytes32}, p.uint256),
    getRoyaltyInfoForToken: viewFun("0x4cc157df", "getRoyaltyInfoForToken(uint256)", {"_tokenId": p.uint256}, {"_0": p.address, "_1": p.uint16}),
    getSupplyClaimedByWallet: viewFun("0xad1eefc5", "getSupplyClaimedByWallet(uint256,address)", {"_conditionId": p.uint256, "_claimer": p.address}, p.uint256),
    grantRole: fun("0x2f2ff15d", "grantRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    hasRole: viewFun("0x91d14854", "hasRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.bool),
    hasRoleWithSwitch: viewFun("0xa32fa5b3", "hasRoleWithSwitch(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.bool),
    initialize: fun("0xe1591634", "initialize(address,string,string,string,address[],address,address,uint128,uint128,address)", {"_defaultAdmin": p.address, "_name": p.string, "_symbol": p.string, "_contractURI": p.string, "_trustedForwarders": p.array(p.address), "_saleRecipient": p.address, "_royaltyRecipient": p.address, "_royaltyBps": p.uint128, "_platformFeeBps": p.uint128, "_platformFeeRecipient": p.address}, ),
    isApprovedForAll: viewFun("0xe985e9c5", "isApprovedForAll(address,address)", {"owner": p.address, "operator": p.address}, p.bool),
    isEncryptedBatch: viewFun("0x492e224b", "isEncryptedBatch(uint256)", {"_batchId": p.uint256}, p.bool),
    isTrustedForwarder: viewFun("0x572b6c05", "isTrustedForwarder(address)", {"forwarder": p.address}, p.bool),
    lazyMint: fun("0xd37c353b", "lazyMint(uint256,string,bytes)", {"_amount": p.uint256, "_baseURIForTokens": p.string, "_data": p.bytes}, p.uint256),
    maxTotalSupply: viewFun("0x2ab4d052", "maxTotalSupply()", {}, p.uint256),
    multicall: fun("0xac9650d8", "multicall(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    name: viewFun("0x06fdde03", "name()", {}, p.string),
    nextTokenIdToClaim: viewFun("0xacd083f8", "nextTokenIdToClaim()", {}, p.uint256),
    nextTokenIdToMint: viewFun("0x3b1475a7", "nextTokenIdToMint()", {}, p.uint256),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    ownerOf: viewFun("0x6352211e", "ownerOf(uint256)", {"tokenId": p.uint256}, p.address),
    primarySaleRecipient: viewFun("0x079fe40e", "primarySaleRecipient()", {}, p.address),
    renounceRole: fun("0x36568abe", "renounceRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    reveal: fun("0xce805642", "reveal(uint256,bytes)", {"_index": p.uint256, "_key": p.bytes}, p.string),
    revokeRole: fun("0xd547741f", "revokeRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    royaltyInfo: viewFun("0x2a55205a", "royaltyInfo(uint256,uint256)", {"tokenId": p.uint256, "salePrice": p.uint256}, {"receiver": p.address, "royaltyAmount": p.uint256}),
    'safeTransferFrom(address,address,uint256)': fun("0x42842e0e", "safeTransferFrom(address,address,uint256)", {"from": p.address, "to": p.address, "tokenId": p.uint256}, ),
    'safeTransferFrom(address,address,uint256,bytes)': fun("0xb88d4fde", "safeTransferFrom(address,address,uint256,bytes)", {"from": p.address, "to": p.address, "tokenId": p.uint256, "_data": p.bytes}, ),
    setApprovalForAll: fun("0xa22cb465", "setApprovalForAll(address,bool)", {"operator": p.address, "approved": p.bool}, ),
    setClaimConditions: fun("0x74bc7db7", "setClaimConditions((uint256,uint256,uint256,uint256,bytes32,uint256,address,string)[],bool)", {"_conditions": p.array(p.struct({"startTimestamp": p.uint256, "maxClaimableSupply": p.uint256, "supplyClaimed": p.uint256, "quantityLimitPerWallet": p.uint256, "merkleRoot": p.bytes32, "pricePerToken": p.uint256, "currency": p.address, "metadata": p.string})), "_resetClaimEligibility": p.bool}, ),
    setContractURI: fun("0x938e3d7b", "setContractURI(string)", {"_uri": p.string}, ),
    setDefaultRoyaltyInfo: fun("0x600dd5ea", "setDefaultRoyaltyInfo(address,uint256)", {"_royaltyRecipient": p.address, "_royaltyBps": p.uint256}, ),
    setFlatPlatformFeeInfo: fun("0x7e54523c", "setFlatPlatformFeeInfo(address,uint256)", {"_platformFeeRecipient": p.address, "_flatFee": p.uint256}, ),
    setMaxTotalSupply: fun("0x3f3e4c11", "setMaxTotalSupply(uint256)", {"_maxTotalSupply": p.uint256}, ),
    setOwner: fun("0x13af4035", "setOwner(address)", {"_newOwner": p.address}, ),
    setPlatformFeeInfo: fun("0x1e7ac488", "setPlatformFeeInfo(address,uint256)", {"_platformFeeRecipient": p.address, "_platformFeeBps": p.uint256}, ),
    setPlatformFeeType: fun("0xb6f10c79", "setPlatformFeeType(uint8)", {"_feeType": p.uint8}, ),
    setPrimarySaleRecipient: fun("0x6f4f2837", "setPrimarySaleRecipient(address)", {"_saleRecipient": p.address}, ),
    setRoyaltyInfoForToken: fun("0x9bcf7a15", "setRoyaltyInfoForToken(uint256,address,uint256)", {"_tokenId": p.uint256, "_recipient": p.address, "_bps": p.uint256}, ),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    symbol: viewFun("0x95d89b41", "symbol()", {}, p.string),
    tokenURI: viewFun("0xc87b56dd", "tokenURI(uint256)", {"_tokenId": p.uint256}, p.string),
    totalMinted: viewFun("0xa2309ff8", "totalMinted()", {}, p.uint256),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transferFrom: fun("0x23b872dd", "transferFrom(address,address,uint256)", {"from": p.address, "to": p.address, "tokenId": p.uint256}, ),
    updateBatchBaseURI: fun("0xde903ddd", "updateBatchBaseURI(uint256,string)", {"_index": p.uint256, "_uri": p.string}, ),
    verifyClaim: viewFun("0x23a2902b", "verifyClaim(uint256,address,uint256,address,uint256,(bytes32[],uint256,uint256,address))", {"_conditionId": p.uint256, "_claimer": p.address, "_quantity": p.uint256, "_currency": p.address, "_pricePerToken": p.uint256, "_allowlistProof": p.struct({"proof": p.array(p.bytes32), "quantityLimitPerWallet": p.uint256, "pricePerToken": p.uint256, "currency": p.address})}, p.bool),
}

export class Contract extends ContractBase {

    DEFAULT_ADMIN_ROLE() {
        return this.eth_call(functions.DEFAULT_ADMIN_ROLE, {})
    }

    balanceOf(owner: BalanceOfParams["owner"]) {
        return this.eth_call(functions.balanceOf, {owner})
    }

    batchFrozen(_0: BatchFrozenParams["_0"]) {
        return this.eth_call(functions.batchFrozen, {_0})
    }

    claimCondition() {
        return this.eth_call(functions.claimCondition, {})
    }

    contractType() {
        return this.eth_call(functions.contractType, {})
    }

    contractURI() {
        return this.eth_call(functions.contractURI, {})
    }

    contractVersion() {
        return this.eth_call(functions.contractVersion, {})
    }

    encryptDecrypt(data: EncryptDecryptParams["data"], key: EncryptDecryptParams["key"]) {
        return this.eth_call(functions.encryptDecrypt, {data, key})
    }

    encryptedData(_0: EncryptedDataParams["_0"]) {
        return this.eth_call(functions.encryptedData, {_0})
    }

    getActiveClaimConditionId() {
        return this.eth_call(functions.getActiveClaimConditionId, {})
    }

    getApproved(tokenId: GetApprovedParams["tokenId"]) {
        return this.eth_call(functions.getApproved, {tokenId})
    }

    getBaseURICount() {
        return this.eth_call(functions.getBaseURICount, {})
    }

    getBatchIdAtIndex(_index: GetBatchIdAtIndexParams["_index"]) {
        return this.eth_call(functions.getBatchIdAtIndex, {_index})
    }

    getClaimConditionById(_conditionId: GetClaimConditionByIdParams["_conditionId"]) {
        return this.eth_call(functions.getClaimConditionById, {_conditionId})
    }

    getDefaultRoyaltyInfo() {
        return this.eth_call(functions.getDefaultRoyaltyInfo, {})
    }

    getFlatPlatformFeeInfo() {
        return this.eth_call(functions.getFlatPlatformFeeInfo, {})
    }

    getPlatformFeeInfo() {
        return this.eth_call(functions.getPlatformFeeInfo, {})
    }

    getPlatformFeeType() {
        return this.eth_call(functions.getPlatformFeeType, {})
    }

    getRevealURI(_batchId: GetRevealURIParams["_batchId"], _key: GetRevealURIParams["_key"]) {
        return this.eth_call(functions.getRevealURI, {_batchId, _key})
    }

    getRoleAdmin(role: GetRoleAdminParams["role"]) {
        return this.eth_call(functions.getRoleAdmin, {role})
    }

    getRoleMember(role: GetRoleMemberParams["role"], index: GetRoleMemberParams["index"]) {
        return this.eth_call(functions.getRoleMember, {role, index})
    }

    getRoleMemberCount(role: GetRoleMemberCountParams["role"]) {
        return this.eth_call(functions.getRoleMemberCount, {role})
    }

    getRoyaltyInfoForToken(_tokenId: GetRoyaltyInfoForTokenParams["_tokenId"]) {
        return this.eth_call(functions.getRoyaltyInfoForToken, {_tokenId})
    }

    getSupplyClaimedByWallet(_conditionId: GetSupplyClaimedByWalletParams["_conditionId"], _claimer: GetSupplyClaimedByWalletParams["_claimer"]) {
        return this.eth_call(functions.getSupplyClaimedByWallet, {_conditionId, _claimer})
    }

    hasRole(role: HasRoleParams["role"], account: HasRoleParams["account"]) {
        return this.eth_call(functions.hasRole, {role, account})
    }

    hasRoleWithSwitch(role: HasRoleWithSwitchParams["role"], account: HasRoleWithSwitchParams["account"]) {
        return this.eth_call(functions.hasRoleWithSwitch, {role, account})
    }

    isApprovedForAll(owner: IsApprovedForAllParams["owner"], operator: IsApprovedForAllParams["operator"]) {
        return this.eth_call(functions.isApprovedForAll, {owner, operator})
    }

    isEncryptedBatch(_batchId: IsEncryptedBatchParams["_batchId"]) {
        return this.eth_call(functions.isEncryptedBatch, {_batchId})
    }

    isTrustedForwarder(forwarder: IsTrustedForwarderParams["forwarder"]) {
        return this.eth_call(functions.isTrustedForwarder, {forwarder})
    }

    maxTotalSupply() {
        return this.eth_call(functions.maxTotalSupply, {})
    }

    name() {
        return this.eth_call(functions.name, {})
    }

    nextTokenIdToClaim() {
        return this.eth_call(functions.nextTokenIdToClaim, {})
    }

    nextTokenIdToMint() {
        return this.eth_call(functions.nextTokenIdToMint, {})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    ownerOf(tokenId: OwnerOfParams["tokenId"]) {
        return this.eth_call(functions.ownerOf, {tokenId})
    }

    primarySaleRecipient() {
        return this.eth_call(functions.primarySaleRecipient, {})
    }

    royaltyInfo(tokenId: RoyaltyInfoParams["tokenId"], salePrice: RoyaltyInfoParams["salePrice"]) {
        return this.eth_call(functions.royaltyInfo, {tokenId, salePrice})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }

    symbol() {
        return this.eth_call(functions.symbol, {})
    }

    tokenURI(_tokenId: TokenURIParams["_tokenId"]) {
        return this.eth_call(functions.tokenURI, {_tokenId})
    }

    totalMinted() {
        return this.eth_call(functions.totalMinted, {})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }

    verifyClaim(_conditionId: VerifyClaimParams["_conditionId"], _claimer: VerifyClaimParams["_claimer"], _quantity: VerifyClaimParams["_quantity"], _currency: VerifyClaimParams["_currency"], _pricePerToken: VerifyClaimParams["_pricePerToken"], _allowlistProof: VerifyClaimParams["_allowlistProof"]) {
        return this.eth_call(functions.verifyClaim, {_conditionId, _claimer, _quantity, _currency, _pricePerToken, _allowlistProof})
    }
}

/// Event types
export type ApprovalEventArgs = EParams<typeof events.Approval>
export type ApprovalForAllEventArgs = EParams<typeof events.ApprovalForAll>
export type BatchMetadataUpdateEventArgs = EParams<typeof events.BatchMetadataUpdate>
export type ClaimConditionsUpdatedEventArgs = EParams<typeof events.ClaimConditionsUpdated>
export type ContractURIUpdatedEventArgs = EParams<typeof events.ContractURIUpdated>
export type DefaultRoyaltyEventArgs = EParams<typeof events.DefaultRoyalty>
export type FlatPlatformFeeUpdatedEventArgs = EParams<typeof events.FlatPlatformFeeUpdated>
export type InitializedEventArgs = EParams<typeof events.Initialized>
export type MaxTotalSupplyUpdatedEventArgs = EParams<typeof events.MaxTotalSupplyUpdated>
export type MetadataFrozenEventArgs = EParams<typeof events.MetadataFrozen>
export type OwnerUpdatedEventArgs = EParams<typeof events.OwnerUpdated>
export type PlatformFeeInfoUpdatedEventArgs = EParams<typeof events.PlatformFeeInfoUpdated>
export type PlatformFeeTypeUpdatedEventArgs = EParams<typeof events.PlatformFeeTypeUpdated>
export type PrimarySaleRecipientUpdatedEventArgs = EParams<typeof events.PrimarySaleRecipientUpdated>
export type RoleAdminChangedEventArgs = EParams<typeof events.RoleAdminChanged>
export type RoleGrantedEventArgs = EParams<typeof events.RoleGranted>
export type RoleRevokedEventArgs = EParams<typeof events.RoleRevoked>
export type RoyaltyForTokenEventArgs = EParams<typeof events.RoyaltyForToken>
export type TokenURIRevealedEventArgs = EParams<typeof events.TokenURIRevealed>
export type TokensClaimedEventArgs = EParams<typeof events.TokensClaimed>
export type TokensLazyMintedEventArgs = EParams<typeof events.TokensLazyMinted>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type DEFAULT_ADMIN_ROLEParams = FunctionArguments<typeof functions.DEFAULT_ADMIN_ROLE>
export type DEFAULT_ADMIN_ROLEReturn = FunctionReturn<typeof functions.DEFAULT_ADMIN_ROLE>

export type ApproveParams = FunctionArguments<typeof functions.approve>
export type ApproveReturn = FunctionReturn<typeof functions.approve>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BatchFrozenParams = FunctionArguments<typeof functions.batchFrozen>
export type BatchFrozenReturn = FunctionReturn<typeof functions.batchFrozen>

export type BurnParams = FunctionArguments<typeof functions.burn>
export type BurnReturn = FunctionReturn<typeof functions.burn>

export type ClaimParams = FunctionArguments<typeof functions.claim>
export type ClaimReturn = FunctionReturn<typeof functions.claim>

export type ClaimConditionParams = FunctionArguments<typeof functions.claimCondition>
export type ClaimConditionReturn = FunctionReturn<typeof functions.claimCondition>

export type ContractTypeParams = FunctionArguments<typeof functions.contractType>
export type ContractTypeReturn = FunctionReturn<typeof functions.contractType>

export type ContractURIParams = FunctionArguments<typeof functions.contractURI>
export type ContractURIReturn = FunctionReturn<typeof functions.contractURI>

export type ContractVersionParams = FunctionArguments<typeof functions.contractVersion>
export type ContractVersionReturn = FunctionReturn<typeof functions.contractVersion>

export type EncryptDecryptParams = FunctionArguments<typeof functions.encryptDecrypt>
export type EncryptDecryptReturn = FunctionReturn<typeof functions.encryptDecrypt>

export type EncryptedDataParams = FunctionArguments<typeof functions.encryptedData>
export type EncryptedDataReturn = FunctionReturn<typeof functions.encryptedData>

export type FreezeBatchBaseURIParams = FunctionArguments<typeof functions.freezeBatchBaseURI>
export type FreezeBatchBaseURIReturn = FunctionReturn<typeof functions.freezeBatchBaseURI>

export type GetActiveClaimConditionIdParams = FunctionArguments<typeof functions.getActiveClaimConditionId>
export type GetActiveClaimConditionIdReturn = FunctionReturn<typeof functions.getActiveClaimConditionId>

export type GetApprovedParams = FunctionArguments<typeof functions.getApproved>
export type GetApprovedReturn = FunctionReturn<typeof functions.getApproved>

export type GetBaseURICountParams = FunctionArguments<typeof functions.getBaseURICount>
export type GetBaseURICountReturn = FunctionReturn<typeof functions.getBaseURICount>

export type GetBatchIdAtIndexParams = FunctionArguments<typeof functions.getBatchIdAtIndex>
export type GetBatchIdAtIndexReturn = FunctionReturn<typeof functions.getBatchIdAtIndex>

export type GetClaimConditionByIdParams = FunctionArguments<typeof functions.getClaimConditionById>
export type GetClaimConditionByIdReturn = FunctionReturn<typeof functions.getClaimConditionById>

export type GetDefaultRoyaltyInfoParams = FunctionArguments<typeof functions.getDefaultRoyaltyInfo>
export type GetDefaultRoyaltyInfoReturn = FunctionReturn<typeof functions.getDefaultRoyaltyInfo>

export type GetFlatPlatformFeeInfoParams = FunctionArguments<typeof functions.getFlatPlatformFeeInfo>
export type GetFlatPlatformFeeInfoReturn = FunctionReturn<typeof functions.getFlatPlatformFeeInfo>

export type GetPlatformFeeInfoParams = FunctionArguments<typeof functions.getPlatformFeeInfo>
export type GetPlatformFeeInfoReturn = FunctionReturn<typeof functions.getPlatformFeeInfo>

export type GetPlatformFeeTypeParams = FunctionArguments<typeof functions.getPlatformFeeType>
export type GetPlatformFeeTypeReturn = FunctionReturn<typeof functions.getPlatformFeeType>

export type GetRevealURIParams = FunctionArguments<typeof functions.getRevealURI>
export type GetRevealURIReturn = FunctionReturn<typeof functions.getRevealURI>

export type GetRoleAdminParams = FunctionArguments<typeof functions.getRoleAdmin>
export type GetRoleAdminReturn = FunctionReturn<typeof functions.getRoleAdmin>

export type GetRoleMemberParams = FunctionArguments<typeof functions.getRoleMember>
export type GetRoleMemberReturn = FunctionReturn<typeof functions.getRoleMember>

export type GetRoleMemberCountParams = FunctionArguments<typeof functions.getRoleMemberCount>
export type GetRoleMemberCountReturn = FunctionReturn<typeof functions.getRoleMemberCount>

export type GetRoyaltyInfoForTokenParams = FunctionArguments<typeof functions.getRoyaltyInfoForToken>
export type GetRoyaltyInfoForTokenReturn = FunctionReturn<typeof functions.getRoyaltyInfoForToken>

export type GetSupplyClaimedByWalletParams = FunctionArguments<typeof functions.getSupplyClaimedByWallet>
export type GetSupplyClaimedByWalletReturn = FunctionReturn<typeof functions.getSupplyClaimedByWallet>

export type GrantRoleParams = FunctionArguments<typeof functions.grantRole>
export type GrantRoleReturn = FunctionReturn<typeof functions.grantRole>

export type HasRoleParams = FunctionArguments<typeof functions.hasRole>
export type HasRoleReturn = FunctionReturn<typeof functions.hasRole>

export type HasRoleWithSwitchParams = FunctionArguments<typeof functions.hasRoleWithSwitch>
export type HasRoleWithSwitchReturn = FunctionReturn<typeof functions.hasRoleWithSwitch>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type IsApprovedForAllParams = FunctionArguments<typeof functions.isApprovedForAll>
export type IsApprovedForAllReturn = FunctionReturn<typeof functions.isApprovedForAll>

export type IsEncryptedBatchParams = FunctionArguments<typeof functions.isEncryptedBatch>
export type IsEncryptedBatchReturn = FunctionReturn<typeof functions.isEncryptedBatch>

export type IsTrustedForwarderParams = FunctionArguments<typeof functions.isTrustedForwarder>
export type IsTrustedForwarderReturn = FunctionReturn<typeof functions.isTrustedForwarder>

export type LazyMintParams = FunctionArguments<typeof functions.lazyMint>
export type LazyMintReturn = FunctionReturn<typeof functions.lazyMint>

export type MaxTotalSupplyParams = FunctionArguments<typeof functions.maxTotalSupply>
export type MaxTotalSupplyReturn = FunctionReturn<typeof functions.maxTotalSupply>

export type MulticallParams = FunctionArguments<typeof functions.multicall>
export type MulticallReturn = FunctionReturn<typeof functions.multicall>

export type NameParams = FunctionArguments<typeof functions.name>
export type NameReturn = FunctionReturn<typeof functions.name>

export type NextTokenIdToClaimParams = FunctionArguments<typeof functions.nextTokenIdToClaim>
export type NextTokenIdToClaimReturn = FunctionReturn<typeof functions.nextTokenIdToClaim>

export type NextTokenIdToMintParams = FunctionArguments<typeof functions.nextTokenIdToMint>
export type NextTokenIdToMintReturn = FunctionReturn<typeof functions.nextTokenIdToMint>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type OwnerOfParams = FunctionArguments<typeof functions.ownerOf>
export type OwnerOfReturn = FunctionReturn<typeof functions.ownerOf>

export type PrimarySaleRecipientParams = FunctionArguments<typeof functions.primarySaleRecipient>
export type PrimarySaleRecipientReturn = FunctionReturn<typeof functions.primarySaleRecipient>

export type RenounceRoleParams = FunctionArguments<typeof functions.renounceRole>
export type RenounceRoleReturn = FunctionReturn<typeof functions.renounceRole>

export type RevealParams = FunctionArguments<typeof functions.reveal>
export type RevealReturn = FunctionReturn<typeof functions.reveal>

export type RevokeRoleParams = FunctionArguments<typeof functions.revokeRole>
export type RevokeRoleReturn = FunctionReturn<typeof functions.revokeRole>

export type RoyaltyInfoParams = FunctionArguments<typeof functions.royaltyInfo>
export type RoyaltyInfoReturn = FunctionReturn<typeof functions.royaltyInfo>

export type SafeTransferFromParams_0 = FunctionArguments<typeof functions['safeTransferFrom(address,address,uint256)']>
export type SafeTransferFromReturn_0 = FunctionReturn<typeof functions['safeTransferFrom(address,address,uint256)']>

export type SafeTransferFromParams_1 = FunctionArguments<typeof functions['safeTransferFrom(address,address,uint256,bytes)']>
export type SafeTransferFromReturn_1 = FunctionReturn<typeof functions['safeTransferFrom(address,address,uint256,bytes)']>

export type SetApprovalForAllParams = FunctionArguments<typeof functions.setApprovalForAll>
export type SetApprovalForAllReturn = FunctionReturn<typeof functions.setApprovalForAll>

export type SetClaimConditionsParams = FunctionArguments<typeof functions.setClaimConditions>
export type SetClaimConditionsReturn = FunctionReturn<typeof functions.setClaimConditions>

export type SetContractURIParams = FunctionArguments<typeof functions.setContractURI>
export type SetContractURIReturn = FunctionReturn<typeof functions.setContractURI>

export type SetDefaultRoyaltyInfoParams = FunctionArguments<typeof functions.setDefaultRoyaltyInfo>
export type SetDefaultRoyaltyInfoReturn = FunctionReturn<typeof functions.setDefaultRoyaltyInfo>

export type SetFlatPlatformFeeInfoParams = FunctionArguments<typeof functions.setFlatPlatformFeeInfo>
export type SetFlatPlatformFeeInfoReturn = FunctionReturn<typeof functions.setFlatPlatformFeeInfo>

export type SetMaxTotalSupplyParams = FunctionArguments<typeof functions.setMaxTotalSupply>
export type SetMaxTotalSupplyReturn = FunctionReturn<typeof functions.setMaxTotalSupply>

export type SetOwnerParams = FunctionArguments<typeof functions.setOwner>
export type SetOwnerReturn = FunctionReturn<typeof functions.setOwner>

export type SetPlatformFeeInfoParams = FunctionArguments<typeof functions.setPlatformFeeInfo>
export type SetPlatformFeeInfoReturn = FunctionReturn<typeof functions.setPlatformFeeInfo>

export type SetPlatformFeeTypeParams = FunctionArguments<typeof functions.setPlatformFeeType>
export type SetPlatformFeeTypeReturn = FunctionReturn<typeof functions.setPlatformFeeType>

export type SetPrimarySaleRecipientParams = FunctionArguments<typeof functions.setPrimarySaleRecipient>
export type SetPrimarySaleRecipientReturn = FunctionReturn<typeof functions.setPrimarySaleRecipient>

export type SetRoyaltyInfoForTokenParams = FunctionArguments<typeof functions.setRoyaltyInfoForToken>
export type SetRoyaltyInfoForTokenReturn = FunctionReturn<typeof functions.setRoyaltyInfoForToken>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type SymbolParams = FunctionArguments<typeof functions.symbol>
export type SymbolReturn = FunctionReturn<typeof functions.symbol>

export type TokenURIParams = FunctionArguments<typeof functions.tokenURI>
export type TokenURIReturn = FunctionReturn<typeof functions.tokenURI>

export type TotalMintedParams = FunctionArguments<typeof functions.totalMinted>
export type TotalMintedReturn = FunctionReturn<typeof functions.totalMinted>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferFromParams = FunctionArguments<typeof functions.transferFrom>
export type TransferFromReturn = FunctionReturn<typeof functions.transferFrom>

export type UpdateBatchBaseURIParams = FunctionArguments<typeof functions.updateBatchBaseURI>
export type UpdateBatchBaseURIReturn = FunctionReturn<typeof functions.updateBatchBaseURI>

export type VerifyClaimParams = FunctionArguments<typeof functions.verifyClaim>
export type VerifyClaimReturn = FunctionReturn<typeof functions.verifyClaim>

