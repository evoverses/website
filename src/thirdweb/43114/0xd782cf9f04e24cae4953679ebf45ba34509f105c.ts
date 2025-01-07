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
 * Represents the filters for the "Deposit" event.
 */
export type DepositEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }>
  pid: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }>
}>;

/**
 * Creates an event object for the Deposit event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { depositEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  depositEvent({
 *  user: ...,
 *  pid: ...,
 * })
 * ],
 * });
 * ```
 */
export function depositEvent(filters: DepositEventFilters = {}) {
  return prepareEvent({
    signature: "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
    filters,
  });
};

/**
 * Represents the filters for the "EmergencyWithdraw" event.
 */
export type EmergencyWithdrawEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }>
  pid: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }>
}>;

/**
 * Creates an event object for the EmergencyWithdraw event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { emergencyWithdrawEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  emergencyWithdrawEvent({
 *  user: ...,
 *  pid: ...,
 * })
 * ],
 * });
 * ```
 */
export function emergencyWithdrawEvent(filters: EmergencyWithdrawEventFilters = {}) {
  return prepareEvent({
    signature: "event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)",
    filters,
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
    signature: "event Initialized(uint8 version)",
  });
};

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
};

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
};

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
};

/**
 * Represents the filters for the "SendGovernanceTokenReward" event.
 */
export type SendGovernanceTokenRewardEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }>
  pid: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }>
}>;

/**
 * Creates an event object for the SendGovernanceTokenReward event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { sendGovernanceTokenRewardEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  sendGovernanceTokenRewardEvent({
 *  user: ...,
 *  pid: ...,
 * })
 * ],
 * });
 * ```
 */
export function sendGovernanceTokenRewardEvent(filters: SendGovernanceTokenRewardEventFilters = {}) {
  return prepareEvent({
    signature: "event SendGovernanceTokenReward(address indexed user, uint256 indexed pid, uint256 amount, uint256 lockAmount)",
    filters,
  });
};

/**
 * Represents the filters for the "Withdraw" event.
 */
export type WithdrawEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }>
  pid: AbiParameterToPrimitiveType<{ "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }>
}>;

/**
 * Creates an event object for the Withdraw event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { withdrawEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  withdrawEvent({
 *  user: ...,
 *  pid: ...,
 * })
 * ],
 * });
 * ```
 */
export function withdrawEvent(filters: WithdrawEventFilters = {}) {
  return prepareEvent({
    signature: "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)",
    filters,
  });
};

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
};

/**
 * Calls the "CONTRACT_ROLE" function on the contract.
 * @param options - The options for the CONTRACT_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { CONTRACT_ROLE } from "TODO";
 *
 * const result = await CONTRACT_ROLE();
 *
 * ```
 */
export async function CONTRACT_ROLE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x03fe46ab",
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
};

/**
 * Calls the "DEV_DEP_FEE" function on the contract.
 * @param options - The options for the DEV_DEP_FEE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEV_DEP_FEE } from "TODO";
 *
 * const result = await DEV_DEP_FEE();
 *
 * ```
 */
export async function DEV_DEP_FEE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x56407a61",
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
 * Represents the parameters for the "DEV_FEE_STAGES" function.
 */
