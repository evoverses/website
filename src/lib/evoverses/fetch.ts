import "server-only";
import { evoContract } from "@/data/contracts";
import { Address } from "abitype";
import { cache } from "react";
import { toHex } from "viem";

const BASE_URL = process.env.ENGINE_BASE_URL;
const CHAIN = "avalanche" as const;
const FACTORY_MANAGER = process.env.ENGINE_FACTORY_MANAGER as Address;
const ACCOUNT_FACTORY = process.env.ENGINE_ACCOUNT_FACTORY as Address;
const CONTRACT_URL = new URL(`/contract/${CHAIN}/${ACCOUNT_FACTORY}/`, BASE_URL);
const BACKEND_WALLET_URL = new URL(`/backend-wallet/${CHAIN}/`, BASE_URL);

const headers = {
  Accept: "application/json",
  Authorization: `Bearer ${process.env.ENGINE_ACCESS_TOKEN}`,
};
export const createAccount = async (accountId: string) => {
  const extraData = toHex(accountId, { size: 20 });
  const url = new URL(`account-factory/create-account`, CONTRACT_URL);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
      "x-backend-wallet-address": FACTORY_MANAGER,
    },
    body: JSON.stringify({ adminAddress: FACTORY_MANAGER, extraData }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to create account: ${resp.statusText}`);
  }
  const result = await resp.json() as { result: { queueId: string, deployedAddress: Address } };
  return result.result.queueId;
};

export const predictAccountAddress = cache(async (accountId: string) => {
  const extraData = toHex(accountId, { size: 20 });
  const url = new URL(`account-factory/predict-account-address`, CONTRACT_URL);
  url.searchParams.set("adminAddress", FACTORY_MANAGER);
  url.searchParams.set("extraData", extraData);
  const resp = await fetch(url, {
    method: "GET",
    headers,
  });
  if (!resp.ok) {
    throw new Error(`Failed to predict account address: ${resp.statusText}`);
  }
  const json = await resp.json() as { result: Address };
  return json.result;
});

export const isAccountCreated = cache(async (accountId: string) => {
  const extraData = toHex(accountId, { size: 20 });
  const url = new URL(`account-factory/is-account-deployed`, CONTRACT_URL);
  url.searchParams.set("adminAddress", FACTORY_MANAGER);
  url.searchParams.set("extraData", extraData);
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`Failed check account creation status: ${resp.statusText}`);
  }
  const json = await resp.json() as { result: boolean };
  return json.result;
});

export const getGasBalance = cache(async (address: Address) => {
  const url = new URL(`${address}/get-balance`, BACKEND_WALLET_URL);
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to get gas balance: ${resp.statusText}`);
  }
  const json = await resp.json() as {
    result:
      {
        walletAddress: Address,
        name: string,
        symbol: string,
        decimals: number,
        value: string,
        displayValue: string,
      }
  };
  return json.result;
});

export const getEvoBalance = cache(async (address: Address) => {
  const url = new URL(`/contract/${CHAIN}/${evoContract.address}/erc20/balance-of`, BASE_URL);
  url.searchParams.set("wallet_address", address);
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to get Evo balance: ${resp.statusText}`);
  }
  const json = await resp.json() as {
    result:
      {
        name: string,
        symbol: string,
        decimals: number,
        value: string,
        displayValue: string,
      }
  };
  return json.result;
});

export const getQueueStatus = cache(async (queueId: string) => {
  const url = new URL(`transaction/status/${queueId}`, BASE_URL);
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to get queue status: ${resp.statusText}`);
  }
  const json = await resp.json() as { result: { status: "mined" | "errored" | "cancelled" } };
  return json.result.status;
});
