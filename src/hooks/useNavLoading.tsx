"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Overlay loading global untuk memberi umpan balik saat pindah halaman / menekan
// tombol aksi yang hit API, supaya tidak terasa "diam".
//
// Dua sumber loading yang digabung:
//   1. Navigasi   — dideteksi otomatis dari klik <a> internal (semua <Link>),
//      lalu hilang saat route baru commit (pathname/searchParams berubah).
//   2. Aksi/API   — dihitung dengan counter via startLoading()/stopLoading()
//      (dipakai useOverlayWhilePending / useApiTransition / SubmitButton).
//
// Overlay tampil bila salah satu aktif. Counter (bukan boolean) supaya beberapa
// aksi bersamaan tidak saling mematikan overlay.

type NavLoadingContextValue = {
  pending: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const NavLoadingContext = createContext<NavLoadingContextValue | null>(null);

const NAV_SAFETY_TIMEOUT_MS = 8000;

export function NavLoadingProvider({ children }: { children: ReactNode }) {
  const [navPending, setNavPending] = useState(false);
  const [actionCount, setActionCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => setActionCount((c) => c + 1), []);
  const stopLoading = useCallback(
    () => setActionCount((c) => Math.max(0, c - 1)),
    [],
  );

  const clearNavTimer = () => {
    if (navTimer.current) {
      clearTimeout(navTimer.current);
      navTimer.current = null;
    }
  };

  // Deteksi klik navigasi internal (semua <Link>/<a> same-origin) secara global,
  // sehingga setiap perpindahan halaman menampilkan overlay tanpa perlu wiring
  // di tiap link.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // eksternal
      // Halaman yang sama (atau hanya hash) → tidak ada loading.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      setNavPending(true);
      clearNavTimer();
      navTimer.current = setTimeout(
        () => setNavPending(false),
        NAV_SAFETY_TIMEOUT_MS,
      );
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Route baru sudah commit → hentikan loading navigasi.
  useEffect(() => {
    setNavPending(false);
    clearNavTimer();
  }, [pathname, searchParams]);

  useEffect(() => () => clearNavTimer(), []);

  const pending = navPending || actionCount > 0;

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

/**
 * Tampilkan overlay loading global selama `pending` bernilai true.
 * Dipakai oleh form yang sudah punya state pending sendiri (useActionState /
 * useTransition). Increment saat pending, decrement saat selesai/unmount.
 */
export function useOverlayWhilePending(pending: boolean) {
  const { startLoading, stopLoading } = useNavLoading();
  useEffect(() => {
    if (!pending) return;
    startLoading();
    return () => stopLoading();
  }, [pending, startLoading, stopLoading]);
}

/**
 * Bungkus aksi onClick yang memanggil server action / API supaya menampilkan
 * overlay loading global + memberi flag `pending` untuk menonaktifkan tombol.
 *
 *   const { pending, run } = useApiTransition();
 *   <button disabled={pending} onClick={() => run(() => someAction(id))}>…
 *
 * Overlay dikendalikan lewat efek pada `pending` (bukan di dalam transition)
 * agar update-nya urgent dan overlay benar-benar tampil.
 */
export function useApiTransition() {
  const [pending, startTransition] = useTransition();
  useOverlayWhilePending(pending);

  const run = useCallback((fn: () => unknown | Promise<unknown>) => {
    startTransition(async () => {
      await fn();
    });
  }, []);

  return { pending, run };
}

function LoadingOverlay({ show }: { show: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!show}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-sand-900/20 backdrop-blur-[1px] transition-opacity duration-200 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl ring-1 ring-sand-200">
        <svg
          className="h-7 w-7 animate-spin text-brand-600"
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
        <span className="text-sm font-medium text-sand-600">Memuat…</span>
      </div>
    </div>
  );
}
