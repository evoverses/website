import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    AuctionClosed: event("0x7003143824ad94e684efcfd33e097dd7cd0e67243daf20f345f5186a9a7ba00a", "AuctionClosed(uint256,address,address,uint256,address,address)", {"auctionId": indexed(p.uint256), "assetContract": indexed(p.address), "closer": indexed(p.address), "tokenId": p.uint256, "auctionCreator": p.address, "winningBidder": p.address}),
    CancelledAuction: event("0xd68d26ab7202e0ff43e7ee058c16686e737f214c5832bfc1dd2fbb0518f60d8e", "CancelledAuction(address,uint256)", {"auctionCreator": indexed(p.address), "auctionId": indexed(p.uint256)}),
    NewAuction: event("0x5afd538bb1e7fc354db91c5dc4876ea2321a22fb8fbb69c84bda1f84ce1f45df", "NewAuction(address,uint256,address,(uint256,uint256,uint256,uint256,uint256,uint64,uint64,uint64,uint64,address,address,address,uint8,uint8))", {"auctionCreator": indexed(p.address), "auctionId": indexed(p.uint256), "assetContract": indexed(p.address), "auction": p.struct({"auctionId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "minimumBidAmount": p.uint256, "buyoutBidAmount": p.uint256, "timeBufferInSeconds": p.uint64, "bidBufferBps": p.uint64, "startTimestamp": p.uint64, "endTimestamp": p.uint64, "auctionCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8})}),
    NewBid: event("0x433a278e1c55403e97ab8ffef6ce9fddd5d1fb2695745bbc3affbe0b8106ec6b", "NewBid(uint256,address,address,uint256,(uint256,uint256,uint256,uint256,uint256,uint64,uint64,uint64,uint64,address,address,address,uint8,uint8))", {"auctionId": indexed(p.uint256), "bidder": indexed(p.address), "assetContract": indexed(p.address), "bidAmount": p.uint256, "auction": p.struct({"auctionId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "minimumBidAmount": p.uint256, "buyoutBidAmount": p.uint256, "timeBufferInSeconds": p.uint64, "bidBufferBps": p.uint64, "startTimestamp": p.uint64, "endTimestamp": p.uint64, "auctionCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8})}),
}

export const functions = {
    bidInAuction: fun("0x0858e5ad", "bidInAuction(uint256,uint256)", {"_auctionId": p.uint256, "_bidAmount": p.uint256}, ),
    cancelAuction: fun("0x96b5a755", "cancelAuction(uint256)", {"_auctionId": p.uint256}, ),
    collectAuctionPayout: fun("0xebf05a62", "collectAuctionPayout(uint256)", {"_auctionId": p.uint256}, ),
    collectAuctionTokens: fun("0x03a54fe0", "collectAuctionTokens(uint256)", {"_auctionId": p.uint256}, ),
    createAuction: fun("0x16654d40", "createAuction((address,uint256,uint256,address,uint256,uint256,uint64,uint64,uint64,uint64))", {"_params": p.struct({"assetContract": p.address, "tokenId": p.uint256, "quantity": p.uint256, "currency": p.address, "minimumBidAmount": p.uint256, "buyoutBidAmount": p.uint256, "timeBufferInSeconds": p.uint64, "bidBufferBps": p.uint64, "startTimestamp": p.uint64, "endTimestamp": p.uint64})}, p.uint256),
    getAllAuctions: viewFun("0xc291537c", "getAllAuctions(uint256,uint256)", {"_startId": p.uint256, "_endId": p.uint256}, p.array(p.struct({"auctionId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "minimumBidAmount": p.uint256, "buyoutBidAmount": p.uint256, "timeBufferInSeconds": p.uint64, "bidBufferBps": p.uint64, "startTimestamp": p.uint64, "endTimestamp": p.uint64, "auctionCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8}))),
    getAllValidAuctions: viewFun("0x7b063801", "getAllValidAuctions(uint256,uint256)", {"_startId": p.uint256, "_endId": p.uint256}, p.array(p.struct({"auctionId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "minimumBidAmount": p.uint256, "buyoutBidAmount": p.uint256, "timeBufferInSeconds": p.uint64, "bidBufferBps": p.uint64, "startTimestamp": p.uint64, "endTimestamp": p.uint64, "auctionCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8}))),
    getAuction: viewFun("0x78bd7935", "getAuction(uint256)", {"_auctionId": p.uint256}, p.struct({"auctionId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "minimumBidAmount": p.uint256, "buyoutBidAmount": p.uint256, "timeBufferInSeconds": p.uint64, "bidBufferBps": p.uint64, "startTimestamp": p.uint64, "endTimestamp": p.uint64, "auctionCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8})),
    getWinningBid: viewFun("0x6891939d", "getWinningBid(uint256)", {"_auctionId": p.uint256}, {"bidder": p.address, "currency": p.address, "bidAmount": p.uint256}),
    isAuctionExpired: viewFun("0x1389b117", "isAuctionExpired(uint256)", {"_auctionId": p.uint256}, p.bool),
    isNewWinningBid: viewFun("0x2eb566bd", "isNewWinningBid(uint256,uint256)", {"_auctionId": p.uint256, "_bidAmount": p.uint256}, p.bool),
}

