import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    BuyerApprovedForListing: event("0x3b557e1ed3b963f7473508fd10c6d7248b593c0dde6acd2a566b92caec84038a", "BuyerApprovedForListing(uint256,address,bool)", {"listingId": indexed(p.uint256), "buyer": indexed(p.address), "approved": p.bool}),
    CancelledListing: event("0xf6e9b23c95dec70093b0abc1cf13bc5d35c9af03743f941904a4ef664e0119fb", "CancelledListing(address,uint256)", {"listingCreator": indexed(p.address), "listingId": indexed(p.uint256)}),
    CurrencyApprovedForListing: event("0x928cc552fea23b15fbd5c6b45fbfc5935c5b4a6397d7fdab884164648a777cf2", "CurrencyApprovedForListing(uint256,address,uint256)", {"listingId": indexed(p.uint256), "currency": indexed(p.address), "pricePerToken": p.uint256}),
    NewListing: event("0xef309e3999c4dd6a4c1e4af6221896b7e5ccf9e7fc4fe5b218b883ce9190d7ad", "NewListing(address,uint256,address,(uint256,uint256,uint256,uint256,uint128,uint128,address,address,address,uint8,uint8,bool))", {"listingCreator": indexed(p.address), "listingId": indexed(p.uint256), "assetContract": indexed(p.address), "listing": p.struct({"listingId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "listingCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8, "reserved": p.bool})}),
    NewSale: event("0xf6e03f1c408cfd2d118397c912a4b576683c43b41b015e3d7c212bac0cd0e7c7", "NewSale(address,uint256,address,uint256,address,uint256,uint256)", {"listingCreator": indexed(p.address), "listingId": indexed(p.uint256), "assetContract": indexed(p.address), "tokenId": p.uint256, "buyer": p.address, "quantityBought": p.uint256, "totalPricePaid": p.uint256}),
    UpdatedListing: event("0xfa5081de2649236db88a34c443c2fc130da7324d781893a7fc4a0d6be33a8156", "UpdatedListing(address,uint256,address,(uint256,uint256,uint256,uint256,uint128,uint128,address,address,address,uint8,uint8,bool))", {"listingCreator": indexed(p.address), "listingId": indexed(p.uint256), "assetContract": indexed(p.address), "listing": p.struct({"listingId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "listingCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8, "reserved": p.bool})}),
}

export const functions = {
    approveBuyerForListing: fun("0x48dd77df", "approveBuyerForListing(uint256,address,bool)", {"_listingId": p.uint256, "_buyer": p.address, "_toApprove": p.bool}, ),
    approveCurrencyForListing: fun("0xea8f9a3c", "approveCurrencyForListing(uint256,address,uint256)", {"_listingId": p.uint256, "_currency": p.address, "_pricePerTokenInCurrency": p.uint256}, ),
    buyFromListing: fun("0x704232dc", "buyFromListing(uint256,address,uint256,address,uint256)", {"_listingId": p.uint256, "_buyFor": p.address, "_quantity": p.uint256, "_currency": p.address, "_expectedTotalPrice": p.uint256}, ),
    cancelListing: fun("0x305a67a8", "cancelListing(uint256)", {"_listingId": p.uint256}, ),
    createListing: fun("0x746415b5", "createListing((address,uint256,uint256,address,uint256,uint128,uint128,bool))", {"_params": p.struct({"assetContract": p.address, "tokenId": p.uint256, "quantity": p.uint256, "currency": p.address, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "reserved": p.bool})}, p.uint256),
    getAllListings: viewFun("0xc5275fb0", "getAllListings(uint256,uint256)", {"_startId": p.uint256, "_endId": p.uint256}, p.array(p.struct({"listingId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "listingCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8, "reserved": p.bool}))),
    getAllValidListings: viewFun("0x31654b4d", "getAllValidListings(uint256,uint256)", {"_startId": p.uint256, "_endId": p.uint256}, p.array(p.struct({"listingId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "listingCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8, "reserved": p.bool}))),
    getListing: viewFun("0x107a274a", "getListing(uint256)", {"_listingId": p.uint256}, p.struct({"listingId": p.uint256, "tokenId": p.uint256, "quantity": p.uint256, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "listingCreator": p.address, "assetContract": p.address, "currency": p.address, "tokenType": p.uint8, "status": p.uint8, "reserved": p.bool})),
    totalListings: viewFun("0xc78b616c", "totalListings()", {}, p.uint256),
    updateListing: fun("0x07b67758", "updateListing(uint256,(address,uint256,uint256,address,uint256,uint128,uint128,bool))", {"_listingId": p.uint256, "_params": p.struct({"assetContract": p.address, "tokenId": p.uint256, "quantity": p.uint256, "currency": p.address, "pricePerToken": p.uint256, "startTimestamp": p.uint128, "endTimestamp": p.uint128, "reserved": p.bool})}, ),
}

