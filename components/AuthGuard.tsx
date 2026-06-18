"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureDemoData, isLoggedIn } from "@/lib/storage";
import { LoadingSkeleton } from "./LoadingSkeleton";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      setChecking(false);
      return;
    }

    ensureDemoData();
    setAuthorized(true);
    setChecking(false);
  }, [router]);

  if (checking || !authorized) {
    return <LoadingSkeleton label="Checking secure session" />;
  }

  return <>{children}</>;
}
