'use client'

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";

// Disable static generation
export const dynamic = 'force-dynamic';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Dashboard />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}