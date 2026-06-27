"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

// Pages within /app that are always accessible regardless of connection status
const ALWAYS_ACCESSIBLE = ["/app/integrations", "/app/settings"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip the gate for integrations and settings
    if (ALWAYS_ACCESSIBLE.some((p) => pathname.startsWith(p))) {
      setReady(true);
      return;
    }

    fetch("/api/sources")
      .then((r) => r.json())
      .then(({ sources = [] }: { sources: { status: string }[] }) => {
        const hasConnected = sources.some((s) => s.status === "connected");
        if (!hasConnected) {
          router.replace("/app/integrations");
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true)); // on error, allow through rather than block
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
