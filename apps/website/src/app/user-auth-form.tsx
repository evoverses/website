import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Icons } from "@workspace/ui/components/icons";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { HTMLAttributes } from "react";

interface UserAuthFormProps extends HTMLAttributes<HTMLDivElement> {
  isCreateAccount?: boolean;
}

export const UserAuthForm = ({ isCreateAccount, className, ...props }: UserAuthFormProps) => {
  const isLoading = false;
  const providers = [
    {
      name: "Google",
      icon: Icons.google,
    },
    {
      name: "Twitch",
      icon: Icons.twitch,
    },
    {
      name: "Epic",
      icon: Icons.epic,
      disabled: true,
    },
    {
      name: "Discord",
      icon: Icons.discord,
      disabled: true,
    },
    {
      name: "Apple",
      icon: Icons.apple,
      disabled: true,
    },
  ];
  return (
    <form>
      <div className={cn("grid gap-6", className)} {...props}>
        {isCreateAccount && (
          <>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="username">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Username"
                  type="username"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Then continue with
                </span>
              </div>
            </div>
          </>
        )}
        <div className="grid gap-6">
          {providers.map(({ name, icon: Icon, disabled }) => (
            <Button
              key={name}
              variant="outline"
              type="submit"
              disabled={isLoading || disabled}
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon className={cn("mr-2 h-5 w-5", { "w-6 h-6": name === "Wallet" })} />
              )}
              <span className="w-36">Sign {isCreateAccount ? "Up" : "In"} with {name}</span>
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
};
