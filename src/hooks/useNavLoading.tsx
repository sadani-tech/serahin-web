"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Overlay loading global untuk memberi umpan balik saat pindah tab / halaman,
// supaya aksi tidak terasa "diam" (FR-UX). Dipicu manual saat klik navigasi,
// lalu otomatis hilang ketika route baru selesai commit (pathname/query berubah).

type NavLoadingContextValue = {
  pending: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const NavLoadingContext = createContext<NavLoadingContextValue | null>(null);

const SAFETY_TIMEOUT_MS = 8000;

export function NavLoadingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopLoading = useCallback(() => {
    clearTimer();
    setPending(false);
  }, []);

  const startLoading = useCallback(() => {
    clearTimer();
    setPending(true);
    // Jaring pengaman: jika navigasi tidak mengubah route (mis. link ke halaman
    // yang sama), overlay tetap hilang setelah beberapa detik.
    timeoutRef.current = setTimeout(() => setPending(false), SAFETY_TIMEOUT_MS);
  }, []);

  // Route baru sudah commit → sembunyikan overlay.
  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  useEffect(() => () => clearTimer(), []);

  return (
    <NavLoadingContext.Provider value={{ pending, startLoading, stopLoading }}>
      {children}
      <LoadingOverlay show={pending} />
    </NavLoadingContext.Provider>
  );
}

export function useNavLoading(): NavLoadingContextValue {
  const ctx = useContext(NavLoadingContext);
  if (!ctx) {
    // Aman dipakai di luar provider (mis. saat testing) tanpa error.
    return { pending: false, startLoading: () => {}, stopLoading: () => {} };
  }
  return ctx;
}

function LoadingOverlay({ show }: { show: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!show}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px] transition-opacity duration-200 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl ring-1 ring-slate-200">
        <svg
          className="h-7 w-7 animate-spin text-slate-900"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm font-medium text-slate-600">Memuat…</span>
      </div>
    </div>
  );
}
