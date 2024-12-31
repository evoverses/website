import { ClientAccountProvider } from "@/components/providers/client-account-provider";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { type PropsWithChildren } from "react";

const AccountProvider = async ({ children }: PropsWithChildren) => {
  const accountCookie = await getAccountCookie();
  return (
    <ClientAccountProvider accountCookie={accountCookie}>
      {children}
    </ClientAccountProvider>
  );
};
AccountProvider.displayName = "AccountProvider";
export { AccountProvider };
