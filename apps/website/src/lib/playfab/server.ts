import "server-only";
import { BASE_URL, headers, SERVER_URL } from "@/lib/playfab/common";
import { UserReadOnlyData } from "@/lib/playfab/helpers";

export const getBackendEntityKey = async () => {
  const url = new URL("/Authentication/GetEntityToken", BASE_URL);
  const body = JSON.stringify({ Entity: { Id: process.env.PLAYFAB_TITLE_ID, type: "title" } });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-SecretKey": process.env.PLAYFAB_SECRET_KEY!,
    },
    body,
  });
  const json = await resp.json() as { data: { EntityToken: string } };
  return json.data.EntityToken;
};

export const updateUserReadOnlyData = async (playFabId: string, data: UserReadOnlyData) => {
  const url = new URL("UpdateUserReadOnlyData", SERVER_URL);
  const body = JSON.stringify({
    PlayFabId: playFabId,
    Data: Object.entries(data).reduce((o, [ key, value ]) => {
      o[key] = JSON.stringify(value);
      return o;
    }, {} as Record<string, string>),
    Permission: "Public",
  });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-SecretKey": process.env.PLAYFAB_SECRET_KEY!,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`UpdateUserReadOnlyData Failed: ${resp.statusText}`);
  }
};
