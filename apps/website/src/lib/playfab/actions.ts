"use server";
import { CLIENT_URL, headers } from "@/lib/playfab/common";

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
