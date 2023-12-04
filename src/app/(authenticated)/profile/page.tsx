import { ProfileForm } from "@/app/(authenticated)/profile/profile-form";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAccountCookie } from "@/lib/cookies/account";
import { getAccountInfo, getCombinedPlayerInfo } from "@/lib/playfab";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";

const connections = {
  Google: {
    Icon: Icons.google,
  },
  Discord: {
    Icon: Icons.discord,
  },
  Twitter: {
    Icon: Icons.x,
  },
  Facebook: {
    Icon: Icons.facebook,
  },
  Twitch: {
    Icon: Icons.twitch,
  },
  Steam: {
    Icon: Icons.steam,
  },
  Apple: {
    Icon: Icons.apple,
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
          {Object.entries(connections).map(([ name, { Icon } ]) => {
            const linked = combined.PlayerProfile.LinkedAccounts.some((account) => account.Platform.toLowerCase()
              .includes(name.toLowerCase()));
            return (
              <Button
                variant="outline"
                key={name}
                size="lg"
                disabled={linked}
                className={cn("font-bold relative", { "bg-green-500 text-white": linked })}
              >
                <Icon className="h-5 w-5 mr-2" />
                {name}
                {linked && <CheckIcon className="absolute right-2 h-5 w-5" />}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sign-out">Danger</Label>
        <div className="flex gap-2">
          <Button type="submit">
            Sign Out
          </Button>
          <Button type="submit">
            Delete Account
          </Button>
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
