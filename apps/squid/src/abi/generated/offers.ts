import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    AcceptedOffer: event("0xc3888b4f8640ff369e48089b45596f4adc2e39c73dc7fc6e609f2ad05f879540", "AcceptedOffer(address,uint256,address,uint256,address,uint256,uint256)", {"offeror": indexed(p.address), "offerId": indexed(p.uint256), "assetContract": indexed(p.address), "tokenId": p.uint256, "seller": p.address, "quantityBought": p.uint256, "totalPricePaid": p.uint256}),
    CancelledOffer: event("0x26c37611219fb1f3253d3027b738bb3e678ed39b193c956cb48193e6431478d3", "CancelledOffer(address,uint256)", {"offeror": indexed(p.address), "offerId": indexed(p.uint256)}),
    NewOffer: event("0x8a597d224658d6f05ad676ddd666a25096b0bf7eff59d873ccbe943f8a3313ae", "NewOffer(address,uint256,address,(uint256,uint256,uint256,uint256,uint256,address,address,address,uint8,uint8))", {"offeror": indexed(p.address), "offerId": indexed(p.uint256), "assetContract": indexed(p.address), "offer": p.struct({"offerId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "totalPrice": p.uint256, "expirationTimestamp": p.uint256, "offeror": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8})}),
}

export const functions = {
    acceptOffer: fun("0xc815729d", "acceptOffer(uint256)", {"_offerId": p.uint256}, ),
    cancelOffer: fun("0xef706adf", "cancelOffer(uint256)", {"_offerId": p.uint256}, ),
    getAllOffers: viewFun("0xc1edcfbe", "getAllOffers(uint256,uint256)", {"_startId": p.uint256, "_endId": p.uint256}, p.array(p.struct({"offerId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "totalPrice": p.uint256, "expirationTimestamp": p.uint256, "offeror": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8}))),
    getAllValidOffers: viewFun("0x91940b3e", "getAllValidOffers(uint256,uint256)", {"_startId": p.uint256, "_endId": p.uint256}, p.array(p.struct({"offerId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "totalPrice": p.uint256, "expirationTimestamp": p.uint256, "offeror": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8}))),
    getOffer: viewFun("0x4579268a", "getOffer(uint256)", {"_offerId": p.uint256}, p.struct({"offerId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "totalPrice": p.uint256, "expirationTimestamp": p.uint256, "offeror": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8})),
    makeOffer: fun("0x016767fa", "makeOffer((address,uint256,uint256,address,uint256,uint256))", {"_params": p.struct({"assetContract": p.address, "tokenId": p.uint256, "quantity": p.uint256, "currency": p.address, "totalPrice": p.uint256, "expirationTimestamp": p.uint256})}, p.uint256),
}

export class Contract extends ContractBase {

    getAllOffers(_startId: GetAllOffersParams["_startId"], _endId: GetAllOffersParams["_endId"]) {
        return this.eth_call(functions.getAllOffers, {_startId, _endId})
    }

    getAllValidOffers(_startId: GetAllValidOffersParams["_startId"], _endId: GetAllValidOffersParams["_endId"]) {
        return this.eth_call(functions.getAllValidOffers, {_startId, _endId})
    }

    getOffer(_offerId: GetOfferParams["_offerId"]) {
        return this.eth_call(functions.getOffer, {_offerId})
    }
}

/// Event types
export type AcceptedOfferEventArgs = EParams<typeof events.AcceptedOffer>
export type CancelledOfferEventArgs = EParams<typeof events.CancelledOffer>
export type NewOfferEventArgs = EParams<typeof events.NewOffer>

/// Function types
export type AcceptOfferParams = FunctionArguments<typeof functions.acceptOffer>
export type AcceptOfferReturn = FunctionReturn<typeof functions.acceptOffer>

export type CancelOfferParams = FunctionArguments<typeof functions.cancelOffer>
export type CancelOfferReturn = FunctionReturn<typeof functions.cancelOffer>

export type GetAllOffersParams = FunctionArguments<typeof functions.getAllOffers>
export type GetAllOffersReturn = FunctionReturn<typeof functions.getAllOffers>

export type GetAllValidOffersParams = FunctionArguments<typeof functions.getAllValidOffers>
export type GetAllValidOffersReturn = FunctionReturn<typeof functions.getAllValidOffers>

export type GetOfferParams = FunctionArguments<typeof functions.getOffer>
export type GetOfferReturn = FunctionReturn<typeof functions.getOffer>

export type MakeOfferParams = FunctionArguments<typeof functions.makeOffer>
export type MakeOfferReturn = FunctionReturn<typeof functions.makeOffer>

