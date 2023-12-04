import { BASE_URL, headers } from "@/lib/playfab/common";
import { PlayFab } from "@/lib/playfab/types";
import "server-only";
import AccountInfoResponse = PlayFab.Client.Account.Responses.AccountInfoResponse;
import CombinedInfoResponse = PlayFab.Client.Account.Responses.CombinedInfoResponse;
import LoginResponse = PlayFab.Client.Auth.LoginResponse;

export const loginWithGoogle = async (access_token: string) => {
  const url = new URL("LoginWithGoogleAccount", BASE_URL);

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

export const getAccountInfo = async (id: string, clientSessionTicket: string) => {
  const url = new URL("GetAccountInfo", BASE_URL);

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

export const getCombinedPlayerInfo = async (playFabId: string, clientSessionTicket: string) => {
  const url = new URL("GetPlayerCombinedInfo", BASE_URL);

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
