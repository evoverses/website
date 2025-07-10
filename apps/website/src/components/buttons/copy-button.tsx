import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { FilesIcon } from "lucide-react";
import { type ComponentProps, type MouseEvent, useState } from "react";
import { toast } from "@workspace/ui/components/sonner";

const CopyButton = ({ data, onClick, className, ...props }: ComponentProps<typeof Button> & { data?: string }) => {
  const [ copied, setCopied ] = useState(false);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    if (data && !copied) {
      try {
        await navigator.clipboard.writeText(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
      } catch (e) {
        console.error("Failed to copy to clipboard:", e);
      }
    }
    onClick?.(e);
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className={cn("cursor-pointer relative", className)}
          {...props}
        >
          <div className="absolute inset-0 size-5" />
          <FilesIcon className={cn("size-5 transition-opacity duration-200 ease-linear", { "opacity-0": copied })} />
          <CheckIcon
            className={cn(
              "size-5 absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 text-success opacity-0 transition-opacity duration-200 ease-linear",
              { "opacity-100": copied },
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Copied!" : "Copy to clipboard"}
      </TooltipContent>
    </Tooltip>
  );
};
CopyButton.displayName = "CopyButton";

export { CopyButton };
