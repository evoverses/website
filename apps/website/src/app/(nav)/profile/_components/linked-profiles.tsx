"use client";

import { AutoConnect } from "@/components/auto-connect";
import { cn } from "@/lib/utils";
import { client } from "@/thirdweb.config";
import { useProfiles } from "@/thirdweb/hooks/use-profiles";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import { Icons } from "@workspace/ui/components/icons";
import { Label } from "@workspace/ui/components/label";
import { useLinkProfile } from "thirdweb/react";
import type { InAppWalletSocialAuth } from "thirdweb/wallets";

const connections: Record<string, { Icon: any }> = {
  Google: {
    Icon: Icons.google,
  },
  Twitch: {
    Icon: Icons.twitch,
  },
  Discord: {
    Icon: Icons.discord,
  },
  X: {
    Icon: Icons.x,
  },
  Facebook: {
    Icon: Icons.facebook,
  },
  // Steam: {
  //   Icon: Icons.steam
  // },
  Apple: {
    Icon: Icons.apple,
  },
};

const LinkedProfiles = () => {
  const { profiles, refetch } = useProfiles();
  const { mutate: linkProfile } = useLinkProfile();
  return (
    <div className="grid gap-2">
      <AutoConnect />
      <Label htmlFor="buttons">Connections</Label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(connections).map(([ name, { Icon } ]) => {
          const linked = profiles.some((p) => p.type.toLowerCase().includes(name.toLowerCase()));
          return (
            <Button
              key={name}
              variant="outline"
              type="submit"
              size="lg"
              disabled={linked}
              className={cn("font-bold relative", { "bg-green-500 text-white": linked })}
              onClick={() => {
                // noinspection JSUnusedGlobalSymbols
                linkProfile(
                  { client, strategy: name.toLowerCase() as InAppWalletSocialAuth },
                  { onSuccess: () => refetch() },
                );
              }}
            >
              <Icon className="h-5 w-5 mr-2" />
              {name}
              {linked && <CheckIcon className="absolute right-2 h-5 w-5" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export { LinkedProfiles };
