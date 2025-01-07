"use server";
import { createAccount } from "@/lib/evoverses/engine";
import { UserReadOnlyData } from "@/lib/playfab/helpers";
import { updateUserReadOnlyData } from "@/lib/playfab/server";

export const createAccountAction = async (accountId: string) => {
  return createAccount(accountId);
};

export const updateUserReadOnlyDataAction = async (playFabId: string, data: UserReadOnlyData) => {
  return updateUserReadOnlyData(playFabId, data);
};
