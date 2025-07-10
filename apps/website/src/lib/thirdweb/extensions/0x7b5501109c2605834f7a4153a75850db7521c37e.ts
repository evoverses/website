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
}

/**
 * Represents the filters for the "ClaimedDisbursement" event.
 */
export type ClaimedDisbursementEventFilters = Partial<{
  from: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }>
}>;

/**
 * Creates an event object for the ClaimedDisbursement event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { claimedDisbursementEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  claimedDisbursementEvent({
 *  from: ...,
 * })
 * ],
 * });
 * ```
 */
export function claimedDisbursementEvent(filters: ClaimedDisbursementEventFilters = {}) {
  return prepareEvent({
    signature: "event ClaimedDisbursement(address indexed from, uint256 amount)",
    filters,
  });
}

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
    signature: "event Initialized(uint8 version)",
  });
}

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
}

/**
 * Represents the filters for the "RoleAdminChanged" event.
 */
export type RoleAdminChangedEventFilters = Partial<{
  role: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  previousAdminRole: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "bytes32",
    "name": "previousAdminRole",
    "type": "bytes32"
  }>
  newAdminRole: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "bytes32",
    "name": "newAdminRole",
    "type": "bytes32"
  }>
}>;

/**
 * Creates an event object for the RoleAdminChanged event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { roleAdminChangedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  roleAdminChangedEvent({
 *  role: ...,
 *  previousAdminRole: ...,
 *  newAdminRole: ...,
 * })
 * ],
 * });
 * ```
 */
export function roleAdminChangedEvent(filters: RoleAdminChangedEventFilters = {}) {
  return prepareEvent({
    signature: "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
    filters,
  });
}

/**
 * Represents the filters for the "RoleGranted" event.
 */
export type RoleGrantedEventFilters = Partial<{
  role: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  account: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "address",
    "name": "account",
    "type": "address"
  }>
  sender: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "address",
    "name": "sender",
    "type": "address"
  }>
}>;

/**
 * Creates an event object for the RoleGranted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { roleGrantedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  roleGrantedEvent({
 *  role: ...,
 *  account: ...,
 *  sender: ...,
 * })
 * ],
 * });
 * ```
 */
export function roleGrantedEvent(filters: RoleGrantedEventFilters = {}) {
  return prepareEvent({
    signature: "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    filters,
  });
}

/**
 * Represents the filters for the "RoleRevoked" event.
 */
export type RoleRevokedEventFilters = Partial<{
  role: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  account: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "address",
    "name": "account",
    "type": "address"
  }>
  sender: AbiParameterToPrimitiveType<{
    "indexed": true,
    "internalType": "address",
    "name": "sender",
    "type": "address"
  }>
}>;

/**
 * Creates an event object for the RoleRevoked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { roleRevokedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  roleRevokedEvent({
 *  role: ...,
 *  account: ...,
 *  sender: ...,
 * })
 * ],
 * });
 * ```
 */
export function roleRevokedEvent(filters: RoleRevokedEventFilters = {}) {
  return prepareEvent({
    signature: "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    filters,
  });
}

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
}

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
}

/**
 * Contract read functions
 */

/**
 * Calls the "ADMIN_ROLE" function on the contract.
 * @param options - The options for the ADMIN_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { ADMIN_ROLE } from "TODO";
 *
 * const result = await ADMIN_ROLE();
 *
 * ```
 */
export async function ADMIN_ROLE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x75b238fc",
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
}

/**
 * Calls the "DEFAULT_ADMIN_ROLE" function on the contract.
 * @param options - The options for the DEFAULT_ADMIN_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEFAULT_ADMIN_ROLE } from "TODO";
 *
 * const result = await DEFAULT_ADMIN_ROLE();
 *
 * ```
 */
export async function DEFAULT_ADMIN_ROLE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xa217fddf",
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
}