export class Contract extends ContractBase {

    getAllListings(_startId: GetAllListingsParams["_startId"], _endId: GetAllListingsParams["_endId"]) {
        return this.eth_call(functions.getAllListings, {_startId, _endId})
    }

    getAllValidListings(_startId: GetAllValidListingsParams["_startId"], _endId: GetAllValidListingsParams["_endId"]) {
        return this.eth_call(functions.getAllValidListings, {_startId, _endId})
    }

    getListing(_listingId: GetListingParams["_listingId"]) {
        return this.eth_call(functions.getListing, {_listingId})
    }

    totalListings() {
        return this.eth_call(functions.totalListings, {})
    }
}

/// Event types
export type BuyerApprovedForListingEventArgs = EParams<typeof events.BuyerApprovedForListing>
export type CancelledListingEventArgs = EParams<typeof events.CancelledListing>
export type CurrencyApprovedForListingEventArgs = EParams<typeof events.CurrencyApprovedForListing>
export type NewListingEventArgs = EParams<typeof events.NewListing>
export type NewSaleEventArgs = EParams<typeof events.NewSale>
export type UpdatedListingEventArgs = EParams<typeof events.UpdatedListing>

/// Function types
export type ApproveBuyerForListingParams = FunctionArguments<typeof functions.approveBuyerForListing>
export type ApproveBuyerForListingReturn = FunctionReturn<typeof functions.approveBuyerForListing>

export type ApproveCurrencyForListingParams = FunctionArguments<typeof functions.approveCurrencyForListing>
export type ApproveCurrencyForListingReturn = FunctionReturn<typeof functions.approveCurrencyForListing>

export type BuyFromListingParams = FunctionArguments<typeof functions.buyFromListing>
export type BuyFromListingReturn = FunctionReturn<typeof functions.buyFromListing>

export type CancelListingParams = FunctionArguments<typeof functions.cancelListing>
export type CancelListingReturn = FunctionReturn<typeof functions.cancelListing>

export type CreateListingParams = FunctionArguments<typeof functions.createListing>
export type CreateListingReturn = FunctionReturn<typeof functions.createListing>

export type GetAllListingsParams = FunctionArguments<typeof functions.getAllListings>
export type GetAllListingsReturn = FunctionReturn<typeof functions.getAllListings>

export type GetAllValidListingsParams = FunctionArguments<typeof functions.getAllValidListings>
export type GetAllValidListingsReturn = FunctionReturn<typeof functions.getAllValidListings>

export type GetListingParams = FunctionArguments<typeof functions.getListing>
export type GetListingReturn = FunctionReturn<typeof functions.getListing>

export type TotalListingsParams = FunctionArguments<typeof functions.totalListings>
export type TotalListingsReturn = FunctionReturn<typeof functions.totalListings>

export type UpdateListingParams = FunctionArguments<typeof functions.updateListing>
export type UpdateListingReturn = FunctionReturn<typeof functions.updateListing>