export class Contract extends ContractBase {

    getAllAuctions(_startId: GetAllAuctionsParams["_startId"], _endId: GetAllAuctionsParams["_endId"]) {
        return this.eth_call(functions.getAllAuctions, {_startId, _endId})
    }

    getAllValidAuctions(_startId: GetAllValidAuctionsParams["_startId"], _endId: GetAllValidAuctionsParams["_endId"]) {
        return this.eth_call(functions.getAllValidAuctions, {_startId, _endId})
    }

    getAuction(_auctionId: GetAuctionParams["_auctionId"]) {
        return this.eth_call(functions.getAuction, {_auctionId})
    }

    getWinningBid(_auctionId: GetWinningBidParams["_auctionId"]) {
        return this.eth_call(functions.getWinningBid, {_auctionId})
    }

    isAuctionExpired(_auctionId: IsAuctionExpiredParams["_auctionId"]) {
        return this.eth_call(functions.isAuctionExpired, {_auctionId})
    }

    isNewWinningBid(_auctionId: IsNewWinningBidParams["_auctionId"], _bidAmount: IsNewWinningBidParams["_bidAmount"]) {
        return this.eth_call(functions.isNewWinningBid, {_auctionId, _bidAmount})
    }
}

/// Event types
export type AuctionClosedEventArgs = EParams<typeof events.AuctionClosed>
export type CancelledAuctionEventArgs = EParams<typeof events.CancelledAuction>
export type NewAuctionEventArgs = EParams<typeof events.NewAuction>
export type NewBidEventArgs = EParams<typeof events.NewBid>

/// Function types
export type BidInAuctionParams = FunctionArguments<typeof functions.bidInAuction>
export type BidInAuctionReturn = FunctionReturn<typeof functions.bidInAuction>

export type CancelAuctionParams = FunctionArguments<typeof functions.cancelAuction>
export type CancelAuctionReturn = FunctionReturn<typeof functions.cancelAuction>

export type CollectAuctionPayoutParams = FunctionArguments<typeof functions.collectAuctionPayout>
export type CollectAuctionPayoutReturn = FunctionReturn<typeof functions.collectAuctionPayout>

export type CollectAuctionTokensParams = FunctionArguments<typeof functions.collectAuctionTokens>
export type CollectAuctionTokensReturn = FunctionReturn<typeof functions.collectAuctionTokens>

export type CreateAuctionParams = FunctionArguments<typeof functions.createAuction>
export type CreateAuctionReturn = FunctionReturn<typeof functions.createAuction>

export type GetAllAuctionsParams = FunctionArguments<typeof functions.getAllAuctions>
export type GetAllAuctionsReturn = FunctionReturn<typeof functions.getAllAuctions>

export type GetAllValidAuctionsParams = FunctionArguments<typeof functions.getAllValidAuctions>
export type GetAllValidAuctionsReturn = FunctionReturn<typeof functions.getAllValidAuctions>

export type GetAuctionParams = FunctionArguments<typeof functions.getAuction>
export type GetAuctionReturn = FunctionReturn<typeof functions.getAuction>

export type GetWinningBidParams = FunctionArguments<typeof functions.getWinningBid>
export type GetWinningBidReturn = FunctionReturn<typeof functions.getWinningBid>

export type IsAuctionExpiredParams = FunctionArguments<typeof functions.isAuctionExpired>
export type IsAuctionExpiredReturn = FunctionReturn<typeof functions.isAuctionExpired>

export type IsNewWinningBidParams = FunctionArguments<typeof functions.isNewWinningBid>
export type IsNewWinningBidReturn = FunctionReturn<typeof functions.isNewWinningBid>

