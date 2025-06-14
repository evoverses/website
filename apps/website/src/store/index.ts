import { createPreferencesSlice } from "@/store/preferences";
import { createSimpleSelectors, type Middlewares, type Slices } from "@/store/types";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export const useBoundStore = create<Slices>()(
  devtools(
    persist(
      (...a) => (
        {
          // @ts-expect-error so stupid...
          ...createPreferencesSlice(...a),
        }
      ),
      {
        name: "evoverses-storage",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);

export const useBoundedStore = createSimpleSelectors(useBoundStore);
