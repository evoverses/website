"use client";

import { DeadBeef } from "@/data/constants";
import type { IAccountCookie } from "@/types/cookies";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";

const AccountCookieManager = ({ accountCookie: { address: cookieAddress } }: { accountCookie: IAccountCookie }) => {
  const router = useRouter();
  const account = useActiveAccount();
  const address = useMemo(() => account?.address ?? DeadBeef, [ account ]);

  useEffect(() => {
    if (String(cookieAddress).toLowerCase() !== String(address).toLowerCase()) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ address, cookieAddress ]);

  return null;
};

export default AccountCookieManager;
