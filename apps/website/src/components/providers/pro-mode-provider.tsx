"use client";

import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from "react";

const preferenceKey = "evoverses:pro-mode";
const ProModeContext = createContext({
  proMode: false,
  ready: false,
  setProMode: (() => {}) as (enabled: boolean) => void,
});

// A browser display preference only. Authentication and transaction checks stay independent.
export function ProModeProvider({ children }: PropsWithChildren) {
  const [proMode, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setEnabled(localStorage.getItem(preferenceKey) === "on"); } catch { /* Keep the in-memory default. */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === preferenceKey || event.key === null) {
        setEnabled(event.key !== null && event.newValue === "on");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setProMode = useCallback((enabled: boolean) => {
    setEnabled(enabled);
    try { localStorage.setItem(preferenceKey, enabled ? "on" : "off"); } catch { /* Still works without storage. */ }
  }, []);
  return <ProModeContext.Provider value={{ proMode, ready, setProMode }}>{children}</ProModeContext.Provider>;
}

export const useProMode = () => useContext(ProModeContext);
export function ProOnly({ children }: PropsWithChildren) {
  return useProMode().proMode ? children : null;
}