export type DEV_FEE_STAGESParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "DEV_FEE_STAGES" function on the contract.
 * @param options - The options for the DEV_FEE_STAGES function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEV_FEE_STAGES } from "TODO";
 *
 * const result = await DEV_FEE_STAGES({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function DEV_FEE_STAGES(
  options: BaseTransactionOptions<DEV_FEE_STAGESParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xf491adf7",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
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
};

/**
 * Calls the "DEV_FUND_ADDRESS" function on the contract.
 * @param options - The options for the DEV_FUND_ADDRESS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEV_FUND_ADDRESS } from "TODO";
 *
 * const result = await DEV_FUND_ADDRESS();
 *
 * ```
 */
export async function DEV_FUND_ADDRESS(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x875ad581",
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
 * Calls the "FEE_SHARE_FUND_ADDRESS" function on the contract.
 * @param options - The options for the FEE_SHARE_FUND_ADDRESS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { FEE_SHARE_FUND_ADDRESS } from "TODO";
 *
 * const result = await FEE_SHARE_FUND_ADDRESS();
 *
 * ```
 */
export async function FEE_SHARE_FUND_ADDRESS(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xb1682689",
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
 * Calls the "FINISH_BONUS_AT_TIME" function on the contract.
 * @param options - The options for the FINISH_BONUS_AT_TIME function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { FINISH_BONUS_AT_TIME } from "TODO";
 *
 * const result = await FINISH_BONUS_AT_TIME();
 *
 * ```
 */
export async function FINISH_BONUS_AT_TIME(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x4abbbd28",
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
 * Calls the "FOUNDERS_FUND_ADDRESS" function on the contract.
 * @param options - The options for the FOUNDERS_FUND_ADDRESS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { FOUNDERS_FUND_ADDRESS } from "TODO";
 *
 * const result = await FOUNDERS_FUND_ADDRESS();
 *
 * ```
 */
export async function FOUNDERS_FUND_ADDRESS(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xa2570bd6",
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
 * Calls the "GOV_TOKEN" function on the contract.
 * @param options - The options for the GOV_TOKEN function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { GOV_TOKEN } from "TODO";
 *
 * const result = await GOV_TOKEN();
 *
 * ```
 */
export async function GOV_TOKEN(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xf92d34a9",
      [],
      [
        {
          "internalType": "contract IERC20ExtendedUpgradeable",
          "name": "",
          "type": "address",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Represents the parameters for the "HALVING_AT_TIMES" function.
 */
export type HALVING_AT_TIMESParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "HALVING_AT_TIMES" function on the contract.
 * @param options - The options for the HALVING_AT_TIMES function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { HALVING_AT_TIMES } from "TODO";
 *
 * const result = await HALVING_AT_TIMES({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function HALVING_AT_TIMES(
  options: BaseTransactionOptions<HALVING_AT_TIMESParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x027e6999",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
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
};

/**
 * Calls the "MARKETING_FUND_ADDRESS" function on the contract.
 * @param options - The options for the MARKETING_FUND_ADDRESS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { MARKETING_FUND_ADDRESS } from "TODO";
 *
 * const result = await MARKETING_FUND_ADDRESS();
 *
 * ```
 */
export async function MARKETING_FUND_ADDRESS(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xf14dab0f",
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
 * Calls the "PERCENT_FOR_DEV" function on the contract.
 * @param options - The options for the PERCENT_FOR_DEV function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { PERCENT_FOR_DEV } from "TODO";
 *
 * const result = await PERCENT_FOR_DEV();
 *
 * ```
 */
export async function PERCENT_FOR_DEV(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xed9bdeda",
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
 * Calls the "PERCENT_FOR_FEE_SHARE" function on the contract.
 * @param options - The options for the PERCENT_FOR_FEE_SHARE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { PERCENT_FOR_FEE_SHARE } from "TODO";
 *
 * const result = await PERCENT_FOR_FEE_SHARE();
 *
 * ```
 */
export async function PERCENT_FOR_FEE_SHARE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xfa0718d9",
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
 * Calls the "PERCENT_FOR_FOUNDERS" function on the contract.
 * @param options - The options for the PERCENT_FOR_FOUNDERS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { PERCENT_FOR_FOUNDERS } from "TODO";
 *
 * const result = await PERCENT_FOR_FOUNDERS();
 *
 * ```
 */
export async function PERCENT_FOR_FOUNDERS(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xc6929e53",
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
 * Calls the "PERCENT_FOR_MARKETING" function on the contract.
 * @param options - The options for the PERCENT_FOR_MARKETING function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { PERCENT_FOR_MARKETING } from "TODO";
 *
 * const result = await PERCENT_FOR_MARKETING();
 *
 * ```
 */
export async function PERCENT_FOR_MARKETING(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xd9b0d435",
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
 * Represents the parameters for the "PERCENT_LOCK_BONUS_REWARD" function.
 */
export type PERCENT_LOCK_BONUS_REWARDParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "PERCENT_LOCK_BONUS_REWARD" function on the contract.
 * @param options - The options for the PERCENT_LOCK_BONUS_REWARD function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { PERCENT_LOCK_BONUS_REWARD } from "TODO";
 *
 * const result = await PERCENT_LOCK_BONUS_REWARD({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function PERCENT_LOCK_BONUS_REWARD(
  options: BaseTransactionOptions<PERCENT_LOCK_BONUS_REWARDParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xa82859c5",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
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
};

/**
 * Represents the parameters for the "REWARD_MULTIPLIERS" function.
 */
export type REWARD_MULTIPLIERSParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "REWARD_MULTIPLIERS" function on the contract.
 * @param options - The options for the REWARD_MULTIPLIERS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { REWARD_MULTIPLIERS } from "TODO";
 *
 * const result = await REWARD_MULTIPLIERS({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function REWARD_MULTIPLIERS(
  options: BaseTransactionOptions<REWARD_MULTIPLIERSParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x874feed3",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
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
};

/**
 * Calls the "REWARD_PER_SECOND" function on the contract.
 * @param options - The options for the REWARD_PER_SECOND function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { REWARD_PER_SECOND } from "TODO";
 *
 * const result = await REWARD_PER_SECOND();
 *
 * ```
 */
export async function REWARD_PER_SECOND(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xd79c3953",
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
 * Calls the "REWARD_TOKEN" function on the contract.
 * @param options - The options for the REWARD_TOKEN function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { REWARD_TOKEN } from "TODO";
 *
 * const result = await REWARD_TOKEN();
 *
 * ```
 */
export async function REWARD_TOKEN(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x99248ea7",
      [],
      [
        {
          "internalType": "contract IERC20ExtendedUpgradeable",
          "name": "",
          "type": "address",
        },
      ],
    ],
    params: [],
  });
};

/**
 * Calls the "START_TIME" function on the contract.
 * @param options - The options for the START_TIME function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { START_TIME } from "TODO";
 *
 * const result = await START_TIME();
 *
 * ```
 */
export async function START_TIME(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xddaa26ad",
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
 * Calls the "TOTAL_ALLOCATION_POINTS" function on the contract.
 * @param options - The options for the TOTAL_ALLOCATION_POINTS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { TOTAL_ALLOCATION_POINTS } from "TODO";
 *
 * const result = await TOTAL_ALLOCATION_POINTS();
 *
 * ```
 */
export async function TOTAL_ALLOCATION_POINTS(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x43628fb4",
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
 * Calls the "USER_DEP_FEE" function on the contract.
 * @param options - The options for the USER_DEP_FEE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { USER_DEP_FEE } from "TODO";
 *
 * const result = await USER_DEP_FEE();
 *
 * ```
 */
export async function USER_DEP_FEE(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x7c0c5788",
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
 * Represents the parameters for the "USER_FEE_STAGES" function.
 */
export type USER_FEE_STAGESParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "USER_FEE_STAGES" function on the contract.
 * @param options - The options for the USER_FEE_STAGES function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { USER_FEE_STAGES } from "TODO";
 *
 * const result = await USER_FEE_STAGES({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function USER_FEE_STAGES(
  options: BaseTransactionOptions<USER_FEE_STAGESParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x4b0cf206",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
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
};

/**
 * Represents the parameters for the "getLockPercentage" function.
 */
export type GetLockPercentageParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_from", "type": "uint256" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_to", "type": "uint256" }>
};

/**
 * Calls the "getLockPercentage" function on the contract.
 * @param options - The options for the getLockPercentage function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getLockPercentage } from "TODO";
 *
 * const result = await getLockPercentage({
 *  from: ...,
 *  to: ...,
 * });
 *
 * ```
 */
export async function getLockPercentage(
  options: BaseTransactionOptions<GetLockPercentageParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xf930e770",
      [
        {
          "internalType": "uint256",
          "name": "_from",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_to",
          "type": "uint256",
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
    params: [ options.from, options.to ],
  });
};

/**
 * Represents the parameters for the "getMultiplier" function.
 */
export type GetMultiplierParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_from", "type": "uint256" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_to", "type": "uint256" }>
};

/**
 * Calls the "getMultiplier" function on the contract.
 * @param options - The options for the getMultiplier function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getMultiplier } from "TODO";
 *
 * const result = await getMultiplier({
 *  from: ...,
 *  to: ...,
 * });
 *
 * ```
 */
export async function getMultiplier(
  options: BaseTransactionOptions<GetMultiplierParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x8dbb1e3a",
      [
        {
          "internalType": "uint256",
          "name": "_from",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_to",
          "type": "uint256",
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
    params: [ options.from, options.to ],
  });
};

/**
 * Represents the parameters for the "getNewRewardPerSecond" function.
 */
export type GetNewRewardPerSecondParams = {
  pid1: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "pid1", "type": "uint256" }>
};

/**
 * Calls the "getNewRewardPerSecond" function on the contract.
 * @param options - The options for the getNewRewardPerSecond function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getNewRewardPerSecond } from "TODO";
 *
 * const result = await getNewRewardPerSecond({
 *  pid1: ...,
 * });
 *
 * ```
 */
export async function getNewRewardPerSecond(
  options: BaseTransactionOptions<GetNewRewardPerSecondParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x9b963d2a",
      [
        {
          "internalType": "uint256",
          "name": "pid1",
          "type": "uint256",
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
    params: [ options.pid1 ],
  });
};

/**
 * Represents the parameters for the "getPoolReward" function.
 */
export type GetPoolRewardParams = {
  from: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_from", "type": "uint256" }>
  to: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_to", "type": "uint256" }>
  allocPoint: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }>
};

/**
 * Calls the "getPoolReward" function on the contract.
 * @param options - The options for the getPoolReward function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getPoolReward } from "TODO";
 *
 * const result = await getPoolReward({
 *  from: ...,
 *  to: ...,
 *  allocPoint: ...,
 * });
 *
 * ```
 */
export async function getPoolReward(
  options: BaseTransactionOptions<GetPoolRewardParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xc8ed7680",
      [
        {
          "internalType": "uint256",
          "name": "_from",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_to",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_allocPoint",
          "type": "uint256",
        },
      ],
      [
        {
          "internalType": "uint256",
          "name": "forDev",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "forFarmer",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "forLP",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "forCom",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "forFounders",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.from, options.to, options.allocPoint ],
  });
};

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
};

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
};

/**
 * Represents the parameters for the "pendingReward" function.
 */
export type PendingRewardParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  user: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_user", "type": "address" }>
};

/**
 * Calls the "pendingReward" function on the contract.
 * @param options - The options for the pendingReward function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { pendingReward } from "TODO";
 *
 * const result = await pendingReward({
 *  pid: ...,
 *  user: ...,
 * });
 *
 * ```
 */
export async function pendingReward(
  options: BaseTransactionOptions<PendingRewardParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x98969e82",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "address",
          "name": "_user",
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
    params: [ options.pid, options.user ],
  });
};

/**
 * Represents the parameters for the "poolExistence" function.
 */
export type PoolExistenceParams = {
  arg_0: AbiParameterToPrimitiveType<{
    "internalType": "contract IERC20ExtendedUpgradeable",
    "name": "",
    "type": "address"
  }>
};

/**
 * Calls the "poolExistence" function on the contract.
 * @param options - The options for the poolExistence function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { poolExistence } from "TODO";
 *
 * const result = await poolExistence({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function poolExistence(
  options: BaseTransactionOptions<PoolExistenceParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xcbd258b5",
      [
        {
          "internalType": "contract IERC20ExtendedUpgradeable",
          "name": "",
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
    params: [ options.arg_0 ],
  });
};

/**
 * Represents the parameters for the "poolId" function.
 */
export type PoolIdParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "", "type": "address" }>
};

/**
 * Calls the "poolId" function on the contract.
 * @param options - The options for the poolId function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { poolId } from "TODO";
 *
 * const result = await poolId({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function poolId(
  options: BaseTransactionOptions<PoolIdParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xff51a272",
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
};

/**
 * Represents the parameters for the "poolInfo" function.
 */
export type PoolInfoParams = {
  poolId: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
};

/**
 * Calls the "poolInfo" function on the contract.
 * @param options - The options for the poolInfo function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { poolInfo } from "TODO";
 *
 * const result = await poolInfo({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function poolInfo(
  options: BaseTransactionOptions<PoolInfoParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x1526fe27",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
        },
      ],
      [
        {
          "internalType": "contract IERC20ExtendedUpgradeable",
          "name": "lpToken",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "allocPoint",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "lastRewardTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "accGovTokenPerShare",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.poolId ],
  });
};

/**
 * Calls the "poolLength" function on the contract.
 * @param options - The options for the poolLength function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { poolLength } from "TODO";
 *
 * const result = await poolLength();
 *
 * ```
 */
export async function poolLength(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x081e3eda",
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
};

/**
 * Calls the "totalAllocPoint" function on the contract.
 * @param options - The options for the totalAllocPoint function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { totalAllocPoint } from "TODO";
 *
 * const result = await totalAllocPoint();
 *
 * ```
 */
export async function totalAllocPoint(
  options: BaseTransactionOptions,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x17caf6f1",
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
 * Represents the parameters for the "userDelta" function.
 */
export type UserDeltaParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
};

/**
 * Calls the "userDelta" function on the contract.
 * @param options - The options for the userDelta function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { userDelta } from "TODO";
 *
 * const result = await userDelta({
 *  pid: ...,
 * });
 *
 * ```
 */
export async function userDelta(
  options: BaseTransactionOptions<UserDeltaParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x09ae4d2c",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
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
    params: [ options.pid ],
  });
};

/**
 * Represents the parameters for the "userDeltaOf" function.
 */
export type UserDeltaOfParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
};

/**
 * Calls the "userDeltaOf" function on the contract.
 * @param options - The options for the userDeltaOf function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { userDeltaOf } from "TODO";
 *
 * const result = await userDeltaOf({
 *  pid: ...,
 *  address: ...,
 * });
 *
 * ```
 */
export async function userDeltaOf(
  options: BaseTransactionOptions<UserDeltaOfParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0xc7b6e525",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
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
    params: [ options.pid, options.address ],
  });
};

/**
 * Represents the parameters for the "userInfo" function.
 */
export type UserInfoParams = {
  arg_0: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "", "type": "uint256" }>
  arg_1: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "", "type": "address" }>
};

