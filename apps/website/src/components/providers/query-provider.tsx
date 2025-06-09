"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type PropsWithChildren, useState } from "react";

const client = new QueryClient();
const QueryProvider = ({ children }: PropsWithChildren) => {
  const [ queryClient ] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 min
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  }));

  const [ persister ] = useState(() =>
    createAsyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
    }),
  );

  if (typeof window === "undefined") {
    // On server, just use QueryClientProvider without persistence
    return (
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={null}>
          {children}
        </HydrationBoundary>
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <HydrationBoundary state={null}>
        {children}
      </HydrationBoundary>
    </PersistQueryClientProvider>
  );
};
QueryProvider.displayName = "QueryProvider";

const QueryProvider2 = ({ children }: PropsWithChildren) => {
  return <QueryClientProvider client={client}>
    {children}
  </QueryClientProvider>;
};
export { QueryProvider, QueryProvider2 };
