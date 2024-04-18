"use client";

import { DeadBeef } from "@/data/constants";
import { setAccountCookieAddressAction } from "@/lib/cookies/account.actions";
import type { IAccountCookie } from "@/types/cookies";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const AccountCookieManager = ({ accountCookie: { address: cookieAddress } }: { accountCookie: IAccountCookie }) => {
  const router = useRouter();
  const { address = DeadBeef } = useAccount();
  const [ isSetting, setIsSetting ] = useState<boolean>(false);
  useEffect(() => {
    if (String(cookieAddress).toLowerCase() !== String(address).toLowerCase() && !isSetting) {
      setIsSetting(true);
      setAccountCookieAddressAction(address).then(() => {
        setIsSetting(false);
        router.refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ address, cookieAddress, isSetting ]);

  return null;
};

export default AccountCookieManager;
