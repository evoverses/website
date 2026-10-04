import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    AllowedSeaDropUpdated: event("0xbbd3b69c138de4d317d0bc4290282c4e1cbd1e58b579a5b4f114b598c237454d", "AllowedSeaDropUpdated(address[])", {"allowedSeaDrop": p.array(p.address)}),
    ConsecutiveTransfer: event("0xdeaa91b6123d068f5821d0fb0678463d1a8a6079fe8af5de3ce5e896dcf9133d", "ConsecutiveTransfer(uint256,uint256,address,address)", {"fromTokenId": indexed(p.uint256), "toTokenId": p.uint256, "from": indexed(p.address), "to": indexed(p.address)}),
    MaxSupplyUpdated: event("0x7810bd47de260c3e9ee10061cf438099dd12256c79485f12f94dbccc981e806c", "MaxSupplyUpdated(uint256)", {"newMaxSupply": p.uint256}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    PotentialOwnerUpdated: event("0x11a3cf439fb225bfe74225716b6774765670ec1060e3796802e62139d69974da", "PotentialOwnerUpdated(address)", {"newPotentialAdministrator": p.address}),
    ProvenanceHashUpdated: event("0x7c22004198bf87da0f0dab623c72e66ca1200f4454aa3b9ca30f436275428b7c", "ProvenanceHashUpdated(bytes32,bytes32)", {"previousHash": p.bytes32, "newHash": p.bytes32}),
    RoyaltyInfoUpdated: event("0xf21fccf4d64d86d532c4e4eb86c007b6ad57a460c27d724188625e755ec6cf6d", "RoyaltyInfoUpdated(address,uint256)", {"receiver": p.address, "bps": p.uint256}),
    SeaDropTokenDeployed: event("0xd7aca75208b9be5ffc04c6a01922020ffd62b55e68e502e317f5344960279af8", "SeaDropTokenDeployed()", {}),
    TransferValidatorUpdated: event("0xcc5dc080ff977b3c3a211fa63ab74f90f658f5ba9d3236e92c8f59570f442aac", "TransferValidatorUpdated(address,address)", {"oldValidator": p.address, "newValidator": p.address}),
}

