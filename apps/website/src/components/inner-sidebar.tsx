"use client";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronsLeftIcon, FilterIcon } from "lucide-react";
import { type ComponentProps, createContext, type PropsWithChildren, useContext, useState } from "react";

type InnerSidebarContextType = {
  open: boolean,
  setOpen: (v: boolean) => void
  toggle: () => void
}

const InnerSidebarContext = createContext<InnerSidebarContextType>({
  open: true,
  setOpen: () => null,
  toggle: () => null,
});

const useInnerSidebar = () => {
  const context = useContext(InnerSidebarContext);
  if (!context) {
    throw new Error("useInnerSidebar must be used within a <InnerSidebarProvider />");
  }
  return context;
};

const InnerSidebarProvider = ({ children }: Readonly<PropsWithChildren>) => {
  const [ open, setOpen ] = useState<boolean>(true);
  const ctx = { open, setOpen: (open: boolean) => setOpen(open), toggle: () => setOpen(!open) };
  return (
    <InnerSidebarContext.Provider value={ctx}>
      {children}
    </InnerSidebarContext.Provider>
  );
};

const InnerSidebar = ({ className, children, ...props }: ComponentProps<"div">) => {
  const { open } = useInnerSidebar();
  return (
    <div
      data-slot="inner-sidebar"
      data-inner-sidebar-state={open ? "open" : "closed"}
      className={cn("hidden @6xl:data-[inner-sidebar-state=open]:block", className)}
      {...props}
    >
      {children}
    </div>
  );
};

InnerSidebar.displayName = "InnerSidebar";

const InnerSidebarTrigger = ({
  className,
  onClick,
  children,
  ...props
}: ComponentProps<typeof Button>) => {
  const { open, toggle } = useInnerSidebar();
  return (
    <Button
      onClick={e => {
        toggle();
        onClick?.(e);
      }}
      className={cn("size-8 @max-6xl:hidden", className)}
      {...props}
    >
      {children ?? (open ? <ChevronsLeftIcon /> : <FilterIcon />)}
    </Button>

  );
};
export { InnerSidebarProvider, InnerSidebar, InnerSidebarTrigger };
