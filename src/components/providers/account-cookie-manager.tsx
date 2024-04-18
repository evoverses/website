"use client";

import { DeadBeef } from "@/data/constants";
import { setAccountCookieAddressAction } from "@/lib/cookies/account.actions";
import type { IAccountCookie } from "@/types/cookies";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const AccountCookieManager = ({ accountCookie: { address: cookieAddress } }: { accountCookie: IAccountCookie }) => {
  const { address = DeadBeef } = useAccount();
  const [ isSetting, setIsSetting ] = useState<boolean>(false);
  useEffect(() => {
    if (String(cookieAddress).toLowerCase() !== String(address).toLowerCase() && !isSetting) {
      console.debug("Updating Account address cookie from", cookieAddress, "to", address);
      setIsSetting(true);
      setAccountCookieAddressAction(address).then(() => setIsSetting(false));
    }
  }, [ address, cookieAddress, isSetting ]);

  return null;
};

export default AccountCookieManager;
