import { QueryProvider } from "@/components/providers/query-provider";
import ThemeProvider from "@/components/providers/theme-provider";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { PropsWithChildren } from "react";
import { ThirdwebProvider } from "thirdweb/react";

export const GlobalProvider = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <ThirdwebProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThirdwebProvider>
      </QueryProvider>
    </ThemeProvider>
  );
};
