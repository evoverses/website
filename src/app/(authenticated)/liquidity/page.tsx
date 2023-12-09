import { CEvoCard, PoolCard, XEvoCard } from "@/app/(authenticated)/profile/liquidity/cards";
import { AccountProvider } from "@/components/providers";
import { Separator } from "@/components/ui/separator";
import { getAccountCookie } from "@/lib/cookies/account";
import { Web3Button } from "@web3modal/react";

// This page is here solely for those who think they are somehow elite anonymous hackers -.-

const LiquidityPage = async () => {
  const accountCookie = getAccountCookie();

  return (
    <AccountProvider>
      <main className="flex flex-col h-full space-y-6">
        <div className="flex flex-col px-4 pt-6 lg:items-center">
          <h3 className="text-lg font-medium">Liquidity</h3>
          <p className="text-sm text-muted-foreground !mt-0">
            Manage your liquidity pools, banked EVO, and locked EVO.
          </p>
        </div>
        <Separator />
        <div className="mx-auto" suppressHydrationWarning>
          <Web3Button icon="hide" avatar="show" balance="show" />
        </div>
        <div className="flex flex-wrap gap-4 items-stretch justify-center w-full pb-6">
          <PoolCard />
          <XEvoCard />
          <CEvoCard />
        </div>
      </main>
    </AccountProvider>
  );
};

export default LiquidityPage;
