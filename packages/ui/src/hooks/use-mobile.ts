import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768 as const;

export const useIsMobile = (px?: number) => {
  const [ isMobile, setIsMobile ] = useState<boolean | undefined>(undefined);
  const breakpoint = px ?? MOBILE_BREAKPOINT;

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < breakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
};