/**
 * Calls the "userInfo" function on the contract.
 * @param options - The options for the userInfo function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { userInfo } from "TODO";
 *
 * const result = await userInfo({
 *  arg_0: ...,
 *  arg_1: ...,
 * });
 *
 * ```
 */
export async function userInfo(
  options: BaseTransactionOptions<UserInfoParams>,
) {
  return readContract({
    contract: options.contract,
    method: [
      "0x93f1a40b",
      [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256",
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address",
        },
      ],
      [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "rewardDebt",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "rewardDebtAtTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "lastWithdrawTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "firstDepositTime",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "timeDelta",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "lastDepositTime",
          "type": "uint256",
        },
      ],
    ],
    params: [ options.arg_0, options.arg_1 ],
  });
};

/**
 * Contract write functions
 */

/**
 * Represents the parameters for the "add" function.
 */
export type AddParams = {
  allocPoint: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }>
  lpToken: AbiParameterToPrimitiveType<{
    "internalType": "contract IERC20ExtendedUpgradeable",
    "name": "_lpToken",
    "type": "address"
  }>
  withUpdate: AbiParameterToPrimitiveType<{ "internalType": "bool", "name": "_withUpdate", "type": "bool" }>
};

/**
 * Calls the "add" function on the contract.
 * @param options - The options for the "add" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { add } from "TODO";
 *
 * const transaction = add({
 *  allocPoint: ...,
 *  lpToken: ...,
 *  withUpdate: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function add(
  options: BaseTransactionOptions<AddParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x1eaaa045",
      [
        {
          "internalType": "uint256",
          "name": "_allocPoint",
          "type": "uint256",
        },
        {
          "internalType": "contract IERC20ExtendedUpgradeable",
          "name": "_lpToken",
          "type": "address",
        },
        {
          "internalType": "bool",
          "name": "_withUpdate",
          "type": "bool",
        },
      ],
      [],
    ],
    params: [ options.allocPoint, options.lpToken, options.withUpdate ],
  });
};

/**
 * Represents the parameters for the "claimReward" function.
 */
