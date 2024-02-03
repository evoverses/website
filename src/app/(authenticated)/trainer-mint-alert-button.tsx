"use client";
import { Button } from "@/components/ui/button";
import {
  SmartDrawer,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger,
} from "@/components/ui/smart-drawer";
import { InfoCircledIcon } from "@radix-ui/react-icons";

const TrainerMintSmartDrawer = () => {

  return (
    <SmartDrawer>
      <SmartDrawerTrigger asChild>
        <Button
          variant="info"
          className="absolute right-0 translate-y-1/2 rounded-l-full rounded-r-none flex content-center"
        >
          <InfoCircledIcon className="h-6 w-6 mr-2" />
          <span className="font-black">Trainers are minting soon!</span>
          <div className="w-full animation-pulse absolute right-0 translate-y-1/2 rounded-l-full rounded-r-noneh h-10 -z-[1]" />
        </Button>
      </SmartDrawerTrigger>
      <SmartDrawerContent>
        <SmartDrawerHeader>
          <SmartDrawerTitle>Trainer Mint Coming Soon!</SmartDrawerTitle>
          <SmartDrawerDescription>
            More information is on the way. The first round of whitelist spots will be given out to Gen 0 Evo holders,
            so make sure you aren&apos;t caught empty-handed!
          </SmartDrawerDescription>
        </SmartDrawerHeader>
        <SmartDrawerFooter>
          <SmartDrawerTrigger asChild>
            <Button>
              <span className="font-bold">Got It!</span>
            </Button>
          </SmartDrawerTrigger>
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};
TrainerMintSmartDrawer.displayName = "TrainerMintSmartDrawer";

export { TrainerMintSmartDrawer };
