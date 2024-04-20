"use client";

import { DeadBeef } from "@/data/constants";
import type { IAccountCookie } from "@/types/cookies";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

const AccountCookieManager = ({ accountCookie: { address: cookieAddress } }: { accountCookie: IAccountCookie }) => {
  const router = useRouter();
  const { address = DeadBeef } = useAccount();

  useEffect(() => {
    if (String(cookieAddress).toLowerCase() !== String(address).toLowerCase()) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ address, cookieAddress ]);

  return null;
};

export default AccountCookieManager;
