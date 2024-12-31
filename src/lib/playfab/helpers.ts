import { PlayFab } from "@/lib/playfab/types";
import { Address } from "thirdweb";
import InfoResultPayload = PlayFab.Client.Account.Responses.InfoResultPayload;
import UserDataRecord = PlayFab.Client.Account.UserDataRecord;

type Data = Record<string, Record<string, unknown>>;
export type UserData = {
  account: {
    title: string
    avatar: number
    level: number
    frame: number
  }
}

export type UserReadOnlyData = {
  wallets: {
    managed?: Address
    primary?: Address
    connected: Address[]
  }
}
export type AnyUserData = UserData | UserReadOnlyData;

const defaultReadOnlyData: UserReadOnlyData = {
  wallets: {
    connected: [],
  },
};
const defaultData: UserData = {
  account: {
    title: "",
    avatar: 0,
    level: 1,
    frame: 0,
  },
};
const parseData = (data: Record<string, UserDataRecord>) => {
  const parsed = Object.entries(data).reduce((acc, [ key, value ]) => {
    acc[key] = JSON.parse(value.Value);
    return acc;
  }, {} as Data);
  return "account" in parsed ? parsed as UserData : parsed as UserReadOnlyData;
};

const getUserDataParsed = (info: InfoResultPayload, readOnly?: boolean) => {
  const data = readOnly ? info.UserReadOnlyData : info.UserData;
  if (!data) {
    return readOnly ? defaultReadOnlyData : defaultData;
  }
  const parsed = parseData(data);
  return readOnly
    ? { ...defaultReadOnlyData, ...parsed } as UserReadOnlyData
    : { ...defaultData, ...parsed } as UserData;
};

export const getUserData = (info: InfoResultPayload) => getUserDataParsed(info, false) as UserData;

export const getUserReadOnlyData = (info: InfoResultPayload) => getUserDataParsed(info, true) as UserReadOnlyData;
