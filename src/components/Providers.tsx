"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Use state to avoid re-creating the client on every render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes cache
            refetchOnWindowFocus: false, // Prevent refetching on window focus
            refetchOnMount: false, // Prevents refetching when component mounts if data is fresh
            refetchOnReconnect: false, // Prevents refetching when network reconnects
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
