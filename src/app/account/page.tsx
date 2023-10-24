import { PoolCard } from "@/app/account/pool-card";
import { XEvoCard } from "@/app/account/xevo-card";

const AccountPage = async () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24 pb-4 px-4 sm:px-24">
      <div className="flex flex-col lg:flex-row gap-4">
        <PoolCard />
        <XEvoCard />
      </div>
    </main>
  );
};

export default AccountPage;
