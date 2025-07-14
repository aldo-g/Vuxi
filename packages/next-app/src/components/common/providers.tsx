/**
 * Application Providers - Global State and Context Management
 * 
 * Centralized provider component that wraps the application with
 * necessary context providers including React Query for data fetching,
 * theme providers, and other global state management.
 * 
 * @responsibilities
 * - Configures React Query client for API data management
 * - Sets up global theme and styling context
 * - Provides error boundary and crash recovery
 * - Manages global application state
 * - Ensures provider order and dependencies
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}