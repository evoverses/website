import { BASE_URL, CLIENT_URL, headers } from "@/lib/playfab/common";
import { PlayFab } from "@/lib/playfab/types";
import "server-only";
import { Provider } from "@/types/auth";
import AccountInfoResponse = PlayFab.Client.Account.Responses.AccountInfoResponse;
import CombinedInfoResponse = PlayFab.Client.Account.Responses.CombinedInfoResponse;
import LoginResponse = PlayFab.Client.Auth.LoginResponse;

export const loginWithGoogle = async (access_token?: string) => {
  const url = new URL("LoginWithGoogleAccount", CLIENT_URL);

  const body = JSON.stringify({
    TitleId: process.env.PLAYFAB_TITLE_ID,
    SetEmail: true,
    AccessToken: access_token,
    CreateAccount: true,
  });
  const resp = await fetch(url, { method: "POST", headers: { ...headers }, body });
  if (!resp.ok) {
    throw new Error(`Login Failed: ${resp.statusText}`);
  }
  const loginResponse = await resp.json() as LoginResponse;
  return loginResponse.data;
};

export const loginWithDiscord = async (access_token?: string) => {
  const url = new URL("LoginWithOpenIdConnect", CLIENT_URL);

  const body = JSON.stringify({
    ConnectionId: "Discord",
    IdToken: access_token,
    TitleId: process.env.PLAYFAB_TITLE_ID,
    CreateAccount: true,
  });
  const resp = await fetch(url, { method: "POST", headers: { ...headers }, body });
  if (!resp.ok) {
    console.log(resp);
    throw new Error(`Login Failed: ${resp.statusText}`);
  }

  const loginResponse = await resp.json() as LoginResponse;
  console.log(loginResponse);
  return loginResponse.data;
};

export const loginWithTwitch = async (access_token?: string) => {
  const url = new URL("LoginWithTwitch", CLIENT_URL);

  const body = JSON.stringify({
    TitleId: process.env.PLAYFAB_TITLE_ID,
    AccessToken: access_token,
    CreateAccount: true,
  });

  const resp = await fetch(url, { method: "POST", headers: { ...headers }, body });
  if (!resp.ok) {
    console.log(resp);
    throw new Error(`Login Failed: ${resp.statusText}`);
  }

  const loginResponse = await resp.json() as LoginResponse;
  return loginResponse.data;
};

export const linkTwitch = async (sessionTicket: string, access_token?: string) => {
  const url = new URL("LinkTwitch", CLIENT_URL);

  const body = JSON.stringify({ AccessToken: access_token });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": sessionTicket,
    },
    body,
  });

  if (!resp.ok) {
    console.log(resp);
    console.log(await resp.text());
    throw new Error(`Login Failed: ${resp.statusText}`);
  }
};

export const getAccountInfo = async (id: string, clientSessionTicket: string) => {
  const url = new URL("GetAccountInfo", CLIENT_URL);

  const body = JSON.stringify({ PlayFabId: id });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": clientSessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`Get Account Info Failed: ${resp.statusText}`);
  }
  const data = await resp.json() as AccountInfoResponse;
  return data.data.AccountInfo;
};

const getPlayFabIdFomProvider = async (provider: Provider, id: string) => {
  const url = new URL(`GetPlayFabIDsFrom${provider.slice(0, 1).toUpperCase()}${provider.slice(-1)}IDs`, CLIENT_URL);

  const body = JSON.stringify({ PlayFabId: id });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      // "X-Authorization": clientSessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`Get Account Info Failed: ${resp.statusText}`);
  }
  const data = await resp.json() as AccountInfoResponse;
  return data.data.AccountInfo;
};

export const getCombinedPlayerInfo = async (playFabId: string, clientSessionTicket: string) => {
  const url = new URL("GetPlayerCombinedInfo", CLIENT_URL);

  const body = JSON.stringify({
    InfoRequestParameters: {
      GetCharacterInventories: true,
      GetCharacterList: true,
      GetPlayerProfile: true,
      GetPlayerStatistics: true,
      GetTitleData: true,
      GetUserAccountInfo: true,
      GetUserData: true,
      GetUserInventory: true,
      GetUserReadOnlyData: true,
      GetUserVirtualCurrency: true,
      ProfileConstraints: {
        ShowAvatarUrl: true,
        ShowBannedUntil: true,
        ShowCampaignAttributions: true,
        ShowContactEmailAddresses: true,
        ShowCreated: true,
        ShowDisplayName: true,
        ShowExperimentVariants: true,
        ShowLastLogin: true,
        ShowLinkedAccounts: true,
        ShowLocations: true,
        ShowMemberships: false,
        ShowOrigination: true,
        ShowPushNotificationRegistrations: true,
        ShowStatistics: true,
        ShowTags: true,
        ShowTotalValueToDateInUsd: true,
        ShowValuesToDate: true,
        ShowVirtualCurrencyBalances: false,
      },
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
    throw new Error(`Get Account Info Failed: ${resp.statusText}`);
  }
  const json = await resp.json() as CombinedInfoResponse;
  return json.data.InfoResultPayload;
};

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
  console.log("JSON", json);
  return json.data.EntityToken;
};
