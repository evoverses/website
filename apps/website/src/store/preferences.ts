import type { StateCreator } from "zustand/vanilla";
import { type Middlewares, Slices } from "./types";

export type ViewMode = "collector" | "pro";

export const currencyDisplayValues = [ "crypto", "usd" ] as const;
export type CurrencyDisplay = typeof currencyDisplayValues[number];

export const volumeLevels = [ "low", "high", "off" ] as const;
export type VolumeLevel = typeof volumeLevels[number];

export const layouts = [ "grid", "compact-grid", "table", "compact-table", "mosaic" ] as const;
export type Layout = typeof layouts[number];

export interface PreferencesSlice {
  assetHeaderCollapsed: boolean;
  toggleAssetHeaderCollapsed: () => void;
  appViewMode: ViewMode;
  setAppViewMode: (mode: ViewMode) => void;
  appCurrencyDisplay: CurrencyDisplay;
  setAppCurrencyDisplay: (currency: CurrencyDisplay) => void;
  layout: Layout;
  setLayout: (layout: Layout) => void;
  appVolume: VolumeLevel;
  toggleAppVolume: () => void;
  hideBalances: boolean;
  toggleHideBalances: () => void;
}

export const createPreferencesSlice: StateCreator<Slices, Middlewares, [], PreferencesSlice> = (set) => (
  {
    assetHeaderCollapsed: false,
    toggleAssetHeaderCollapsed: () => set(state => (
      { assetHeaderCollapsed: !state.assetHeaderCollapsed }
    )),
    appViewMode: "collector",
    setAppViewMode: appViewMode => set({ appViewMode }),
    appCurrencyDisplay: "crypto",
    setAppCurrencyDisplay: appCurrencyDisplay => set({ appCurrencyDisplay }),
    layout: "grid",
    setLayout: layout => set({ layout }),
    appVolume: "low",
    toggleAppVolume: () => set(state => (
      {
        appVolume: state.appVolume === "off" ? "low" : state.appVolume === "low" ? "high" : "off",
      }
    )),
    hideBalances: false,
    toggleHideBalances: () => set(state => (
      { hideBalances: !state.hideBalances }
    )),
  }
);
