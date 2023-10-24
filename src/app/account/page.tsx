import { CEvoCard } from "@/app/account/cevo-card";
import { PoolCard } from "@/app/account/pool-card";
import { XEvoCard } from "@/app/account/xevo-card";

const AccountPage = async () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24 pb-4 px-4 sm:px-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        <PoolCard />
        <XEvoCard />
        <CEvoCard />
      </div>
    </main>
  );
};

export default AccountPage;
