import { chain, client } from "@/lib/thirdweb/config";
import { Button, Slot } from "@workspace/ui/components/button";
import type { ComponentProps, MouseEvent } from "react";
import { useLinkProfile } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

const LinkWalletButton = ({ asChild, ...props }: ComponentProps<typeof Button>) => {
  const Comp = asChild ? Slot : "button";
  const { mutateAsync } = useLinkProfile();

  const onClick = async (e: MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    try {
      await mutateAsync({ client, strategy: "wallet", chain, wallet: createWallet("walletConnect") });
    } catch (e) {
      console.error("Failed to link wallet:", e);
    }
  };
  return (
    <Comp onClick={onClick} {...props} />
  );
};
LinkWalletButton.displayName = "LinkWalletButton";

export { LinkWalletButton };
