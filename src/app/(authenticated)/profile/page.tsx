import { linkAccount } from "@/app/(authenticated)/profile/actions";
import { ProfileForm } from "@/app/(authenticated)/profile/profile-form";
import { signOutAction } from "@/app/(public)/actions";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAccountCookie } from "@/lib/cookies/account";
import { getAccountInfo, getCombinedPlayerInfo } from "@/lib/playfab";
import { cn } from "@/lib/utils";
import { Provider } from "@/types/auth";
import { CheckIcon } from "@radix-ui/react-icons";

const connections = {
  Twitch: {
    Icon: Icons.twitch,
    disabled: false,
  },
  Google: {
    Icon: Icons.google,
    disabled: process.env.NODE_ENV === "production",
  },
  Discord: {
    Icon: Icons.discord,
    disabled: true,
  },
  Twitter: {
    Icon: Icons.x,
    disabled: true,
  },
  Facebook: {
    Icon: Icons.facebook,
    disabled: true,
  },
  Steam: {
    Icon: Icons.steam,
    disabled: true,
  },
  Apple: {
    Icon: Icons.apple,
    disabled: true,
  },
};
const AccountPage = async () => {
  const accountCookie = getAccountCookie();
  const session: any = await auth();

  const account = await getAccountInfo(session.playFab.PlayFabId, session.playFab.SessionTicket);
  const combined = await getCombinedPlayerInfo(session.playFab.PlayFabId, session.playFab.SessionTicket);
  return (
    <main className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground !mt-0">
          Manage your general account settings.
        </p>
      </div>
      <Separator />
      <ProfileForm account={account} session={session} accountCookie={accountCookie} />
      <div className="grid gap-2">
        <Label htmlFor="buttons">Connections</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(connections).map(([ name, { Icon, disabled } ]) => {
            const action = linkAccount.bind(null, name.toLowerCase() as Provider);
            const linked = combined.PlayerProfile.LinkedAccounts.some((account) => account.Platform.toLowerCase()
              .includes(name.toLowerCase()));
            return (
              <form action={action} key={name}>
                <Button
                  variant="outline"
                  type="submit"
                  size="lg"
                  disabled={linked || disabled}
                  className={cn("font-bold relative", { "bg-green-500 text-white": linked })}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {name}
                  {linked && <CheckIcon className="absolute right-2 h-5 w-5" />}
                </Button>
              </form>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sign-out">Danger</Label>
        <div className="flex gap-2">
          <form action={signOutAction}>
            <Button type="submit">
              Sign Out
            </Button>
          </form>
          <Button type="submit">
            Delete Account
          </Button>
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
