"use server";
import { CLIENT_URL, headers } from "@/lib/playfab/common";
import { Address } from "abitype";

export const linkWallet2 = async (address: Address, clientSessionTicket: string) => {
  const url = new URL("AddGenericID", CLIENT_URL);
  console.log("LINKING", address, clientSessionTicket);
  console.log(url.toString());
  const body = JSON.stringify({
    GenericId: {
      ServiceName: "Web3",
      UserId: address,
    },
  });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": clientSessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    console.log("LINK FAILED", resp);
    throw new Error(`Link Failed: ${resp.statusText}`);
  }
};

export const linkWallet = async (address: Address, clientSessionTicket: string) => {

  const url = new URL("LinkCustomID", CLIENT_URL);

  const body = JSON.stringify({
    TitleId: process.env.PLAYFAB_TITLE_ID,
    CustomId: address,
    ForceLink: false,
  });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": clientSessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`Link Failed: ${resp.statusText}`);
  }
};

export const updateUserTitleDisplayName = async (displayName: string, clientSessionTicket: string) => {
  const url = new URL("UpdateUserTitleDisplayName", CLIENT_URL);

  const body = JSON.stringify({
    DisplayName: displayName,
  });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": clientSessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`UpdateUserTitleDisplayName Failed: ${resp.statusText}`);
  }
};
