"use client";

import { getAccountCookieAction, setAccountCookieAddressAction } from "@/lib/cookies/account.actions";
import { useAddress } from "@/lib/wagmi";
import { useEffect } from "react";

const AccountCookieManager = () => {
  const { address } = useAddress();

  useEffect(() => {
    const get = async () => {
      const accountCookie = await getAccountCookieAction();
      if (address !== accountCookie.address) {
        await setAccountCookieAddressAction(address);
      }
    };

    get().then();
  }, [ address ]);

  return null;
};

export default AccountCookieManager;