export type ClaimRewardParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
};

/**
 * Calls the "claimReward" function on the contract.
 * @param options - The options for the "claimReward" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { claimReward } from "TODO";
 *
 * const transaction = claimReward({
 *  pid: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function claimReward(
  options: BaseTransactionOptions<ClaimRewardParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xae169a50",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid ],
  });
};

/**
 * Represents the parameters for the "claimRewards" function.
 */
export type ClaimRewardsParams = {
  pids: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "_pids", "type": "uint256[]" }>
};

/**
 * Calls the "claimRewards" function on the contract.
 * @param options - The options for the "claimRewards" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { claimRewards } from "TODO";
 *
 * const transaction = claimRewards({
 *  pids: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function claimRewards(
  options: BaseTransactionOptions<ClaimRewardsParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x5eac6239",
      [
        {
          "internalType": "uint256[]",
          "name": "_pids",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.pids ],
  });
};

/**
 * Represents the parameters for the "correctWithdrawal" function.
 */
export type CorrectWithdrawalParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  user: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_user", "type": "address" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_amount", "type": "uint256" }>
};

/**
 * Calls the "correctWithdrawal" function on the contract.
 * @param options - The options for the "correctWithdrawal" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { correctWithdrawal } from "TODO";
 *
 * const transaction = correctWithdrawal({
 *  pid: ...,
 *  user: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function correctWithdrawal(
  options: BaseTransactionOptions<CorrectWithdrawalParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x5643759e",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "address",
          "name": "_user",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid, options.user, options.amount ],
  });
};

/**
 * Represents the parameters for the "deposit" function.
 */
