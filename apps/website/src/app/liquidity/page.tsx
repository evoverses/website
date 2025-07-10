import { BankCard, EvoCard, FarmCard, VestingCard } from "@/app/profile/liquidity/cards.client";
import { ConnectButton } from "@/components/buttons/connect-button";
import { Button } from "@workspace/ui/components/button";

import { Separator } from "@workspace/ui/components/separator";
import { WalletCardsIcon } from "lucide-react";

// This page is here solely for those who think they are somehow elite anonymous hackers -.-

const LiquidityPage = () => {
  return (
    <main className="flex flex-col h-[95cqh] space-y-6 page">
      <div className="flex flex-col px-4 pt-6 lg:items-center">
        <h3 className="text-lg font-medium">Liquidity</h3>
        <p className="text-sm text-muted-foreground !mt-0">
          Manage your liquidity pools, banked EVO, and locked EVO.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col items-center">
        <ConnectButton wallets="chain" hideConnected asChild>
          <Button variant="default">
            <WalletCardsIcon className="size-5 hidden md:inline-flex" />
            <span>Connect</span>
          </Button>
        </ConnectButton>
      </div>
      <div className="flex flex-wrap gap-4 justify-center w-full pb-6">
        <EvoCard />
        <FarmCard />
        <BankCard />
        <VestingCard />
      </div>
    </main>
  );
};

export default LiquidityPage;
