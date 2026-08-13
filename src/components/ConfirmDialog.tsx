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
import { Button } from "@/components/ui";

// Pengganti window.confirm / window.alert dengan modal card UI yang konsisten.
// Pakai lewat hook `useConfirm()`:
//   const { confirm, alert } = useConfirm();
//   if (await confirm({ title, description })) { ... }
//   await alert({ title, description });

type DialogVariant = "danger" | "primary";

type DialogState = {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel: string | null; // null → mode alert (tanpa tombol batal)
  variant: DialogVariant;
};

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
};

type AlertOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  variant?: DialogVariant;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (opts: AlertOptions) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Hapus",
        cancelLabel: opts.cancelLabel ?? "Batal",
        variant: opts.variant ?? "danger",
      });
    });
  }, []);

  const alert = useCallback((opts: AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setDialog({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Mengerti",
        cancelLabel: null,
        variant: opts.variant ?? "primary",
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <DialogCard
          dialog={dialog}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback aman bila provider belum terpasang (mis. saat testing).
    return {
      confirm: async (o) => window.confirm(o.title),
      alert: async (o) => window.alert(o.title),
    };
  }
  return ctx;
}

function DialogCard({
  dialog,
  onConfirm,
  onCancel,
}: {
  dialog: DialogState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const isAlert = dialog.cancelLabel === null;

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              dialog.variant === "danger"
                ? "bg-rose-100 text-rose-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {dialog.variant === "danger" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-slate-900"
            >
              {dialog.title}
            </h2>
            {dialog.description && (
              <div className="mt-1 text-sm text-slate-600">
                {dialog.description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {!isAlert && (
            <Button variant="secondary" onClick={onCancel}>
              {dialog.cancelLabel}
            </Button>
          )}
          <Button
            ref={confirmRef}
            variant={dialog.variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {dialog.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
