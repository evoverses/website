import { CEvoCard } from "@/app/(authenticated)/account/cevo-card";
import { PoolCard } from "@/app/(authenticated)/account/pool-card";
import { XEvoCard } from "@/app/(authenticated)/account/xevo-card";
import Web3Provider from "@/components/providers/web3-provider";

const AccountPage = async () => {
  return (
    <Web3Provider>
      <main className="flex min-h-screen flex-col items-center justify-around p-24 pb-4 px-4 sm:px-24">
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          <PoolCard />
          <XEvoCard />
          <CEvoCard />
        </div>
      </main>
    </Web3Provider>
  );
};

export default AccountPage;