/**
 * Calls the "DEFAULT_VESTING_PERIOD" function on the contract.
 * @param options - The options for the DEFAULT_VESTING_PERIOD function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEFAULT_VESTING_PERIOD } from "TODO";
 *
 * const result = await DEFAULT_VESTING_PERIOD();
 *
 * ```
 */
export async function DEFAULT_VESTING_PERIOD(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x098480ec",
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
}

/**
 * Calls the "DOMAIN_SEPARATOR" function on the contract.
 * @param options - The options for the DOMAIN_SEPARATOR function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DOMAIN_SEPARATOR } from "TODO";
 *
 * const result = await DOMAIN_SEPARATOR();
 *
 * ```
 */
export async function DOMAIN_SEPARATOR(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x3644e515",
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
}

/**
 * Calls the "MINTER_ROLE" function on the contract.
 * @param options - The options for the MINTER_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { MINTER_ROLE } from "TODO";
 *
 * const result = await MINTER_ROLE();
 *
 * ```
 */
export async function MINTER_ROLE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xd5391393",
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
}

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
}

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
}

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
}

/**
 * Represents the parameters for the "disbursements" function.
 */
export type DisbursementsParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "", "type": "address" }>
  arg_1: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "disbursements" function on the contract.
 * @param options - The options for the disbursements function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { disbursements } from "TODO";
 *
 * const result = await disbursements({
 *  arg_0: ...,
 *  arg_1: ...,
 * });
 *
 * ```
 */
export async function disbursements(
  options: BaseTransactionOptions<DisbursementsParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x7a153043",
      [
        {
          "internalType": "address",
          "name": "",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
        },
      ],
      [
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.arg_0, options.arg_1 ],
  });
}

/**
 * Represents the parameters for the "disbursementsOf" function.
 */
export type DisbursementsOfParams = {
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
};

/**
 * Calls the "disbursementsOf" function on the contract.
 * @param options - The options for the disbursementsOf function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { disbursementsOf } from "TODO";
 *
 * const result = await disbursementsOf({
 *  address: ...,
 * });
 *
 * ```
 */
export async function disbursementsOf(
  options: BaseTransactionOptions<DisbursementsOfParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x05cea05f",
      [
        {
          "internalType": "address",
          "name": "_address",
          "type": "address",
        },
      ],
      [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "duration",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "balance",
              "type": "uint256",
            },
          ],
          "internalType": "struct cEVOUpgradeable.Disbursement[]",
          "name": "",
          "type": "tuple[]",
        },
      ],
    ],
    params: [ options.address ],
  });
}

/**
 * Represents the parameters for the "getRoleAdmin" function.
 */
export type GetRoleAdminParams = {
  role: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "role", "type": "bytes32" }>
};

/**
 * Calls the "getRoleAdmin" function on the contract.
 * @param options - The options for the getRoleAdmin function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRoleAdmin } from "TODO";
 *
 * const result = await getRoleAdmin({
 *  role: ...,
 * });
 *
 * ```
 */
export async function getRoleAdmin(
  options: BaseTransactionOptions<GetRoleAdminParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x248a9ca3",
      [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32",
        },
      ],
      [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32",
        },
      ],
    ],
    params: [ options.role ],
  });
}

/**
 * Represents the parameters for the "hasRole" function.
 */
export type HasRoleParams = {
  role: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
};

/**
 * Calls the "hasRole" function on the contract.
 * @param options - The options for the hasRole function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hasRole } from "TODO";
 *
 * const result = await hasRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * ```
 */
export async function hasRole(
  options: BaseTransactionOptions<HasRoleParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x91d14854",
      [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32",
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
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
    params: [ options.role, options.account ],
  });
}

/**
 * Represents the parameters for the "lockedOf" function.
 */
export type LockedOfParams = {
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
};

/**
 * Calls the "lockedOf" function on the contract.
 * @param options - The options for the lockedOf function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { lockedOf } from "TODO";
 *
 * const result = await lockedOf({
 *  address: ...,
 * });
 *
 * ```
 */