export const functions = {
    acceptOwnership: fun("0x79ba5097", "acceptOwnership()", {}, ),
    baseURI: viewFun("0x6c0360eb", "baseURI()", {}, p.string),
    cancelOwnershipTransfer: fun("0x23452b9c", "cancelOwnershipTransfer()", {}, ),
    emitBatchMetadataUpdate: fun("0xa4830114", "emitBatchMetadataUpdate(uint256,uint256)", {"fromTokenId": p.uint256, "toTokenId": p.uint256}, ),
    getMintStats: viewFun("0x840e15d4", "getMintStats(address)", {"minter": p.address}, {"minterNumMinted": p.uint256, "currentTotalSupply": p.uint256, "maxSupply": p.uint256}),
    getTransferValidationFunction: viewFun("0x0d705df6", "getTransferValidationFunction()", {}, {"functionSignature": p.bytes4, "isViewFunction": p.bool}),
    getTransferValidator: viewFun("0x098144d4", "getTransferValidator()", {}, p.address),
    maxSupply: viewFun("0xd5abeb01", "maxSupply()", {}, p.uint256),
    mintSeaDrop: fun("0x64869dad", "mintSeaDrop(address,uint256)", {"minter": p.address, "quantity": p.uint256}, ),
    multiConfigure: fun("0x911f456b", "multiConfigure((uint256,string,string,address,(uint80,uint48,uint48,uint16,uint16,bool),string,(bytes32,string[],string),address,bytes32,address[],address[],address[],address[],address[],(uint80,uint16,uint48,uint48,uint8,uint32,uint16,bool)[],address[],address[],(uint80,uint24,uint40,uint40,uint40,uint16,uint16)[],address[]))", {"config": p.struct({"maxSupply": p.uint256, "baseURI": p.string, "contractURI": p.string, "seaDropImpl": p.address, "publicDrop": p.struct({"mintPrice": p.uint80, "startTime": p.uint48, "endTime": p.uint48, "maxTotalMintableByWallet": p.uint16, "feeBps": p.uint16, "restrictFeeRecipients": p.bool}), "dropURI": p.string, "allowListData": p.struct({"merkleRoot": p.bytes32, "publicKeyURIs": p.array(p.string), "allowListURI": p.string}), "creatorPayoutAddress": p.address, "provenanceHash": p.bytes32, "allowedFeeRecipients": p.array(p.address), "disallowedFeeRecipients": p.array(p.address), "allowedPayers": p.array(p.address), "disallowedPayers": p.array(p.address), "tokenGatedAllowedNftTokens": p.array(p.address), "tokenGatedDropStages": p.array(p.struct({"mintPrice": p.uint80, "maxTotalMintableByWallet": p.uint16, "startTime": p.uint48, "endTime": p.uint48, "dropStageIndex": p.uint8, "maxTokenSupplyForStage": p.uint32, "feeBps": p.uint16, "restrictFeeRecipients": p.bool})), "disallowedTokenGatedAllowedNftTokens": p.array(p.address), "signers": p.array(p.address), "signedMintValidationParams": p.array(p.struct({"minMintPrice": p.uint80, "maxMaxTotalMintableByWallet": p.uint24, "minStartTime": p.uint40, "maxEndTime": p.uint40, "maxMaxTokenSupplyForStage": p.uint40, "minFeeBps": p.uint16, "maxFeeBps": p.uint16})), "disallowedSigners": p.array(p.address)})}, ),
    provenanceHash: viewFun("0xc6ab67a3", "provenanceHash()", {}, p.bytes32),
    renounceOwnership: fun("0x715018a6", "renounceOwnership()", {}, ),
    royaltyAddress: viewFun("0xad2f852a", "royaltyAddress()", {}, p.address),
    royaltyBasisPoints: viewFun("0x42260b5d", "royaltyBasisPoints()", {}, p.uint256),
    setBaseURI: fun("0x55f804b3", "setBaseURI(string)", {"newBaseURI": p.string}, ),
    setMaxSupply: fun("0x6f8b44b0", "setMaxSupply(uint256)", {"newMaxSupply": p.uint256}, ),
    setProvenanceHash: fun("0x099b6bfa", "setProvenanceHash(bytes32)", {"newProvenanceHash": p.bytes32}, ),
    setRoyaltyInfo: fun("0x44dae42c", "setRoyaltyInfo((address,uint96))", {"newInfo": p.struct({"royaltyAddress": p.address, "royaltyBps": p.uint96})}, ),
    setTransferValidator: fun("0xa9fc664e", "setTransferValidator(address)", {"newValidator": p.address}, ),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newPotentialOwner": p.address}, ),
    updateAllowList: fun("0x3680620d", "updateAllowList(address,(bytes32,string[],string))", {"seaDropImpl": p.address, "allowListData": p.struct({"merkleRoot": p.bytes32, "publicKeyURIs": p.array(p.string), "allowListURI": p.string})}, ),
    updateAllowedFeeRecipient: fun("0x48a4c101", "updateAllowedFeeRecipient(address,address,bool)", {"seaDropImpl": p.address, "feeRecipient": p.address, "allowed": p.bool}, ),
    updateAllowedSeaDrop: fun("0x60c308b6", "updateAllowedSeaDrop(address[])", {"allowedSeaDrop": p.array(p.address)}, ),
    updateCreatorPayoutAddress: fun("0x66251b69", "updateCreatorPayoutAddress(address,address)", {"seaDropImpl": p.address, "payoutAddress": p.address}, ),
    updateDropURI: fun("0x7a05bc82", "updateDropURI(address,string)", {"seaDropImpl": p.address, "dropURI": p.string}, ),
    updatePayer: fun("0xcb743ba8", "updatePayer(address,address,bool)", {"seaDropImpl": p.address, "payer": p.address, "allowed": p.bool}, ),
    updatePublicDrop: fun("0x1b73593c", "updatePublicDrop(address,(uint80,uint48,uint48,uint16,uint16,bool))", {"seaDropImpl": p.address, "publicDrop": p.struct({"mintPrice": p.uint80, "startTime": p.uint48, "endTime": p.uint48, "maxTotalMintableByWallet": p.uint16, "feeBps": p.uint16, "restrictFeeRecipients": p.bool})}, ),
    updateSignedMintValidationParams: fun("0x511aa644", "updateSignedMintValidationParams(address,address,(uint80,uint24,uint40,uint40,uint40,uint16,uint16))", {"seaDropImpl": p.address, "signer": p.address, "signedMintValidationParams": p.struct({"minMintPrice": p.uint80, "maxMaxTotalMintableByWallet": p.uint24, "minStartTime": p.uint40, "maxEndTime": p.uint40, "maxMaxTokenSupplyForStage": p.uint40, "minFeeBps": p.uint16, "maxFeeBps": p.uint16})}, ),
    updateTokenGatedDrop: fun("0x7bc2be76", "updateTokenGatedDrop(address,address,(uint80,uint16,uint48,uint48,uint8,uint32,uint16,bool))", {"seaDropImpl": p.address, "allowedNftToken": p.address, "dropStage": p.struct({"mintPrice": p.uint80, "maxTotalMintableByWallet": p.uint16, "startTime": p.uint48, "endTime": p.uint48, "dropStageIndex": p.uint8, "maxTokenSupplyForStage": p.uint32, "feeBps": p.uint16, "restrictFeeRecipients": p.bool})}, ),
}

