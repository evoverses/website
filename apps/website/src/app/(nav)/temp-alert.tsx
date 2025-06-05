'use client';
import { cn } from "@/lib/utils";
import { RulerSquareIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { useEffect, useState } from "react";

const PardonOurDustAlert = () => {
  const [ visible, setVisible ] = useState<boolean>(true)

  useEffect(() => {
    setTimeout(() => {
      setVisible(false);
    }, 5_000);
  }, []);

  return  (
    <Alert className={cn("max-w-2xl absolute top-20 transition-all duration-300 ease-in-out fade-out", visible ? "opacity-100" : "opacity-0")}>
      <RulerSquareIcon className="h-4 w-4" />
      <AlertTitle>Pardon our dust!</AlertTitle>
      <AlertDescription>
        The EvoVerses website is currently being rebuilt. Want to help? Let us know in discord!
      </AlertDescription>
    </Alert>
  )
}

export default PardonOurDustAlert;
