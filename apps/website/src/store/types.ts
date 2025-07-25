import type { PreferencesSlice } from "@/store/preferences";
import type { UseBoundStore } from "zustand/react";
import type { StoreApi } from "zustand/vanilla";

export type Slices = PreferencesSlice

export type Middlewares = [
  [ "zustand/devtools", never ],
  [ "zustand/persist", Slices ]
]

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSimpleSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (
      store.use as Record<string, unknown>
    )[k] = () => store((s) => s[k as keyof typeof s]);
  }
  return store;
};