export class Contract extends ContractBase {

    baseURI() {
        return this.eth_call(functions.baseURI, {})
    }

    getMintStats(minter: GetMintStatsParams["minter"]) {
        return this.eth_call(functions.getMintStats, {minter})
    }

    getTransferValidationFunction() {
        return this.eth_call(functions.getTransferValidationFunction, {})
    }

    getTransferValidator() {
        return this.eth_call(functions.getTransferValidator, {})
    }

    maxSupply() {
        return this.eth_call(functions.maxSupply, {})
    }

    provenanceHash() {
        return this.eth_call(functions.provenanceHash, {})
    }

    royaltyAddress() {
        return this.eth_call(functions.royaltyAddress, {})
    }

    royaltyBasisPoints() {
        return this.eth_call(functions.royaltyBasisPoints, {})
    }
}

/// Event types
export type AllowedSeaDropUpdatedEventArgs = EParams<typeof events.AllowedSeaDropUpdated>
export type ConsecutiveTransferEventArgs = EParams<typeof events.ConsecutiveTransfer>
export type MaxSupplyUpdatedEventArgs = EParams<typeof events.MaxSupplyUpdated>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>
export type PotentialOwnerUpdatedEventArgs = EParams<typeof events.PotentialOwnerUpdated>
export type ProvenanceHashUpdatedEventArgs = EParams<typeof events.ProvenanceHashUpdated>
export type RoyaltyInfoUpdatedEventArgs = EParams<typeof events.RoyaltyInfoUpdated>
export type SeaDropTokenDeployedEventArgs = EParams<typeof events.SeaDropTokenDeployed>
export type TransferValidatorUpdatedEventArgs = EParams<typeof events.TransferValidatorUpdated>

/// Function types
export type AcceptOwnershipParams = FunctionArguments<typeof functions.acceptOwnership>
export type AcceptOwnershipReturn = FunctionReturn<typeof functions.acceptOwnership>

export type BaseURIParams = FunctionArguments<typeof functions.baseURI>
export type BaseURIReturn = FunctionReturn<typeof functions.baseURI>

export type CancelOwnershipTransferParams = FunctionArguments<typeof functions.cancelOwnershipTransfer>
export type CancelOwnershipTransferReturn = FunctionReturn<typeof functions.cancelOwnershipTransfer>

export type EmitBatchMetadataUpdateParams = FunctionArguments<typeof functions.emitBatchMetadataUpdate>
export type EmitBatchMetadataUpdateReturn = FunctionReturn<typeof functions.emitBatchMetadataUpdate>

export type GetMintStatsParams = FunctionArguments<typeof functions.getMintStats>
export type GetMintStatsReturn = FunctionReturn<typeof functions.getMintStats>

export type GetTransferValidationFunctionParams = FunctionArguments<typeof functions.getTransferValidationFunction>
export type GetTransferValidationFunctionReturn = FunctionReturn<typeof functions.getTransferValidationFunction>

export type GetTransferValidatorParams = FunctionArguments<typeof functions.getTransferValidator>
export type GetTransferValidatorReturn = FunctionReturn<typeof functions.getTransferValidator>

