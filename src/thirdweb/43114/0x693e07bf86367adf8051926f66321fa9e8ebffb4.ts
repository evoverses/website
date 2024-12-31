import {
  type AbiParameterToPrimitiveType,
  type BaseTransactionOptions,
  prepareContractCall,
  prepareEvent,
  readContract,
} from "thirdweb";

/**
 * Contract events
 */

/**
 * Represents the filters for the "Approval" event.
 */
export type ApprovalEventFilters = Partial<{
  owner: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }>
  spender: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "address",
    "name": "spender",
    "type": "address"
  }>
}>;

/**
 * Creates an event object for the Approval event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { approvalEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  approvalEvent({
 *  owner: ...,
 *  spender: ...,
 * })
 * ],
 * });
 * ```
 */
export function approvalEvent(filters: ApprovalEventFilters = {}) {
  return prepareEvent({
    signature: "event Approval(address indexed owner, address indexed spender, uint256 value)",
    filters,
  });
};

/**
 * Creates an event object for the AuthorityUpdated event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { authorityUpdatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  authorityUpdatedEvent()
 * ],
 * });
 * ```
 */
export function authorityUpdatedEvent() {
  return prepareEvent({
    signature: "event AuthorityUpdated(address authority)",
  });
};

/**
 * Creates an event object for the Initialized event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { initializedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  initializedEvent()
 * ],
 * });
 * ```
 */
export function initializedEvent() {
  return prepareEvent({
    signature: "event Initialized(uint64 version)",
  });
};

/**
 * Creates an event object for the Paused event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { pausedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  pausedEvent()
 * ],
 * });
 * ```
 */
export function pausedEvent() {
  return prepareEvent({
    signature: "event Paused(address account)",
  });
};

/**
 * Represents the filters for the "Transfer" event.
 */
export type TransferEventFilters = Partial<{
  from: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }>
  to: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "to", "type": "address" }>
}>;

/**
 * Creates an event object for the Transfer event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { transferEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  transferEvent({
 *  from: ...,
 *  to: ...,
 * })
 * ],
 * });
 * ```
 */
export function transferEvent(filters: TransferEventFilters = {}) {
  return prepareEvent({
    signature: "event Transfer(address indexed from, address indexed to, uint256 value)",
    filters,
  });
};

/**
 * Creates an event object for the Unpaused event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { unpausedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  unpausedEvent()
 * ],
 * });
 * ```
 */
export function unpausedEvent() {
  return prepareEvent({
    signature: "event Unpaused(address account)",
  });
};

/**
 * Represents the filters for the "Upgraded" event.
 */
export type UpgradedEventFilters = Partial<{
  implementation: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "address",
    "name": "implementation",
    "type": "address"
  }>
}>;

/**
 * Creates an event object for the Upgraded event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { upgradedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  upgradedEvent({
 *  implementation: ...,
 * })
 * ],
 * });
 * ```
 */
export function upgradedEvent(filters: UpgradedEventFilters = {}) {
  return prepareEvent({
    signature: "event Upgraded(address indexed implementation)",
    filters,
  });
};

/**
 * Contract read functions
 */

/**
 * Calls the "UPGRADE_INTERFACE_VERSION" function on the contract.
 * @param options - The options for the UPGRADE_INTERFACE_VERSION function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { UPGRADE_INTERFACE_VERSION } from "TODO";
 *
 * const result = await UPGRADE_INTERFACE_VERSION();
 *
 * ```
 */
export async function UPGRADE_INTERFACE_VERSION(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xad3cb1cc",
      [],
      [
        {
          "internalType": "string",
          "name": "",
          "type": "string",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Represents the parameters for the "allowance" function.
 */
export type AllowanceParams = {
  owner: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "owner", "type": "address" }>
  spender: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "spender", "type": "address" }>
};

/**
 * Calls the "allowance" function on the contract.
 * @param options - The options for the allowance function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { allowance } from "TODO";
 *
 * const result = await allowance({
 *  owner: ...,
 *  spender: ...,
 * });
 *
 * ```
 */
export async function allowance(
  options: BaseTransactionOptions<AllowanceParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xdd62ed3e",
      [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address",
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address",
        },
      ],
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.owner, options.spender ],
  });
};

/**
 * Calls the "authority" function on the contract.
 * @param options - The options for the authority function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { authority } from "TODO";
 *
 * const result = await authority();
 *
 * ```
 */
export async function authority(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xbf7e214f",
      [],
      [
        {
          "internalType": "address",
          "name": "",
          "type": "address",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Represents the parameters for the "balanceOf" function.
 */
export type BalanceOfParams = {
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
};

/**
 * Calls the "balanceOf" function on the contract.
 * @param options - The options for the balanceOf function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { balanceOf } from "TODO";
 *
 * const result = await balanceOf({
 *  account: ...,
 * });
 *
 * ```
 */
export async function balanceOf(
  options: BaseTransactionOptions<BalanceOfParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x70a08231",
      [
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
        },
      ],
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.account ],
  });
};

