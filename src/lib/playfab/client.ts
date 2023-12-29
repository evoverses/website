import "server-only";
import { CLIENT_URL, headers } from "@/lib/playfab/common";
import { PlayFab } from "@/lib/playfab/types";
import { Provider } from "@/types/auth";
import AccountInfoResponse = PlayFab.Client.Account.Responses.AccountInfoResponse;
import CombinedInfoResponse = PlayFab.Client.Account.Responses.CombinedInfoResponse;
import LoginResponse = PlayFab.Client.Auth.LoginResponse;

const InfoRequestParameters = {
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
};

export const loginWithSocialAuth = (provider: Provider, access_token?: string) => {
  switch (provider) {
    case "google":
      return loginWithGoogle(access_token);
    // case "discord":
    //   return loginWithDiscord(access_token);
    case "twitch":
      return loginWithTwitch(access_token);
    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
};

export const loginWithGoogle = async (access_token?: string) => {
  const url = new URL("LoginWithGoogleAccount", CLIENT_URL);

  const body = JSON.stringify({
    TitleId: process.env.PLAYFAB_TITLE_ID,
    SetEmail: true,
    AccessToken: access_token,
    CreateAccount: true,
    InfoRequestParameters,
  });
  const resp = await fetch(url, { method: "POST", headers: { ...headers }, body });
  if (!resp.ok) {
    console.error(await resp.text());
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
    InfoRequestParameters,
  });
  const resp = await fetch(url, { method: "POST", headers: { ...headers }, body });
  if (!resp.ok) {
    console.error(await resp.text());
    throw new Error(`Login Failed: ${resp.statusText}`);
  }

  const loginResponse = await resp.json() as LoginResponse;
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
    console.error(await resp.text());
    throw new Error(`Login Failed: ${resp.statusText}`);
  }

  const loginResponse = await resp.json() as LoginResponse;
  return loginResponse.data;
};

export const linkSocialAuth = async (provider: Provider, sessionTicket: string, access_token?: string) => {
  switch (provider) {
    case "google":
      return linkGoogle(sessionTicket, access_token);
    // case "discord":
    //   return linkDiscord(sessionTicket, access_token);
    case "twitch":
      return linkTwitch(sessionTicket, access_token);
    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
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
    console.error(await resp.text());
    throw new Error(`Link Failed: ${resp.statusText}`);
  }
};

export const linkGoogle = async (sessionTicket: string, access_token?: string) => {
  const url = new URL("LinkGoogleAccount", CLIENT_URL);
  const body = JSON.stringify({
    AccessToken: access_token,
    SetEmail: true,
  });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": sessionTicket,
    },
    body,
  });

  if (!resp.ok) {
    console.error(await resp.text());
    throw new Error(`Link Failed: ${resp.statusText}`);
  }
};

export const getPlayFabIDFromSocialLoginID = async (provider: Provider, id: string, sessionTicket: string) => {
  switch (provider) {
    case "google":
      return getPlayFabIDFromGoogleID(id, sessionTicket);
    // case "discord":
    //   return getPlayFabIDFromDiscordID(id, "");
    case "twitch":
      return getPlayFabIDFromTwitchID(id, sessionTicket);
    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
};

export const getPlayFabIDFromGoogleID = async (id: string, sessionTicket: string) => {
  const url = new URL("GetPlayFabIDsFromGoogleIDs", CLIENT_URL);

  const body = JSON.stringify({ GoogleIDs: [ id ] });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": sessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`Get GoogleID Failed: ${resp.statusText}`);
  }
  const data = await resp.json() as { data: { Data: { GoogleId: string, PlayFabId: string }[] } };
  return data.data.Data.length === 0 ? undefined : data.data.Data[0].PlayFabId;
};

export const getPlayFabIDFromTwitchID = async (id: string, sessionTicket: string) => {
  const url = new URL("GetPlayFabIDsFromTwitchIDs", CLIENT_URL);

  const body = JSON.stringify({ TwitchIds: [ id ] });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "X-Authorization": sessionTicket,
    },
    body,
  });
  if (!resp.ok) {
    throw new Error(`Get TwitchId Failed: ${resp.statusText}`);
  }
  const data = await resp.json() as { data: { Data: { TwitchId: string, PlayFabId: string }[] } };
  return data.data.Data.length === 0 ? undefined : data.data.Data[0].PlayFabId;
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

export const getCombinedPlayerInfo = async (clientSessionTicket: string) => {
  const url = new URL("GetPlayerCombinedInfo", CLIENT_URL);

  const body = JSON.stringify({ InfoRequestParameters });
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