export type DepositParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_amount", "type": "uint256" }>
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
 *  pid: ...,
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
      "0xe2bbb158",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid, options.amount ],
  });
};

/**
 * Represents the parameters for the "emergencyWithdraw" function.
 */
export type EmergencyWithdrawParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
};

/**
 * Calls the "emergencyWithdraw" function on the contract.
 * @param options - The options for the "emergencyWithdraw" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { emergencyWithdraw } from "TODO";
 *
 * const transaction = emergencyWithdraw({
 *  pid: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function emergencyWithdraw(
  options: BaseTransactionOptions<EmergencyWithdrawParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x5312ea8e",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid ],
  });
};

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
};

/**
 * Represents the parameters for the "initialize" function.
 */
export type InitializeParams = {
  params: AbiParameterToPrimitiveType<{
    "components": [ { "internalType": "contract IERC20ExtendedUpgradeable", "name": "govToken", "type": "address" }, {
      "internalType": "contract IERC20ExtendedUpgradeable",
      "name": "rewardToken",
      "type": "address"
    }, { "internalType": "uint256", "name": "rewardPerSecond", "type": "uint256" }, {
      "internalType": "uint256",
      "name": "startTime",
      "type": "uint256"
    }, { "internalType": "uint256", "name": "halvingAfterTime", "type": "uint256" }, {
      "internalType": "uint256",
      "name": "userDepositFee",
      "type": "uint256"
    }, { "internalType": "uint256", "name": "devDepositFee", "type": "uint256" }, {
      "internalType": "address",
      "name": "devFundAddress",
      "type": "address"
    }, { "internalType": "address", "name": "feeShareFundAddress", "type": "address" }, {
      "internalType": "address",
      "name": "marketingFundAddress",
      "type": "address"
    }, { "internalType": "address", "name": "foundersFundAddress", "type": "address" }, {
      "internalType": "uint256[]",
      "name": "rewardMultipliers",
      "type": "uint256[]"
    }, { "internalType": "uint256[]", "name": "userFeeStages", "type": "uint256[]" }, {
      "internalType": "uint256[]",
      "name": "devFeeStages",
      "type": "uint256[]"
    }, { "internalType": "uint256[]", "name": "percentLockBonusReward", "type": "uint256[]" } ],
    "internalType": "struct MasterInvestor.ConstructorParams",
    "name": "params",
    "type": "tuple"
  }>
};

