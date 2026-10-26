"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "warning" | "info";

type ToastOptions = {
  title?: string;
  duration?: number;
};

type ToastItem = ToastOptions & {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  show: (tone: ToastTone, message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const toneStyles: Record<ToastTone, { bar: string; icon: string; label: string }> = {
  success: {
    bar: "bg-brand-500",
    icon: "bg-brand-100 text-brand-700",
    label: "Berhasil",
  },
  error: {
    bar: "bg-rose-500",
    icon: "bg-rose-100 text-rose-700",
    label: "Terjadi kesalahan",
  },
  warning: {
    bar: "bg-sun-400",
    icon: "bg-sun-100 text-sun-800",
    label: "Perhatian",
  },
  info: {
    bar: "bg-sky-500",
    icon: "bg-sky-100 text-sky-700",
    label: "Informasi",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((tone: ToastTone, message: string, options: ToastOptions = {}) => {
    const normalized = message.trim();
    if (!normalized) return;
    const id = ++nextId.current;
    setItems((current) => [
      ...current.filter((item) => !(item.tone === tone && item.message === normalized)),
      { id, tone, message: normalized, ...options },
    ].slice(-4));
  }, []);

  const api = useMemo<ToastApi>(() => ({
    show,
    success: (message, options) => show("success", message, options),
    error: (message, options) => show("error", message, options),
    warning: (message, options) => show("warning", message, options),
    info: (message, options) => show("info", message, options),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-3 top-3 z-[150] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-full sm:max-w-sm"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const style = toneStyles[item.tone];

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, item.duration ?? (item.tone === "error" ? 6500 : 4500));
    return () => window.clearTimeout(timer);
  }, [item.duration, item.tone, onDismiss]);

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-sand-200 bg-white p-4 pl-5 shadow-xl"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
          <ToastIcon tone={item.tone} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-sand-900">{item.title ?? style.label}</p>
          <p className="mt-0.5 text-sm leading-5 text-sand-600">{item.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sand-400 transition hover:bg-sand-100 hover:text-sand-700"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>;
  if (tone === "error") return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m7.5 7.5 5 5m0-5-5 5" /></svg>;
  if (tone === "warning") return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="M10 3 2.5 16h15L10 3Z" /><path d="M10 7v4m0 2.5v.1" /></svg>;
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="M10 9v5m0-8v.1" /></svg>;
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return context;
}

export function ToastFeedback({
  error,
  success,
  warning,
  info,
}: {
  error?: string | null;
  success?: string | null;
  warning?: string | null;
  info?: string | null;
}) {
  const toast = useToast();
  const lastFeedback = useRef("");

  useEffect(() => {
    const feedback = error
      ? { tone: "error" as const, message: error }
      : warning
        ? { tone: "warning" as const, message: warning }
        : success
          ? { tone: "success" as const, message: success }
          : info
            ? { tone: "info" as const, message: info }
            : null;
    if (!feedback) {
      lastFeedback.current = "";
      return;
    }
    const key = `${feedback.tone}:${feedback.message}`;
    if (key === lastFeedback.current) return;
    lastFeedback.current = key;
    toast.show(feedback.tone, feedback.message);
  }, [error, info, success, toast, warning]);

  return null;
}