/**
 * Calls the "decimals" function on the contract.
 * @param options - The options for the decimals function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { decimals } from "TODO";
 *
 * const result = await decimals();
 *
 * ```
 */
export async function decimals(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x313ce567",
      [],
      [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "isConsumingScheduledOp" function on the contract.
 * @param options - The options for the isConsumingScheduledOp function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isConsumingScheduledOp } from "TODO";
 *
 * const result = await isConsumingScheduledOp();
 *
 * ```
 */
export async function isConsumingScheduledOp(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x8fb36037",
      [],
      [
        {
          "internalType": "bytes4",
          "name": "",
          "type": "bytes4",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "name" function on the contract.
 * @param options - The options for the name function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { name } from "TODO";
 *
 * const result = await name();
 *
 * ```
 */
export async function name(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x06fdde03",
      [],
      [
        {
          "internalType": "string",
          "name": "",
          "type": "string",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "paused" function on the contract.
 * @param options - The options for the paused function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { paused } from "TODO";
 *
 * const result = await paused();
 *
 * ```
 */
export async function paused(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x5c975abb",
      [],
      [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "proxiableUUID" function on the contract.
 * @param options - The options for the proxiableUUID function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { proxiableUUID } from "TODO";
 *
 * const result = await proxiableUUID();
 *
 * ```
 */
export async function proxiableUUID(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x52d1902d",
      [],
      [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "symbol" function on the contract.
 * @param options - The options for the symbol function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { symbol } from "TODO";
 *
 * const result = await symbol();
 *
 * ```
 */
export async function symbol(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x95d89b41",
      [],
      [
        {
          "internalType": "string",
          "name": "",
          "type": "string",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "totalSupply" function on the contract.
 * @param options - The options for the totalSupply function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { totalSupply } from "TODO";
 *
 * const result = await totalSupply();
 *
 * ```
 */
export async function totalSupply(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x18160ddd",
      [],
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Contract write functions
 */

/**
 * Represents the parameters for the "approve" function.
 */
export type ApproveParams = {
  spender: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "spender", "type": "address" }>
  value: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "value", "type": "uint256" }>
};

/**
 * Calls the "approve" function on the contract.
 * @param options - The options for the "approve" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { approve } from "TODO";
 *
 * const transaction = approve({
 *  spender: ...,
 *  value: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function approve(
  options: BaseTransactionOptions<ApproveParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x095ea7b3",
      [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256",
        },
      ],
      [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool",
        },
      ],
    ],
    params: [ options.spender, options.value ],
  });
};

/**
 * Represents the parameters for the "batchBurn" function.
 */
export type BatchBurnParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address[]", "name": "to", "type": "address[]" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "amount", "type": "uint256[]" }>
};

/**
 * Calls the "batchBurn" function on the contract.
 * @param options - The options for the "batchBurn" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { batchBurn } from "TODO";
 *
 * const transaction = batchBurn({
 *  to: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function batchBurn(
  options: BaseTransactionOptions<BatchBurnParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x4a6cc677",
      [
        {
          "internalType": "address[]",
          "name": "to",
          "type": "address[]",
        },
        {
          "internalType": "uint256[]",
          "name": "amount",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.to, options.amount ],
  });
};

/**
 * Represents the parameters for the "batchMint" function.
 */
export type BatchMintParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address[]", "name": "to", "type": "address[]" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "amount", "type": "uint256[]" }>
};

/**
 * Calls the "batchMint" function on the contract.
 * @param options - The options for the "batchMint" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { batchMint } from "TODO";
 *
 * const transaction = batchMint({
 *  to: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function batchMint(
  options: BaseTransactionOptions<BatchMintParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x68573107",
      [
        {
          "internalType": "address[]",
          "name": "to",
          "type": "address[]",
        },
        {
          "internalType": "uint256[]",
          "name": "amount",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.to, options.amount ],
  });
};

/**
 * Represents the parameters for the "burn" function.
 */
export type BurnParams = {
  value: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "value", "type": "uint256" }>
};

/**
 * Calls the "burn" function on the contract.
 * @param options - The options for the "burn" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { burn } from "TODO";
 *
 * const transaction = burn({
 *  value: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function burn(
  options: BaseTransactionOptions<BurnParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x42966c68",
      [
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.value ],
  });
};

/**
 * Represents the parameters for the "burnFrom" function.
 */
export type BurnFromParams = {
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
  value: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "value", "type": "uint256" }>
};

/**
 * Calls the "burnFrom" function on the contract.
 * @param options - The options for the "burnFrom" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { burnFrom } from "TODO";
 *
 * const transaction = burnFrom({
 *  account: ...,
 *  value: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function burnFrom(
  options: BaseTransactionOptions<BurnFromParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x79cc6790",
      [
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.account, options.value ],
  });
};

/**
 * Represents the parameters for the "deposit" function.
 */
export type DepositParams = {
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
};

/**
 * Calls the "deposit" function on the contract.
 * @param options - The options for the "deposit" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { deposit } from "TODO";
 *
 * const transaction = deposit({
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function deposit(
  options: BaseTransactionOptions<DepositParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xb6b55f25",
      [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.amount ],
  });
};

/**
 * Calls the "initialize" function on the contract.
 * @param options - The options for the "initialize" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { initialize } from "TODO";
 *
 * const transaction = initialize();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function initialize(
  options: BaseTransactionOptions,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x8129fc1c",
      [],
      [],
    ],
    params: [],
  });
};

/**
 * Calls the "pause" function on the contract.
 * @param options - The options for the "pause" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { pause } from "TODO";
 *
 * const transaction = pause();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function pause(
  options: BaseTransactionOptions,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x8456cb59",
      [],
      [],
    ],
    params: [],
  });
};

/**
 * Represents the parameters for the "setAuthority" function.
 */
export type SetAuthorityParams = {
  newAuthority: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "newAuthority", "type": "address" }>
};

