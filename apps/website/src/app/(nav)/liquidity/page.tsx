import { BankCard, EvoCard, FarmCard, VestingCard } from "@/app/(nav)/profile/liquidity/cards";
import { WalletButton } from "@/components/buttons/wallet-button";

import { Separator } from "@workspace/ui/components/separator";

// This page is here solely for those who think they are somehow elite anonymous hackers -.-

const LiquidityPage = async () => {
  return (
    <main className="flex flex-col h-full space-y-6">
      <div className="flex flex-col px-4 pt-6 lg:items-center">
        <h3 className="text-lg font-medium">Liquidity</h3>
        <p className="text-sm text-muted-foreground !mt-0">
          Manage your liquidity pools, banked EVO, and locked EVO.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col items-center">
        <WalletButton className="w-fit" />
      </div>
      <div className="flex flex-wrap gap-4 items-stretch justify-center w-full pb-6">
        <EvoCard />
        <FarmCard />
        <BankCard />
        <VestingCard />
      </div>
    </main>
  );
};

export default LiquidityPage;
