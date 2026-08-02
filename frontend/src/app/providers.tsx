"use client";

import { MemoryProvider } from "@/lib/memory-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <MemoryProvider>{children}</MemoryProvider>;
}