export async function lockedOf(
  options: BaseTransactionOptions<LockedOfParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xa5f1e282",
      [
        {
          "internalType": "address",
          "name": "_address",
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
    params: [ options.address ],
  });
}

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
}

/**
 * Represents the parameters for the "nonces" function.
 */
export type NoncesParams = {
  owner: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "owner", "type": "address" }>
};

/**
 * Calls the "nonces" function on the contract.
 * @param options - The options for the nonces function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { nonces } from "TODO";
 *
 * const result = await nonces({
 *  owner: ...,
 * });
 *
 * ```
 */
export async function nonces(
  options: BaseTransactionOptions<NoncesParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x7ecebe00",
      [
        {
          "internalType": "address",
          "name": "owner",
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
    params: [ options.owner ],
  });
}

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
}

/**
 * Represents the parameters for the "pendingOf" function.
 */
export type PendingOfParams = {
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
};

/**
 * Calls the "pendingOf" function on the contract.
 * @param options - The options for the pendingOf function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { pendingOf } from "TODO";
 *
 * const result = await pendingOf({
 *  address: ...,
 * });
 *
 * ```
 */
export async function pendingOf(
  options: BaseTransactionOptions<PendingOfParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xf44136a1",
      [
        {
          "internalType": "address",
          "name": "_address",
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
    params: [ options.address ],
  });
}

/**
 * Represents the parameters for the "selfDisbursement" function.
 */
export type SelfDisbursementParams = {
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "", "type": "address" }>
};

/**
 * Calls the "selfDisbursement" function on the contract.
 * @param options - The options for the selfDisbursement function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { selfDisbursement } from "TODO";
 *
 * const result = await selfDisbursement({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function selfDisbursement(
  options: BaseTransactionOptions<SelfDisbursementParams>,
) {
  const [ startTime, duration, amount, balance ] = await readContract({
    contract: options.contract,
    method: [
      "0x7ccdd45d",
      [
        {
          "internalType": "address",
          "name": "",
          "type": "address",
        },
      ],
      [
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.address ],
  });
  return { startTime, duration, amount, balance };
}

/**
 * Represents the parameters for the "supportsInterface" function.
 */
export type SupportsInterfaceParams = {
  interfaceId: AbiParameterToPrimitiveType<{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }>
};

/**
 * Calls the "supportsInterface" function on the contract.
 * @param options - The options for the supportsInterface function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { supportsInterface } from "TODO";
 *
 * const result = await supportsInterface({
 *  interfaceId: ...,
 * });
 *
 * ```
 */
export async function supportsInterface(
  options: BaseTransactionOptions<SupportsInterfaceParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x01ffc9a7",
      [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4",
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
    params: [ options.interfaceId ],
  });
}

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
}

/**
 * Calls the "totalBurned" function on the contract.
 * @param options - The options for the totalBurned function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { totalBurned } from "TODO";
 *
 * const result = await totalBurned();
 *
 * ```
 */
export async function totalBurned(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xd89135cd",
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
}

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
}

/**
 * Represents the parameters for the "transferTime" function.
 */
export type TransferTimeParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "", "type": "address" }>
};

/**
 * Calls the "transferTime" function on the contract.
 * @param options - The options for the transferTime function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { transferTime } from "TODO";
 *
 * const result = await transferTime({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function transferTime(
  options: BaseTransactionOptions<TransferTimeParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x93866707",
      [
        {
          "internalType": "address",
          "name": "",
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
    params: [ options.arg_0 ],
  });
}

/**
 * Contract write functions
 */

/**
 * Represents the parameters for the "addGlobalWhitelist" function.
 */
export type AddGlobalWhitelistParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
};

/**
 * Calls the "addGlobalWhitelist" function on the contract.
 * @param options - The options for the "addGlobalWhitelist" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { addGlobalWhitelist } from "TODO";
 *
 * const transaction = addGlobalWhitelist({
 *  to: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function addGlobalWhitelist(
  options: BaseTransactionOptions<AddGlobalWhitelistParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xb45cc845",
      [
        {
          "internalType": "address",
          "name": "to",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.to ],
  });
}

/**
 * Represents the parameters for the "addWhitelist" function.
 */
