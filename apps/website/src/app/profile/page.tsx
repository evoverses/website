import { LinkedProfiles } from "@/app/profile/_components/linked-profiles";
import { ProfileForm } from "@/app/profile/_components/profile-form";
import SmartWalletForm from "@/app/profile/_components/smart-wallet-form";
import { isLoggedIn } from "@/lib/thirdweb/auth";
import { Separator } from "@workspace/ui/components/separator";
import { unauthorized } from "next/navigation";

const AccountPage = async () => {
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
      <SmartWalletForm />
      <ProfileForm />
      <LinkedProfiles />
    </main>
  );
};

export default AccountPage;
