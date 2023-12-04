"use client";

import { getAccountCookie, setAccountCookieAddress } from "@/lib/cookies/account";
import { useAddress } from "@/lib/wagmi";
import { useEffect } from "react";

const AccountCookieManager = () => {
  const { address } = useAddress();

  useEffect(() => {
    const get = async () => {
      const accountCookie = getAccountCookie();
      if (address !== accountCookie.address) {
        await setAccountCookieAddress(address);
      }
    };

    get().then();
  }, [ address ]);

  return null;
};

export default AccountCookieManager;
