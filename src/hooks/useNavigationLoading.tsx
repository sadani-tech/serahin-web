"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return isLoading;
}

export function NavigationProgress() {
  const isLoading = useNavigationLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-slate-900 animate-progress">
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
