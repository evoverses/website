import { EvoCard, FarmCard, BankCard, VestingCard } from "@/app/profile/liquidity/cards.client";
import { Separator } from "@workspace/ui/components/separator";

const LiquidityPage = () => {
  return (
    <main className="flex flex-col h-full space-y-6">
      <div>
        <h3 className="text-lg font-medium">Liquidity</h3>
        <p className="text-sm text-muted-foreground !mt-0">
          Manage your liquidity pools, banked EVO, and locked EVO.
        </p>
      </div>
      <Separator />
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
