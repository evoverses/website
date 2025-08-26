import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    ContractURIUpdated: event("0xc9c7c3fe08b88b4df9d4d47ef47d2c43d55c025a0ba88ca442580ed9e7348a16", "ContractURIUpdated(string,string)", {"prevURI": p.string, "newURI": p.string}),
    ExtensionAdded: event("0xbb37a605de78ba6bc667aeaf438d0aae8247e6f48a8fad23730e4fbbb480abf3", "ExtensionAdded(string,address,((string,string,address),(bytes4,string)[]))", {"name": indexed(p.string), "implementation": indexed(p.address), "extension": p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))})}),
    ExtensionRemoved: event("0x3169a23cec9ad1a25ab59bbe00ecf8973dd840c745775ea8877041ef5ce65bcc", "ExtensionRemoved(string,((string,string,address),(bytes4,string)[]))", {"name": indexed(p.string), "extension": p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))})}),
    ExtensionReplaced: event("0x5f1ef2b136db521971a88818ce904a8e310082338afdc100212a312706642158", "ExtensionReplaced(string,address,((string,string,address),(bytes4,string)[]))", {"name": indexed(p.string), "implementation": indexed(p.address), "extension": p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))})}),
    FlatPlatformFeeUpdated: event("0xf8086cee80709bd44c82f89dbca54115ebd05e840a88ab81df9cf5be9754eb63", "FlatPlatformFeeUpdated(address,uint256)", {"platformFeeRecipient": p.address, "flatFee": p.uint256}),
    FunctionDisabled: event("0xbb931a9651175c9c82f86afbf6ad37a9141aa8d1d42bf798739be245a12e4e88", "FunctionDisabled(string,bytes4,(string,string,address))", {"name": indexed(p.string), "functionSelector": indexed(p.bytes4), "extMetadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address})}),
    FunctionEnabled: event("0x681115194e519bda23de4da5218f3bc38f5585eab7c6b7d5fa66caa4602f574d", "FunctionEnabled(string,bytes4,(bytes4,string),(string,string,address))", {"name": indexed(p.string), "functionSelector": indexed(p.bytes4), "extFunction": p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}), "extMetadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address})}),
    Initialized: event("0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498", "Initialized(uint8)", {"version": p.uint8}),
    PlatformFeeInfoUpdated: event("0xe2497bd806ec41a6e0dd992c29a72efc0ef8fec9092d1978fd4a1e00b2f18304", "PlatformFeeInfoUpdated(address,uint256)", {"platformFeeRecipient": indexed(p.address), "platformFeeBps": p.uint256}),
    PlatformFeeTypeUpdated: event("0xd246da9440709ce0dd3f4fd669abc85ada012ab9774b8ecdcc5059ba1486b9c1", "PlatformFeeTypeUpdated(uint8)", {"feeType": p.uint8}),
    RoleAdminChanged: event("0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff", "RoleAdminChanged(bytes32,bytes32,bytes32)", {"role": indexed(p.bytes32), "previousAdminRole": indexed(p.bytes32), "newAdminRole": indexed(p.bytes32)}),
    RoleGranted: event("0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d", "RoleGranted(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoleRevoked: event("0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b", "RoleRevoked(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoyaltyEngineUpdated: event("0xdb773077c54b973d26a2973b12d9e7e458768cbf218f12160d3ea5f015820ef9", "RoyaltyEngineUpdated(address,address)", {"previousAddress": indexed(p.address), "newAddress": indexed(p.address)}),
}

export const functions = {
    DEFAULT_ADMIN_ROLE: viewFun("0xa217fddf", "DEFAULT_ADMIN_ROLE()", {}, p.bytes32),
    _disableFunctionInExtension: fun("0x429eed80", "_disableFunctionInExtension(string,bytes4)", {"_extensionName": p.string, "_functionSelector": p.bytes4}, ),
    addExtension: fun("0xe05688fe", "addExtension(((string,string,address),(bytes4,string)[]))", {"_extension": p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))})}, ),
    contractType: viewFun("0xcb2ef6f7", "contractType()", {}, p.bytes32),
    contractURI: viewFun("0xe8a3d485", "contractURI()", {}, p.string),
    contractVersion: viewFun("0xa0a8e460", "contractVersion()", {}, p.uint8),
    defaultExtensions: viewFun("0x463c4864", "defaultExtensions()", {}, p.address),
    disableFunctionInExtension: fun("0x512cf914", "disableFunctionInExtension(string,bytes4)", {"_extensionName": p.string, "_functionSelector": p.bytes4}, ),
    enableFunctionInExtension: fun("0x8856a113", "enableFunctionInExtension(string,(bytes4,string))", {"_extensionName": p.string, "_function": p.struct({"functionSelector": p.bytes4, "functionSignature": p.string})}, ),
    getAllExtensions: viewFun("0x4a00cc48", "getAllExtensions()", {}, p.array(p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))}))),
    getExtension: viewFun("0xc22707ee", "getExtension(string)", {"extensionName": p.string}, p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))})),
    getFlatPlatformFeeInfo: viewFun("0xe57553da", "getFlatPlatformFeeInfo()", {}, {"_0": p.address, "_1": p.uint256}),
    getImplementationForFunction: viewFun("0xce0b6013", "getImplementationForFunction(bytes4)", {"_functionSelector": p.bytes4}, p.address),
    getMetadataForFunction: viewFun("0xa0dbaefd", "getMetadataForFunction(bytes4)", {"functionSelector": p.bytes4}, p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address})),
    getPlatformFeeInfo: viewFun("0xd45573f6", "getPlatformFeeInfo()", {}, {"_0": p.address, "_1": p.uint16}),
    getPlatformFeeType: viewFun("0xf28083c3", "getPlatformFeeType()", {}, p.uint8),
    getRoleAdmin: viewFun("0x248a9ca3", "getRoleAdmin(bytes32)", {"role": p.bytes32}, p.bytes32),
    getRoleMember: viewFun("0x9010d07c", "getRoleMember(bytes32,uint256)", {"role": p.bytes32, "index": p.uint256}, p.address),
    getRoleMemberCount: viewFun("0xca15c873", "getRoleMemberCount(bytes32)", {"role": p.bytes32}, p.uint256),
    getRoyalty: fun("0xf533b802", "getRoyalty(address,uint256,uint256)", {"tokenAddress": p.address, "tokenId": p.uint256, "value": p.uint256}, {"recipients": p.array(p.address), "amounts": p.array(p.uint256)}),
    getRoyaltyEngineAddress: viewFun("0x5a9ad231", "getRoyaltyEngineAddress()", {}, p.address),
    grantRole: fun("0x2f2ff15d", "grantRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    hasRole: viewFun("0x91d14854", "hasRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.bool),
    hasRoleWithSwitch: viewFun("0xa32fa5b3", "hasRoleWithSwitch(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.bool),
    initialize: fun("0xaaae5633", "initialize(address,string,address[],address,uint16)", {"_defaultAdmin": p.address, "_contractURI": p.string, "_trustedForwarders": p.array(p.address), "_platformFeeRecipient": p.address, "_platformFeeBps": p.uint16}, ),
    isTrustedForwarder: viewFun("0x572b6c05", "isTrustedForwarder(address)", {"forwarder": p.address}, p.bool),
    multicall: fun("0xac9650d8", "multicall(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    onERC1155BatchReceived: fun("0xbc197c81", "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)", {"_0": p.address, "_1": p.address, "_2": p.array(p.uint256), "_3": p.array(p.uint256), "_4": p.bytes}, p.bytes4),
    onERC1155Received: fun("0xf23a6e61", "onERC1155Received(address,address,uint256,uint256,bytes)", {"_0": p.address, "_1": p.address, "_2": p.uint256, "_3": p.uint256, "_4": p.bytes}, p.bytes4),
    onERC721Received: fun("0x150b7a02", "onERC721Received(address,address,uint256,bytes)", {"_0": p.address, "_1": p.address, "_2": p.uint256, "_3": p.bytes}, p.bytes4),
    removeExtension: fun("0xee7d2adf", "removeExtension(string)", {"_extensionName": p.string}, ),
    renounceRole: fun("0x36568abe", "renounceRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    replaceExtension: fun("0xc0562f6d", "replaceExtension(((string,string,address),(bytes4,string)[]))", {"_extension": p.struct({"metadata": p.struct({"name": p.string, "metadataURI": p.string, "implementation": p.address}), "functions": p.array(p.struct({"functionSelector": p.bytes4, "functionSignature": p.string}))})}, ),
    revokeRole: fun("0xd547741f", "revokeRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    setContractURI: fun("0x938e3d7b", "setContractURI(string)", {"_uri": p.string}, ),
    setFlatPlatformFeeInfo: fun("0x7e54523c", "setFlatPlatformFeeInfo(address,uint256)", {"_platformFeeRecipient": p.address, "_flatFee": p.uint256}, ),
    setPlatformFeeInfo: fun("0x1e7ac488", "setPlatformFeeInfo(address,uint256)", {"_platformFeeRecipient": p.address, "_platformFeeBps": p.uint256}, ),
    setPlatformFeeType: fun("0xb6f10c79", "setPlatformFeeType(uint8)", {"_feeType": p.uint8}, ),
    setRoyaltyEngine: fun("0x21ede032", "setRoyaltyEngine(address)", {"_royaltyEngineAddress": p.address}, ),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
}

export class Contract extends ContractBase {

    DEFAULT_ADMIN_ROLE() {
        return this.eth_call(functions.DEFAULT_ADMIN_ROLE, {})
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

    defaultExtensions() {
        return this.eth_call(functions.defaultExtensions, {})
    }

    getAllExtensions() {
        return this.eth_call(functions.getAllExtensions, {})
    }

    getExtension(extensionName: GetExtensionParams["extensionName"]) {
        return this.eth_call(functions.getExtension, {extensionName})
    }

    getFlatPlatformFeeInfo() {
        return this.eth_call(functions.getFlatPlatformFeeInfo, {})
    }

    getImplementationForFunction(_functionSelector: GetImplementationForFunctionParams["_functionSelector"]) {
        return this.eth_call(functions.getImplementationForFunction, {_functionSelector})
    }

    getMetadataForFunction(functionSelector: GetMetadataForFunctionParams["functionSelector"]) {
        return this.eth_call(functions.getMetadataForFunction, {functionSelector})
    }

    getPlatformFeeInfo() {
        return this.eth_call(functions.getPlatformFeeInfo, {})
    }

    getPlatformFeeType() {
        return this.eth_call(functions.getPlatformFeeType, {})
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

    getRoyaltyEngineAddress() {
        return this.eth_call(functions.getRoyaltyEngineAddress, {})
    }

    hasRole(role: HasRoleParams["role"], account: HasRoleParams["account"]) {
        return this.eth_call(functions.hasRole, {role, account})
    }

    hasRoleWithSwitch(role: HasRoleWithSwitchParams["role"], account: HasRoleWithSwitchParams["account"]) {
        return this.eth_call(functions.hasRoleWithSwitch, {role, account})
    }

    isTrustedForwarder(forwarder: IsTrustedForwarderParams["forwarder"]) {
        return this.eth_call(functions.isTrustedForwarder, {forwarder})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }
}

/// Event types
export type ContractURIUpdatedEventArgs = EParams<typeof events.ContractURIUpdated>
export type ExtensionAddedEventArgs = EParams<typeof events.ExtensionAdded>
export type ExtensionRemovedEventArgs = EParams<typeof events.ExtensionRemoved>
export type ExtensionReplacedEventArgs = EParams<typeof events.ExtensionReplaced>
export type FlatPlatformFeeUpdatedEventArgs = EParams<typeof events.FlatPlatformFeeUpdated>
export type FunctionDisabledEventArgs = EParams<typeof events.FunctionDisabled>
export type FunctionEnabledEventArgs = EParams<typeof events.FunctionEnabled>
export type InitializedEventArgs = EParams<typeof events.Initialized>
export type PlatformFeeInfoUpdatedEventArgs = EParams<typeof events.PlatformFeeInfoUpdated>
export type PlatformFeeTypeUpdatedEventArgs = EParams<typeof events.PlatformFeeTypeUpdated>
export type RoleAdminChangedEventArgs = EParams<typeof events.RoleAdminChanged>
export type RoleGrantedEventArgs = EParams<typeof events.RoleGranted>
export type RoleRevokedEventArgs = EParams<typeof events.RoleRevoked>
export type RoyaltyEngineUpdatedEventArgs = EParams<typeof events.RoyaltyEngineUpdated>

/// Function types
export type DEFAULT_ADMIN_ROLEParams = FunctionArguments<typeof functions.DEFAULT_ADMIN_ROLE>
export type DEFAULT_ADMIN_ROLEReturn = FunctionReturn<typeof functions.DEFAULT_ADMIN_ROLE>

export type _disableFunctionInExtensionParams = FunctionArguments<typeof functions._disableFunctionInExtension>
export type _disableFunctionInExtensionReturn = FunctionReturn<typeof functions._disableFunctionInExtension>

export type AddExtensionParams = FunctionArguments<typeof functions.addExtension>
export type AddExtensionReturn = FunctionReturn<typeof functions.addExtension>

export type ContractTypeParams = FunctionArguments<typeof functions.contractType>
export type ContractTypeReturn = FunctionReturn<typeof functions.contractType>

export type ContractURIParams = FunctionArguments<typeof functions.contractURI>
export type ContractURIReturn = FunctionReturn<typeof functions.contractURI>

export type ContractVersionParams = FunctionArguments<typeof functions.contractVersion>
export type ContractVersionReturn = FunctionReturn<typeof functions.contractVersion>

export type DefaultExtensionsParams = FunctionArguments<typeof functions.defaultExtensions>
export type DefaultExtensionsReturn = FunctionReturn<typeof functions.defaultExtensions>

export type DisableFunctionInExtensionParams = FunctionArguments<typeof functions.disableFunctionInExtension>
export type DisableFunctionInExtensionReturn = FunctionReturn<typeof functions.disableFunctionInExtension>

export type EnableFunctionInExtensionParams = FunctionArguments<typeof functions.enableFunctionInExtension>
export type EnableFunctionInExtensionReturn = FunctionReturn<typeof functions.enableFunctionInExtension>

export type GetAllExtensionsParams = FunctionArguments<typeof functions.getAllExtensions>
export type GetAllExtensionsReturn = FunctionReturn<typeof functions.getAllExtensions>

export type GetExtensionParams = FunctionArguments<typeof functions.getExtension>
export type GetExtensionReturn = FunctionReturn<typeof functions.getExtension>

export type GetFlatPlatformFeeInfoParams = FunctionArguments<typeof functions.getFlatPlatformFeeInfo>
export type GetFlatPlatformFeeInfoReturn = FunctionReturn<typeof functions.getFlatPlatformFeeInfo>

export type GetImplementationForFunctionParams = FunctionArguments<typeof functions.getImplementationForFunction>
export type GetImplementationForFunctionReturn = FunctionReturn<typeof functions.getImplementationForFunction>

export type GetMetadataForFunctionParams = FunctionArguments<typeof functions.getMetadataForFunction>
export type GetMetadataForFunctionReturn = FunctionReturn<typeof functions.getMetadataForFunction>

export type GetPlatformFeeInfoParams = FunctionArguments<typeof functions.getPlatformFeeInfo>
export type GetPlatformFeeInfoReturn = FunctionReturn<typeof functions.getPlatformFeeInfo>

export type GetPlatformFeeTypeParams = FunctionArguments<typeof functions.getPlatformFeeType>
export type GetPlatformFeeTypeReturn = FunctionReturn<typeof functions.getPlatformFeeType>

export type GetRoleAdminParams = FunctionArguments<typeof functions.getRoleAdmin>
export type GetRoleAdminReturn = FunctionReturn<typeof functions.getRoleAdmin>

export type GetRoleMemberParams = FunctionArguments<typeof functions.getRoleMember>
export type GetRoleMemberReturn = FunctionReturn<typeof functions.getRoleMember>

export type GetRoleMemberCountParams = FunctionArguments<typeof functions.getRoleMemberCount>
export type GetRoleMemberCountReturn = FunctionReturn<typeof functions.getRoleMemberCount>

export type GetRoyaltyParams = FunctionArguments<typeof functions.getRoyalty>
export type GetRoyaltyReturn = FunctionReturn<typeof functions.getRoyalty>

export type GetRoyaltyEngineAddressParams = FunctionArguments<typeof functions.getRoyaltyEngineAddress>
export type GetRoyaltyEngineAddressReturn = FunctionReturn<typeof functions.getRoyaltyEngineAddress>

export type GrantRoleParams = FunctionArguments<typeof functions.grantRole>
export type GrantRoleReturn = FunctionReturn<typeof functions.grantRole>

export type HasRoleParams = FunctionArguments<typeof functions.hasRole>
export type HasRoleReturn = FunctionReturn<typeof functions.hasRole>

export type HasRoleWithSwitchParams = FunctionArguments<typeof functions.hasRoleWithSwitch>
export type HasRoleWithSwitchReturn = FunctionReturn<typeof functions.hasRoleWithSwitch>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type IsTrustedForwarderParams = FunctionArguments<typeof functions.isTrustedForwarder>
export type IsTrustedForwarderReturn = FunctionReturn<typeof functions.isTrustedForwarder>

export type MulticallParams = FunctionArguments<typeof functions.multicall>
export type MulticallReturn = FunctionReturn<typeof functions.multicall>

export type OnERC1155BatchReceivedParams = FunctionArguments<typeof functions.onERC1155BatchReceived>
export type OnERC1155BatchReceivedReturn = FunctionReturn<typeof functions.onERC1155BatchReceived>

export type OnERC1155ReceivedParams = FunctionArguments<typeof functions.onERC1155Received>
export type OnERC1155ReceivedReturn = FunctionReturn<typeof functions.onERC1155Received>

export type OnERC721ReceivedParams = FunctionArguments<typeof functions.onERC721Received>
export type OnERC721ReceivedReturn = FunctionReturn<typeof functions.onERC721Received>

export type RemoveExtensionParams = FunctionArguments<typeof functions.removeExtension>
export type RemoveExtensionReturn = FunctionReturn<typeof functions.removeExtension>

export type RenounceRoleParams = FunctionArguments<typeof functions.renounceRole>
export type RenounceRoleReturn = FunctionReturn<typeof functions.renounceRole>

export type ReplaceExtensionParams = FunctionArguments<typeof functions.replaceExtension>
export type ReplaceExtensionReturn = FunctionReturn<typeof functions.replaceExtension>

export type RevokeRoleParams = FunctionArguments<typeof functions.revokeRole>
export type RevokeRoleReturn = FunctionReturn<typeof functions.revokeRole>

export type SetContractURIParams = FunctionArguments<typeof functions.setContractURI>
export type SetContractURIReturn = FunctionReturn<typeof functions.setContractURI>

export type SetFlatPlatformFeeInfoParams = FunctionArguments<typeof functions.setFlatPlatformFeeInfo>
export type SetFlatPlatformFeeInfoReturn = FunctionReturn<typeof functions.setFlatPlatformFeeInfo>

export type SetPlatformFeeInfoParams = FunctionArguments<typeof functions.setPlatformFeeInfo>
export type SetPlatformFeeInfoReturn = FunctionReturn<typeof functions.setPlatformFeeInfo>

export type SetPlatformFeeTypeParams = FunctionArguments<typeof functions.setPlatformFeeType>
export type SetPlatformFeeTypeReturn = FunctionReturn<typeof functions.setPlatformFeeType>

export type SetRoyaltyEngineParams = FunctionArguments<typeof functions.setRoyaltyEngine>
export type SetRoyaltyEngineReturn = FunctionReturn<typeof functions.setRoyaltyEngine>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