export type AddWhitelistParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "from", "type": "address" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
};

/**
 * Calls the "addWhitelist" function on the contract.
 * @param options - The options for the "addWhitelist" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { addWhitelist } from "TODO";
 *
 * const transaction = addWhitelist({
 *  from: ...,
 *  to: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function addWhitelist(
  options: BaseTransactionOptions<AddWhitelistParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xa73d633c",
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
      ],
      [],
    ],
    params: [ options.from, options.to ],
  });
}

/**
 * Represents the parameters for the "adminTransferAllDisbursements" function.
 */
export type AdminTransferAllDisbursementsParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "from", "type": "address" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
};

/**
 * Calls the "adminTransferAllDisbursements" function on the contract.
 * @param options - The options for the "adminTransferAllDisbursements" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { adminTransferAllDisbursements } from "TODO";
 *
 * const transaction = adminTransferAllDisbursements({
 *  from: ...,
 *  to: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function adminTransferAllDisbursements(
  options: BaseTransactionOptions<AdminTransferAllDisbursementsParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x12bdd0f2",
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
      ],
      [],
    ],
    params: [ options.from, options.to ],
  });
}

/**
 * Represents the parameters for the "approve" function.
 */
export type ApproveParams = {
  spender: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "spender", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
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
 *  amount: ...,
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
          "name": "amount",
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
    params: [ options.spender, options.amount ],
  });
}

/**
 * Represents the parameters for the "batchMintDisbursement" function.
 */
export type BatchMintDisbursementParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address[]", "name": "to", "type": "address[]" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "amount", "type": "uint256[]" }>
  startTime: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "startTime", "type": "uint256" }>
  duration: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "duration", "type": "uint256" }>
};

/**
 * Calls the "batchMintDisbursement" function on the contract.
 * @param options - The options for the "batchMintDisbursement" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { batchMintDisbursement } from "TODO";
 *
 * const transaction = batchMintDisbursement({
 *  to: ...,
 *  amount: ...,
 *  startTime: ...,
 *  duration: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function batchMintDisbursement(
  options: BaseTransactionOptions<BatchMintDisbursementParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x18134111",
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
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.to, options.amount, options.startTime, options.duration ],
  });
}

/**
 * Represents the parameters for the "bridgeMintDisbursement" function.
 */
export type BridgeMintDisbursementParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
  startTime: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "startTime", "type": "uint256" }>
  duration: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "duration", "type": "uint256" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
  balance: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "balance", "type": "uint256" }>
};

/**
 * Calls the "bridgeMintDisbursement" function on the contract.
 * @param options - The options for the "bridgeMintDisbursement" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { bridgeMintDisbursement } from "TODO";
 *
 * const transaction = bridgeMintDisbursement({
 *  to: ...,
 *  startTime: ...,
 *  duration: ...,
 *  amount: ...,
 *  balance: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function bridgeMintDisbursement(
  options: BaseTransactionOptions<BridgeMintDisbursementParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xa6d2ba52",
      [
        {
          "internalType": "address",
          "name": "to",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.to, options.startTime, options.duration, options.amount, options.balance ],
  });
}

/**
 * Represents the parameters for the "burn" function.
 */
export type BurnParams = {
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
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
 *  amount: ...,
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
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.amount ],
  });
}

/**
 * Represents the parameters for the "burnFrom" function.
 */
export type BurnFromParams = {
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
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
 *  amount: ...,
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
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.account, options.amount ],
  });
}

