import { getPlayerAccount, getPlayerInventory } from "@/lib/player/server";
import { PlayerProfile } from "@/components/player/player-profile";
import { ProOnly } from "@/components/providers/pro-mode-provider";
import { LinkedProfiles } from "@/app/profile/_components/linked-profiles";
import { ProfileForm } from "@/app/profile/_components/profile-form";
import SmartWalletForm from "@/app/profile/_components/smart-wallet-form";
import { isLoggedIn } from "@/lib/thirdweb/auth";
import { Separator } from "@workspace/ui/components/separator";
import { unauthorized } from "next/navigation";

const AccountPage = async () => {
  const account = await getPlayerAccount();
  if (account) {
    const inventory = await getPlayerInventory().catch(() => null);
    return <PlayerProfile account={account} inventory={inventory} />;
  }
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    unauthorized();
  }
  return (
    <main className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground !mt-0">
          Manage your general account settings.
        </p>
      </div>
      <Separator />
      <ProOnly><SmartWalletForm /></ProOnly>
      <ProfileForm />
      <ProOnly><LinkedProfiles /></ProOnly>
    </main>
  );
};

export default AccountPage;
