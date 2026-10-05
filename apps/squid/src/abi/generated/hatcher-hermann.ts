import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    AdultImported: event("0x97ef5d5fe239e2c88ce1e42c63a1dbbf4fcd7bf7d599a42d06b6b1d12a0be4cb", "AdultImported(uint256,bytes32)", {"tokenId": indexed(p.uint256), "snapshotHash": p.bytes32}),
    EggHatched: event("0x3b12f0ccbfa0cf610dfd1a9d1cfac260675b6a537f4b3e0ebd25d6e973bca92e", "EggHatched(uint256,uint256,bytes32)", {"tokenId": indexed(p.uint256), "vrfRequestId": indexed(p.uint256), "traitsHash": p.bytes32}),
    EggRecorded: event("0xeb8243379058ae36db8b08169e91465d5df1ba09ae046f963c19170374dbd1fd", "EggRecorded(uint256,uint256,uint256,uint256,uint256)", {"tokenId": indexed(p.uint256), "parent1": p.uint256, "parent2": p.uint256, "species": p.uint256, "generation": p.uint256}),
    EggTreated: event("0xdc54ff7773f29ea56d5472f96ac283a611db976fdcbb07dde30da9569bf029d5", "EggTreated(uint256,address)", {"tokenId": indexed(p.uint256), "payer": indexed(p.address)}),
    HatchRequested: event("0xf1ffce6b9cb0c520fd455aaef1f55d97f5f656a8397cf66ad6d8567de0042b13", "HatchRequested(uint256,uint256,address)", {"tokenId": indexed(p.uint256), "vrfRequestId": indexed(p.uint256), "payer": indexed(p.address)}),
}

export const functions = {
    adultOf: viewFun("0xc95ad283", "adultOf(uint256)", {"tokenId": p.uint256}, p.struct({"species": p.uint256, "generation": p.uint256, "totalBreeds": p.uint256, "lastBreedTime": p.uint256, "attributes": p.struct({"gender": p.uint256, "rarity": p.uint256, "primaryType": p.uint256, "secondaryType": p.uint256, "nature": p.uint256, "size": p.uint256}), "stats": p.struct({"health": p.uint256, "attack": p.uint256, "defense": p.uint256, "special": p.uint256, "resistance": p.uint256, "speed": p.uint256})})),
    eggs: viewFun("0xbb654efa", "eggs(uint256)", {"_0": p.uint256}, {"parent1": p.uint256, "parent2": p.uint256, "speciesVersion": p.uint256, "createdAt": p.uint256, "treated": p.bool, "status": p.uint8, "vrfRequestId": p.uint256}),
    evoNft: viewFun("0xa99d47bc", "evoNft()", {}, p.address),
    getSpeciesPool: viewFun("0x3251884a", "getSpeciesPool(uint256)", {"version": p.uint256}, p.array(p.struct({"id": p.uint256, "enabled": p.bool, "weight": p.uint256, "malePercentage": p.uint256, "primaryType": p.uint256, "secondaryType": p.uint256}))),
    known: viewFun("0x2f49fb96", "known(uint256)", {"_0": p.uint256}, p.bool),
}

export class Contract extends ContractBase {

    adultOf(tokenId: AdultOfParams["tokenId"]) {
        return this.eth_call(functions.adultOf, {tokenId})
    }

    eggs(_0: EggsParams["_0"]) {
        return this.eth_call(functions.eggs, {_0})
    }

    evoNft() {
        return this.eth_call(functions.evoNft, {})
    }

    getSpeciesPool(version: GetSpeciesPoolParams["version"]) {
        return this.eth_call(functions.getSpeciesPool, {version})
    }

    known(_0: KnownParams["_0"]) {
        return this.eth_call(functions.known, {_0})
    }
}

/// Event types
export type AdultImportedEventArgs = EParams<typeof events.AdultImported>
export type EggHatchedEventArgs = EParams<typeof events.EggHatched>
export type EggRecordedEventArgs = EParams<typeof events.EggRecorded>
export type EggTreatedEventArgs = EParams<typeof events.EggTreated>
export type HatchRequestedEventArgs = EParams<typeof events.HatchRequested>

/// Function types
export type AdultOfParams = FunctionArguments<typeof functions.adultOf>
export type AdultOfReturn = FunctionReturn<typeof functions.adultOf>

export type EggsParams = FunctionArguments<typeof functions.eggs>
export type EggsReturn = FunctionReturn<typeof functions.eggs>

export type EvoNftParams = FunctionArguments<typeof functions.evoNft>
export type EvoNftReturn = FunctionReturn<typeof functions.evoNft>

export type GetSpeciesPoolParams = FunctionArguments<typeof functions.getSpeciesPool>
export type GetSpeciesPoolReturn = FunctionReturn<typeof functions.getSpeciesPool>

export type KnownParams = FunctionArguments<typeof functions.known>
export type KnownReturn = FunctionReturn<typeof functions.known>