/**
 * Calls the "initialize" function on the contract.
 * @param options - The options for the "initialize" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { initialize } from "TODO";
 *
 * const transaction = initialize({
 *  params: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function initialize(
  options: BaseTransactionOptions<InitializeParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x94a918b7",
      [
        {
          "components": [
            {
              "internalType": "contract IERC20ExtendedUpgradeable",
              "name": "govToken",
              "type": "address",
            },
            {
              "internalType": "contract IERC20ExtendedUpgradeable",
              "name": "rewardToken",
              "type": "address",
            },
            {
              "internalType": "uint256",
              "name": "rewardPerSecond",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "halvingAfterTime",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "userDepositFee",
              "type": "uint256",
            },
            {
              "internalType": "uint256",
              "name": "devDepositFee",
              "type": "uint256",
            },
            {
              "internalType": "address",
              "name": "devFundAddress",
              "type": "address",
            },
            {
              "internalType": "address",
              "name": "feeShareFundAddress",
              "type": "address",
            },
            {
              "internalType": "address",
              "name": "marketingFundAddress",
              "type": "address",
            },
            {
              "internalType": "address",
              "name": "foundersFundAddress",
              "type": "address",
            },
            {
              "internalType": "uint256[]",
              "name": "rewardMultipliers",
              "type": "uint256[]",
            },
            {
              "internalType": "uint256[]",
              "name": "userFeeStages",
              "type": "uint256[]",
            },
            {
              "internalType": "uint256[]",
              "name": "devFeeStages",
              "type": "uint256[]",
            },
            {
              "internalType": "uint256[]",
              "name": "percentLockBonusReward",
              "type": "uint256[]",
            },
          ],
          "internalType": "struct MasterInvestor.ConstructorParams",
          "name": "params",
          "type": "tuple",
        },
      ],
      [],
    ],
    params: [ options.params ],
  });
};

/**
 * Calls the "massUpdatePools" function on the contract.
 * @param options - The options for the "massUpdatePools" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { massUpdatePools } from "TODO";
 *
 * const transaction = massUpdatePools();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function massUpdatePools(
  options: BaseTransactionOptions,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x630b5ba1",
      [],
      [],
    ],
    params: [],
  });
};

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
};

/**
 * Represents the parameters for the "reviseDeposit" function.
 */
export type ReviseDepositParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  user: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_user", "type": "address" }>
  time: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_time", "type": "uint256" }>
};

/**
 * Calls the "reviseDeposit" function on the contract.
 * @param options - The options for the "reviseDeposit" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { reviseDeposit } from "TODO";
 *
 * const transaction = reviseDeposit({
 *  pid: ...,
 *  user: ...,
 *  time: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function reviseDeposit(
  options: BaseTransactionOptions<ReviseDepositParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x82386d58",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "address",
          "name": "_user",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "_time",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid, options.user, options.time ],
  });
};

/**
 * Represents the parameters for the "reviseWithdraw" function.
 */
export type ReviseWithdrawParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  user: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_user", "type": "address" }>
  time: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_time", "type": "uint256" }>
};

