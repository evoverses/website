import { Address } from "abitype";
import { cache } from "react";

const SQUID_URL = new URL("https://squid.subsquid.io/ownership/v/v1/graphql");
const method = "POST";
const headers = { "Content-Type": "application/json" };

export const getEvoIdsOfWallet = cache(async (wallet: Address) => {
  const body = JSON.stringify({
    operationName: "GetIds",
    query: `query GetIds($id: String!) { walletById(id: $id}) { id tokens { tokenId } } }`,
    variables: { id: wallet },
  });
  const resp = await fetch(SQUID_URL, { method, headers, body });
  if (!resp.ok) {
    console.error(`Failed to get Evo IDs of wallet ${wallet}: ${resp.statusText}`);
    return [];
  }
  const json = await resp.json() as { data: { walletById: { id: string, tokens: { tokenId: string }[] } } };
  return json.data.walletById.tokens.map(token => token.tokenId);
});

export const getEvoHistory = cache(async (tokenId: string) => {
  const body = JSON.stringify({
    operationName: "GetHistory",
    query: `query GetHistory($id: String!) { tokenById(id: $id) { owner { id } transfers { block from { id } id timestamp to { id } txHash } } }`,
    variables: { id: `0x4151b8afa10653d304fdac9a781afccd45ec164c-${tokenId}` },
  });
  const resp = await fetch(SQUID_URL, { method, headers, body });
  if (!resp.ok) {
    console.error(`Failed to get history of Evo #${tokenId}: ${resp.statusText}`);
    return undefined;
  }
  const json = await resp.json() as {
    data: {
      tokenById: {
        owner: { id: string },
        transfers: {
          block: number,
          from: { id: string },
          id: string,
          timestamp: string,
          to: { id: string },
          txHash: string
        }[]
      }
    }
  };
  return {
    owner: json.data.tokenById.owner.id,
    transfers: json.data.tokenById.transfers.map(transfer => (
      {
        block: transfer.block,
        from: transfer.from.id,
        id: transfer.id,
        timestamp: transfer.timestamp,
        to: transfer.to.id,
        txHash: transfer.txHash,
      }
    )),
  };
});