/**
 * Calls the "burnLocked" function on the contract.
 * @param options - The options for the "burnLocked" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { burnLocked } from "TODO";
 *
 * const transaction = burnLocked();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function burnLocked(
  options: BaseTransactionOptions,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x4d3ef8dd",
      [],
      [],
    ],
    params: [],
  });
}

/**
 * Calls the "claimPending" function on the contract.
 * @param options - The options for the "claimPending" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { claimPending } from "TODO";
 *
 * const transaction = claimPending();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function claimPending(
  options: BaseTransactionOptions,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x03a9f06e",
      [],
      [],
    ],
    params: [],
  });
}

/**
 * Represents the parameters for the "decreaseAllowance" function.
 */
export type DecreaseAllowanceParams = {
  spender: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "spender", "type": "address" }>
  subtractedValue: AbiParameterToPrimitiveType<{
    "internalType": "uint256",
    "name": "subtractedValue",
    "type": "uint256"
  }>
};

/**
 * Calls the "decreaseAllowance" function on the contract.
 * @param options - The options for the "decreaseAllowance" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { decreaseAllowance } from "TODO";
 *
 * const transaction = decreaseAllowance({
 *  spender: ...,
 *  subtractedValue: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function decreaseAllowance(
  options: BaseTransactionOptions<DecreaseAllowanceParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xa457c2d7",
      [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "subtractedValue",
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
    params: [ options.spender, options.subtractedValue ],
  });
}

/**
 * Represents the parameters for the "grantRole" function.
 */
export type GrantRoleParams = {
  role: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
};

/**
 * Calls the "grantRole" function on the contract.
 * @param options - The options for the "grantRole" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { grantRole } from "TODO";
 *
 * const transaction = grantRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function grantRole(
  options: BaseTransactionOptions<GrantRoleParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x2f2ff15d",
      [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32",
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.role, options.account ],
  });
}

/**
 * Represents the parameters for the "increaseAllowance" function.
 */
export type IncreaseAllowanceParams = {
  spender: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "spender", "type": "address" }>
  addedValue: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "addedValue", "type": "uint256" }>
};

/**
 * Calls the "increaseAllowance" function on the contract.
 * @param options - The options for the "increaseAllowance" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { increaseAllowance } from "TODO";
 *
 * const transaction = increaseAllowance({
 *  spender: ...,
 *  addedValue: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function increaseAllowance(
  options: BaseTransactionOptions<IncreaseAllowanceParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x39509351",
      [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "addedValue",
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
    params: [ options.spender, options.addedValue ],
  });
}

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
}

/**
 * Represents the parameters for the "mint" function.
 */
export type MintParams = {
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
};

/**
 * Calls the "mint" function on the contract.
 * @param options - The options for the "mint" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { mint } from "TODO";
 *
 * const transaction = mint({
 *  address: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function mint(
  options: BaseTransactionOptions<MintParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x40c10f19",
      [
        {
          "internalType": "address",
          "name": "_address",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.address, options.amount ],
  });
}

/**
 * Represents the parameters for the "mintDisbursement" function.
 */
export type MintDisbursementParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
  startTime: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "startTime", "type": "uint256" }>
  duration: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "duration", "type": "uint256" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
};

/**
 * Calls the "mintDisbursement" function on the contract.
 * @param options - The options for the "mintDisbursement" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { mintDisbursement } from "TODO";
 *
 * const transaction = mintDisbursement({
 *  to: ...,
 *  startTime: ...,
 *  duration: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function mintDisbursement(
  options: BaseTransactionOptions<MintDisbursementParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x314f8454",
      [
        {
          "internalType": "address",
          "name": "to",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.to, options.startTime, options.duration, options.amount ],
  });
}

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
}

/**
 * Represents the parameters for the "permit" function.
 */
export type PermitParams = {
  owner: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "owner", "type": "address" }>
  spender: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "spender", "type": "address" }>
  value: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "value", "type": "uint256" }>
  deadline: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "deadline", "type": "uint256" }>
  v: AbiParameterToPrimitiveType<{ "internalType": "uint8", "name": "v", "type": "uint8" }>
  r: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "r", "type": "bytes32" }>
  s: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "s", "type": "bytes32" }>
};