/**
 * Calls the "reviseWithdraw" function on the contract.
 * @param options - The options for the "reviseWithdraw" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { reviseWithdraw } from "TODO";
 *
 * const transaction = reviseWithdraw({
 *  pid: ...,
 *  user: ...,
 *  time: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function reviseWithdraw(
  options: BaseTransactionOptions<ReviseWithdrawParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x6066debd",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "address",
          "name": "_user",
          "type": "address",
        },
        {
          "internalType": "uint256",
          "name": "_time",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid, options.user, options.time ],
  });
};

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
};

/**
 * Represents the parameters for the "set" function.
 */
export type SetParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  allocPoint: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }>
  withUpdate: AbiParameterToPrimitiveType<{ "internalType": "bool", "name": "_withUpdate", "type": "bool" }>
};

/**
 * Calls the "set" function on the contract.
 * @param options - The options for the "set" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { set } from "TODO";
 *
 * const transaction = set({
 *  pid: ...,
 *  allocPoint: ...,
 *  withUpdate: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function set(
  options: BaseTransactionOptions<SetParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x64482f79",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_allocPoint",
          "type": "uint256",
        },
        {
          "internalType": "bool",
          "name": "_withUpdate",
          "type": "bool",
        },
      ],
      [],
    ],
    params: [ options.pid, options.allocPoint, options.withUpdate ],
  });
};

/**
 * Represents the parameters for the "updateAddress" function.
 */
export type UpdateAddressParams = {
  kind: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "kind", "type": "uint256" }>
  address: AbiParameterToPrimitiveType<{ "internalType": "address", "name": "_address", "type": "address" }>
};

/**
 * Calls the "updateAddress" function on the contract.
 * @param options - The options for the "updateAddress" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateAddress } from "TODO";
 *
 * const transaction = updateAddress({
 *  kind: ...,
 *  address: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateAddress(
  options: BaseTransactionOptions<UpdateAddressParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x2ab29df7",
      [
        {
          "internalType": "uint256",
          "name": "kind",
          "type": "uint256",
        },
        {
          "internalType": "address",
          "name": "_address",
          "type": "address",
        },
      ],
      [],
    ],
    params: [ options.kind, options.address ],
  });
};

/**
 * Represents the parameters for the "updateDepositFee" function.
 */
export type UpdateDepositFeeParams = {
  kind: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "kind", "type": "uint256" }>
  fee: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "fee", "type": "uint256" }>
};

/**
 * Calls the "updateDepositFee" function on the contract.
 * @param options - The options for the "updateDepositFee" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateDepositFee } from "TODO";
 *
 * const transaction = updateDepositFee({
 *  kind: ...,
 *  fee: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateDepositFee(
  options: BaseTransactionOptions<UpdateDepositFeeParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xc35cadbe",
      [
        {
          "internalType": "uint256",
          "name": "kind",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "fee",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.kind, options.fee ],
  });
};

/**
 * Represents the parameters for the "updateFeeStages" function.
 */
export type UpdateFeeStagesParams = {
  kind: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "kind", "type": "uint256" }>
  feeStages: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "feeStages", "type": "uint256[]" }>
};

/**
 * Calls the "updateFeeStages" function on the contract.
 * @param options - The options for the "updateFeeStages" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateFeeStages } from "TODO";
 *
 * const transaction = updateFeeStages({
 *  kind: ...,
 *  feeStages: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateFeeStages(
  options: BaseTransactionOptions<UpdateFeeStagesParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x0d329fea",
      [
        {
          "internalType": "uint256",
          "name": "kind",
          "type": "uint256",
        },
        {
          "internalType": "uint256[]",
          "name": "feeStages",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.kind, options.feeStages ],
  });
};

/**
 * Represents the parameters for the "updateHalvingAtTimes" function.
 */
export type UpdateHalvingAtTimesParams = {
  times: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "times", "type": "uint256[]" }>
};

/**
 * Calls the "updateHalvingAtTimes" function on the contract.
 * @param options - The options for the "updateHalvingAtTimes" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateHalvingAtTimes } from "TODO";
 *
 * const transaction = updateHalvingAtTimes({
 *  times: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateHalvingAtTimes(
  options: BaseTransactionOptions<UpdateHalvingAtTimesParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xb7877716",
      [
        {
          "internalType": "uint256[]",
          "name": "times",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.times ],
  });
};

/**
 * Represents the parameters for the "updateLastRewardTime" function.
 */
export type UpdateLastRewardTimeParams = {
  time: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "time", "type": "uint256" }>
};

/**
 * Calls the "updateLastRewardTime" function on the contract.
 * @param options - The options for the "updateLastRewardTime" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateLastRewardTime } from "TODO";
 *
 * const transaction = updateLastRewardTime({
 *  time: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateLastRewardTime(
  options: BaseTransactionOptions<UpdateLastRewardTimeParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x6461fc8c",
      [
        {
          "internalType": "uint256",
          "name": "time",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.time ],
  });
};

/**
 * Represents the parameters for the "updateLockPercent" function.
 */
