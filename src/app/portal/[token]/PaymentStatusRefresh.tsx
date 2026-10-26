"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PaymentStatusRefresh({ pending }: { pending: boolean }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const refreshInProgress = useRef(false);

  const refresh = useCallback(() => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    if (!isRefreshing) {
      if (refreshInProgress.current) {
        refreshInProgress.current = false;
        setLastChecked(new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }));
      }
      return;
    }
    refreshInProgress.current = true;
  }, [isRefreshing]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [pending, refresh]);

  return (
    <div className="flex flex-col gap-2 border-t border-sand-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs leading-5 text-sand-500" aria-live="polite">
        {isRefreshing
          ? "Memeriksa status pembayaran..."
          : pending
            ? "Status diperiksa otomatis setiap 15 detik. Pembaruan mungkin perlu beberapa saat."
            : lastChecked
              ? `Terakhir diperiksa pukul ${lastChecked}.`
              : "Perbarui status jika pembayaran baru saja dilakukan."}
      </p>
      <button
        type="button"
        onClick={refresh}
        disabled={isRefreshing}
        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-brand-300 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        <svg
          aria-hidden="true"
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7v5h-5M4 17v-5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2" />
        </svg>
        {isRefreshing ? "Memeriksa..." : "Perbarui status"}
      </button>
    </div>
  );
}