/**
 * Calls the "permit" function on the contract.
 * @param options - The options for the "permit" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { permit } from "TODO";
 *
 * const transaction = permit({
 *  owner: ...,
 *  spender: ...,
 *  value: ...,
 *  deadline: ...,
 *  v: ...,
 *  r: ...,
 *  s: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function permit(
  options: BaseTransactionOptions<PermitParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xd505accf",
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
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256",
        },
        {
          "internalType": "uint8",
          "name": "v",
          "type": "uint8",
        },
        {
          "internalType": "bytes32",
          "name": "r",
          "type": "bytes32",
        },
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32",
        },
      ],
      [],
    ],
    params: [ options.owner, options.spender, options.value, options.deadline, options.v, options.r, options.s ],
  });
}

/**
 * Represents the parameters for the "renounceRole" function.
 */
export type RenounceRoleParams = {
  role: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
};

/**
 * Calls the "renounceRole" function on the contract.
 * @param options - The options for the "renounceRole" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { renounceRole } from "TODO";
 *
 * const transaction = renounceRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function renounceRole(
  options: BaseTransactionOptions<RenounceRoleParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x36568abe",
      [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32",
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.role, options.account ],
  });
}

/**
 * Represents the parameters for the "resetTransferTimeOf" function.
 */
export type ResetTransferTimeOfParams = {
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
};

/**
 * Calls the "resetTransferTimeOf" function on the contract.
 * @param options - The options for the "resetTransferTimeOf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { resetTransferTimeOf } from "TODO";
 *
 * const transaction = resetTransferTimeOf({
 *  address: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function resetTransferTimeOf(
  options: BaseTransactionOptions<ResetTransferTimeOfParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x0c64936d",
      [
        {
          "internalType": "address",
          "name": "_address",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.address ],
  });
}

/**
 * Represents the parameters for the "revokeRole" function.
 */
export type RevokeRoleParams = {
  role: AbiParameterToPrimitiveType<{ "internalType": "bytes32", "name": "role", "type": "bytes32" }>
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
};

/**
 * Calls the "revokeRole" function on the contract.
 * @param options - The options for the "revokeRole" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { revokeRole } from "TODO";
 *
 * const transaction = revokeRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function revokeRole(
  options: BaseTransactionOptions<RevokeRoleParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xd547741f",
      [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32",
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.role, options.account ],
  });
}

/**
 * Represents the parameters for the "transfer" function.
 */
export type TransferParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
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
 *  amount: ...,
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
          "name": "amount",
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
    params: [ options.to, options.amount ],
  });
}

/**
 * Represents the parameters for the "transferAllDisbursements" function.
 */
export type TransferAllDisbursementsParams = {
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
};

/**
 * Calls the "transferAllDisbursements" function on the contract.
 * @param options - The options for the "transferAllDisbursements" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transferAllDisbursements } from "TODO";
 *
 * const transaction = transferAllDisbursements({
 *  to: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function transferAllDisbursements(
  options: BaseTransactionOptions<TransferAllDisbursementsParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x9f2310a4",
      [
        {
          "internalType": "address",
          "name": "to",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.to ],
  });
}

/**
 * Represents the parameters for the "transferFrom" function.
 */
export type TransferFromParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "from", "type": "address" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "to", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
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
 *  amount: ...,
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
          "name": "amount",
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
    params: [ options.from, options.to, options.amount ],
  });
}

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
}

/**
 * Represents the parameters for the "useLocked" function.
 */
export type UseLockedParams = {
  account: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "account", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "amount", "type": "uint256" }>
};

/**
 * Calls the "useLocked" function on the contract.
 * @param options - The options for the "useLocked" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { useLocked } from "TODO";
 *
 * const transaction = useLocked({
 *  account: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function useLocked(
  options: BaseTransactionOptions<UseLockedParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xc06bab2b",
      [
        {
          "internalType": "address",
          "name": "account",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.account, options.amount ],
  });
}