export type UpdateLockPercentParams = {
  kind: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "kind", "type": "uint256" }>
  percent: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "percent", "type": "uint256" }>
};

/**
 * Calls the "updateLockPercent" function on the contract.
 * @param options - The options for the "updateLockPercent" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateLockPercent } from "TODO";
 *
 * const transaction = updateLockPercent({
 *  kind: ...,
 *  percent: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateLockPercent(
  options: BaseTransactionOptions<UpdateLockPercentParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x35582e68",
      [
        {
          "internalType": "uint256",
          "name": "kind",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "percent",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.kind, options.percent ],
  });
};

/**
 * Represents the parameters for the "updatePool" function.
 */
export type UpdatePoolParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
};

/**
 * Calls the "updatePool" function on the contract.
 * @param options - The options for the "updatePool" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updatePool } from "TODO";
 *
 * const transaction = updatePool({
 *  pid: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updatePool(
  options: BaseTransactionOptions<UpdatePoolParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x51eb05a6",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid ],
  });
};

/**
 * Represents the parameters for the "updateRewardMultipliers" function.
 */
export type UpdateRewardMultipliersParams = {
  multipliers: AbiParameterToPrimitiveType<{ "internalType": "uint256[]", "name": "multipliers", "type": "uint256[]" }>
};

/**
 * Calls the "updateRewardMultipliers" function on the contract.
 * @param options - The options for the "updateRewardMultipliers" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateRewardMultipliers } from "TODO";
 *
 * const transaction = updateRewardMultipliers({
 *  multipliers: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateRewardMultipliers(
  options: BaseTransactionOptions<UpdateRewardMultipliersParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0xbd27e3f8",
      [
        {
          "internalType": "uint256[]",
          "name": "multipliers",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.multipliers ],
  });
};

/**
 * Represents the parameters for the "updateRewardPerSecond" function.
 */
export type UpdateRewardPerSecondParams = {
  reward: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "reward", "type": "uint256" }>
};

/**
 * Calls the "updateRewardPerSecond" function on the contract.
 * @param options - The options for the "updateRewardPerSecond" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateRewardPerSecond } from "TODO";
 *
 * const transaction = updateRewardPerSecond({
 *  reward: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateRewardPerSecond(
  options: BaseTransactionOptions<UpdateRewardPerSecondParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x4004c8e7",
      [
        {
          "internalType": "uint256",
          "name": "reward",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.reward ],
  });
};

/**
 * Represents the parameters for the "updateStartTime" function.
 */
export type UpdateStartTimeParams = {
  time: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "time", "type": "uint256" }>
};

/**
 * Calls the "updateStartTime" function on the contract.
 * @param options - The options for the "updateStartTime" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateStartTime } from "TODO";
 *
 * const transaction = updateStartTime({
 *  time: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateStartTime(
  options: BaseTransactionOptions<UpdateStartTimeParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x06bcf02f",
      [
        {
          "internalType": "uint256",
          "name": "time",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.time ],
  });
};

/**
 * Represents the parameters for the "updateUserLockPercents" function.
 */
export type UpdateUserLockPercentsParams = {
  lockPercents: AbiParameterToPrimitiveType<{
    "internalType": "uint256[]",
    "name": "lockPercents",
    "type": "uint256[]"
  }>
};

/**
 * Calls the "updateUserLockPercents" function on the contract.
 * @param options - The options for the "updateUserLockPercents" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { updateUserLockPercents } from "TODO";
 *
 * const transaction = updateUserLockPercents({
 *  lockPercents: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function updateUserLockPercents(
  options: BaseTransactionOptions<UpdateUserLockPercentsParams>,
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
      "0x65cf3771",
      [
        {
          "internalType": "uint256[]",
          "name": "lockPercents",
          "type": "uint256[]",
        },
      ],
      [],
    ],
    params: [ options.lockPercents ],
  });
};

/**
 * Represents the parameters for the "withdraw" function.
 */
export type WithdrawParams = {
  pid: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_pid", "type": "uint256" }>
  amount: AbiParameterToPrimitiveType<{ "internalType": "uint256", "name": "_amount", "type": "uint256" }>
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
 *  pid: ...,
 *  amount: ...,
 *  address: ...,
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
      "0x441a3e70",
      [
        {
          "internalType": "uint256",
          "name": "_pid",
          "type": "uint256",
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256",
        },
      ],
      [],
    ],
    params: [ options.pid, options.amount ],
  });
};