/**
 * Calls the "setAuthority" function on the contract.
 * @param options - The options for the "setAuthority" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setAuthority } from "TODO";
 *
 * const transaction = setAuthority({
 *  newAuthority: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setAuthority(
  options: BaseTransactionOptions<SetAuthorityParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x7a9e5e4b",
      [
        {
          "internalType": "address",
          "name": "newAuthority",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.newAuthority ],
  });
};

/**
 * Represents the parameters for the "transfer" function.
 */
export type TransferParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
  value: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "value", "type": "uint256" }>
};

/**
 * Calls the "transfer" function on the contract.
 * @param options - The options for the "transfer" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transfer } from "TODO";
 *
 * const transaction = transfer({
 *  to: ...,
 *  value: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function transfer(
  options: BaseTransactionOptions<TransferParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xa9059cbb",
      [
        {
          "internalType": "address",
          "name": "to",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256",
        },
      ],
      [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool",
        },
      ],
    ],
    params: [ options.to, options.value ],
  });
};

/**
 * Represents the parameters for the "transferFrom" function.
 */
export type TransferFromParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "from", "type": "address" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
  value: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "value", "type": "uint256" }>
};

/**
 * Calls the "transferFrom" function on the contract.
 * @param options - The options for the "transferFrom" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transferFrom } from "TODO";
 *
 * const transaction = transferFrom({
 *  from: ...,
 *  to: ...,
 *  value: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function transferFrom(
  options: BaseTransactionOptions<TransferFromParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x23b872dd",
      [
        {
          "internalType": "address",
          "name": "from",
          "type": "address",
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256",
        },
      ],
      [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool",
        },
      ],
    ],
    params: [ options.from, options.to, options.value ],
  });
};

/**
 * Calls the "unpause" function on the contract.
 * @param options - The options for the "unpause" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { unpause } from "TODO";
 *
 * const transaction = unpause();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function unpause(
  options: BaseTransactionOptions,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x3f4ba83a",
      [],
      [],
    ],
    params: [],
  });
};

/**
 * Represents the parameters for the "upgradeToAndCall" function.
 */
export type UpgradeToAndCallParams = {
  newImplementation: AbiParameterToPrimitiveType<{
    "internalType": "address",
    "name": "newImplementation",
    "type": "address"
  }>
  data: AbiParameterToPrimitiveType<{ "internalType": "bytes", "name": "data", "type": "bytes" }>
};

/**
 * Calls the "upgradeToAndCall" function on the contract.
 * @param options - The options for the "upgradeToAndCall" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { upgradeToAndCall } from "TODO";
 *
 * const transaction = upgradeToAndCall({
 *  newImplementation: ...,
 *  data: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function upgradeToAndCall(
  options: BaseTransactionOptions<UpgradeToAndCallParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x4f1ef286",
      [
        {
          "internalType": "address",
          "name": "newImplementation",
          "type": "address",
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes",
        },
      ],
      [],
    ],
    params: [ options.newImplementation, options.data ],
  });
};

/**
 * Represents the parameters for the "withdraw" function.
 */
export type WithdrawParams = {
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
};

/**
 * Calls the "withdraw" function on the contract.
 * @param options - The options for the "withdraw" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { withdraw } from "TODO";
 *
 * const transaction = withdraw({
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function withdraw(
  options: BaseTransactionOptions<WithdrawParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x2e1a7d4d",
      [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.amount ],
  });
};
