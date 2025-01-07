import { LinkedProfiles } from "@/app/(authenticated)/profile/_components/linked-profiles";
import { ProfileForm } from "@/app/(authenticated)/profile/_components/profile-form";
import SmartWalletForm from "@/app/(authenticated)/profile/_components/smart-wallet-form";
import { signOutAction } from "@/app/(public)/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { Suspense } from "react";

const AccountPage = async () => {
  const accountCookie = await getAccountCookie();

  return (
    <main className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground !mt-0">
          Manage your general account settings.
        </p>
      </div>
      <Separator />
      <Suspense>
        <SmartWalletForm />
      </Suspense>
      <ProfileForm />
      <LinkedProfiles />
      <div className="grid gap-2">
        <Label htmlFor="sign-out">Danger</Label>
        <div className="flex gap-2">
          <form action={signOutAction}>
            <Button type="submit">
              Sign Out
            </Button>
          </form>
          {/*<Button type="submit">
            Delete Account
           </Button>*/}
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
