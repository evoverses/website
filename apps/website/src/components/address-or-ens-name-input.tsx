import { client } from "@/lib/thirdweb/config";
import { shortenAddress } from "@/utils/strings";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { CircleCheckIcon, ClipboardIcon, LoaderCircleIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { defineChain } from "thirdweb";
import { viemAdapter } from "thirdweb/adapters/viem";
import { type Address, checksumAddress, isAddress } from "viem";
import { getEnsAddress, getEnsAvatar, getEnsName } from "viem/actions";
import { normalize } from "viem/ens";

export type Recipient = {
  address: Address,
  ensName?: string,
  ensAvatar?: string
}

export const AddressOrEnsNameInput = ({
  recipient,
  onRecipientSet,
  className,
  ...props
}: ComponentProps<"div"> & {
  recipient?: Recipient | null,
  onRecipientSet?: (recipient: Recipient | null) => void
}) => {
  const [ value, setValue ] = useState<string>(recipient?.address || "");
  const [ ensValue, setEnsValue ] = useState<string>(recipient?.ensName || "");
  const [ ensAvatar, setEnsAvatar ] = useState<string>(recipient?.ensAvatar || "");
  const [ processing, setProcessing ] = useState<boolean>(false);
  const [ isSet, setIsSet ] = useState<boolean>(!!recipient);
  const universalResolverAddress = "0xce01f8eee7E479C928F8919abD53E553a36CeF67";
  const handleSetValue = async (v: string) => {
    setValue(v);
    const vClient = viemAdapter.publicClient.toViem({ chain: defineChain(1), client });
    setProcessing(true);
    if (v.length >= 5 && v.endsWith(".eth")) {
      const address = await getEnsAddress(vClient as any, { name: normalize(v), universalResolverAddress });
      if (address) {
        setValue(address);
        setEnsValue(v);
        setIsSet(true);
        const avatar = await getEnsAvatar(vClient as any, { name: v, universalResolverAddress });
        if (avatar && avatar.startsWith("https://")) {
          setEnsAvatar(avatar);
        }
        onRecipientSet?.({ address, ensName: v, ensAvatar: avatar || undefined });
      }
    } else if (isAddress(v, { strict: false })) {
      try {
        const ensName = await getEnsName(vClient as any, { address: checksumAddress(v), universalResolverAddress });
        let avatar: string | null = null;
        if (ensName) {
          setEnsValue(ensName);
          avatar = await getEnsAvatar(vClient as any, { name: ensName, universalResolverAddress });
          if (avatar && avatar.startsWith("https://")) {
            setEnsAvatar(avatar);
          }
        }
        onRecipientSet?.({
          address: checksumAddress(v),
          ensName: ensName || undefined,
          ensAvatar: avatar || undefined,
        });
      } catch (e) {
        console.error(e);
        onRecipientSet?.({
          address: checksumAddress(v),
        });
      }

      setIsSet(true);

    }

    setProcessing(false);
  };

  const handleReadClipboard = async () => {
    const v = await navigator.clipboard.readText();
    await handleSetValue(v);
  };

  const handleReset = () => {
    setValue("");
    setEnsValue("");
    setEnsAvatar("");
    setIsSet(false);
    setProcessing(false);
    onRecipientSet?.(null);
  };
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <div
        className={cn(
          "flex items-center justify-between gap-4 bg-foreground/10 rounded-lg px-2 py-2",
          { "bg-foreground/5": isSet },
        )}
      >
        {isSet ? (
          <div className="flex items-center text-sm h-9 pl-2 gap-2">
            {ensValue && ensAvatar && (
              <Avatar className="size-6 rounded-full">
                <AvatarImage src={ensAvatar} />
                <AvatarFallback>{ensValue.slice(0, 4)}</AvatarFallback>
              </Avatar>
            )}
            {ensValue ? (
              <span>
                {ensValue.toLowerCase()} ({shortenAddress(value, { format: "default" }).toLowerCase()})
              </span>
            ) : (
              <span className="text-xs font-mono">{value}</span>
            )}
          </div>
        ) : (
          <Input
            readOnly={isSet}
            type="text"
            value={value}
            onChange={e => handleSetValue(e.target.value)}
            placeholder="Wallet Address or ENS"
            className="border-0 focus-visible:border-none focus-visible:ring-0"
          />
        )}
        {isSet ? (
          <CircleCheckIcon className="size-8 text-success" />
        ) : processing ? (
          <LoaderCircleIcon className="size-8 animate-spin" />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleReadClipboard}
          >
            <ClipboardIcon className="size-8" />
          </Button>
        )}
      </div>
      <button
        className={cn(
          "text-muted-foreground text-xs font-mono text-right uppercase cursor-pointer",
          { "opacity-0 pointer-events-none": !isSet },
        )}
        onClick={handleReset}
      >
        Reset
      </button>
    </div>
  );
};