export type MaxSupplyParams = FunctionArguments<typeof functions.maxSupply>
export type MaxSupplyReturn = FunctionReturn<typeof functions.maxSupply>

export type MintSeaDropParams = FunctionArguments<typeof functions.mintSeaDrop>
export type MintSeaDropReturn = FunctionReturn<typeof functions.mintSeaDrop>

export type MultiConfigureParams = FunctionArguments<typeof functions.multiConfigure>
export type MultiConfigureReturn = FunctionReturn<typeof functions.multiConfigure>

export type ProvenanceHashParams = FunctionArguments<typeof functions.provenanceHash>
export type ProvenanceHashReturn = FunctionReturn<typeof functions.provenanceHash>

export type RenounceOwnershipParams = FunctionArguments<typeof functions.renounceOwnership>
export type RenounceOwnershipReturn = FunctionReturn<typeof functions.renounceOwnership>

export type RoyaltyAddressParams = FunctionArguments<typeof functions.royaltyAddress>
export type RoyaltyAddressReturn = FunctionReturn<typeof functions.royaltyAddress>

export type RoyaltyBasisPointsParams = FunctionArguments<typeof functions.royaltyBasisPoints>
export type RoyaltyBasisPointsReturn = FunctionReturn<typeof functions.royaltyBasisPoints>

export type SetBaseURIParams = FunctionArguments<typeof functions.setBaseURI>
export type SetBaseURIReturn = FunctionReturn<typeof functions.setBaseURI>

export type SetMaxSupplyParams = FunctionArguments<typeof functions.setMaxSupply>
export type SetMaxSupplyReturn = FunctionReturn<typeof functions.setMaxSupply>

export type SetProvenanceHashParams = FunctionArguments<typeof functions.setProvenanceHash>
export type SetProvenanceHashReturn = FunctionReturn<typeof functions.setProvenanceHash>

export type SetRoyaltyInfoParams = FunctionArguments<typeof functions.setRoyaltyInfo>
export type SetRoyaltyInfoReturn = FunctionReturn<typeof functions.setRoyaltyInfo>

export type SetTransferValidatorParams = FunctionArguments<typeof functions.setTransferValidator>
export type SetTransferValidatorReturn = FunctionReturn<typeof functions.setTransferValidator>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

export type UpdateAllowListParams = FunctionArguments<typeof functions.updateAllowList>
export type UpdateAllowListReturn = FunctionReturn<typeof functions.updateAllowList>

export type UpdateAllowedFeeRecipientParams = FunctionArguments<typeof functions.updateAllowedFeeRecipient>
export type UpdateAllowedFeeRecipientReturn = FunctionReturn<typeof functions.updateAllowedFeeRecipient>

export type UpdateAllowedSeaDropParams = FunctionArguments<typeof functions.updateAllowedSeaDrop>
export type UpdateAllowedSeaDropReturn = FunctionReturn<typeof functions.updateAllowedSeaDrop>

export type UpdateCreatorPayoutAddressParams = FunctionArguments<typeof functions.updateCreatorPayoutAddress>
export type UpdateCreatorPayoutAddressReturn = FunctionReturn<typeof functions.updateCreatorPayoutAddress>

export type UpdateDropURIParams = FunctionArguments<typeof functions.updateDropURI>
export type UpdateDropURIReturn = FunctionReturn<typeof functions.updateDropURI>

export type UpdatePayerParams = FunctionArguments<typeof functions.updatePayer>
export type UpdatePayerReturn = FunctionReturn<typeof functions.updatePayer>

export type UpdatePublicDropParams = FunctionArguments<typeof functions.updatePublicDrop>
export type UpdatePublicDropReturn = FunctionReturn<typeof functions.updatePublicDrop>

export type UpdateSignedMintValidationParamsParams = FunctionArguments<typeof functions.updateSignedMintValidationParams>
export type UpdateSignedMintValidationParamsReturn = FunctionReturn<typeof functions.updateSignedMintValidationParams>

export type UpdateTokenGatedDropParams = FunctionArguments<typeof functions.updateTokenGatedDrop>
export type UpdateTokenGatedDropReturn = FunctionReturn<typeof functions.updateTokenGatedDrop>

