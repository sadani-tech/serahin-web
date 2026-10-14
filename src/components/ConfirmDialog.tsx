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

// Pengganti window.confirm / window.alert / window.prompt dengan modal card UI yang konsisten.
// Pakai lewat hook `useConfirm()`:
//   const { confirm, alert, prompt } = useConfirm();
//   if (await confirm({ title, description })) { ... }
//   await alert({ title, description });
//   const alasan = await prompt({ title, label: "Alasan" }); // null bila dibatalkan/kosong & required

type DialogVariant = "danger" | "primary";

type InputConfig = {
  label?: string;
  placeholder?: string;
  required: boolean;
  multiline: boolean;
  defaultValue: string;
};

type DialogState = {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel: string | null; // null → mode alert (tanpa tombol batal)
  variant: DialogVariant;
  input?: InputConfig;
  cancelValue: false | null; // nilai yang di-resolve saat batal/Escape/klik luar
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

type PromptOptions = {
  title: string;
  description?: ReactNode;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  multiline?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (opts: AlertOptions) => Promise<void>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolverRef = useRef<((result: boolean | string | null) => void) | null>(null);

  const settle = useCallback((result: boolean | string | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve as (result: boolean | string | null) => void;
      setDialog({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Hapus",
        cancelLabel: opts.cancelLabel ?? "Batal",
        variant: opts.variant ?? "danger",
        cancelValue: false,
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
        cancelValue: false,
      });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve as (result: boolean | string | null) => void;
      setDialog({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Kirim",
        cancelLabel: opts.cancelLabel ?? "Batal",
        variant: opts.variant ?? "primary",
        cancelValue: null,
        input: {
          label: opts.label,
          placeholder: opts.placeholder,
          required: opts.required ?? true,
          multiline: opts.multiline ?? true,
          defaultValue: opts.defaultValue ?? "",
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {dialog && (
        <DialogCard
          dialog={dialog}
          onConfirm={(value) => settle(dialog.input ? (value ?? "").trim() : true)}
          onCancel={() => settle(dialog.cancelValue)}
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
      prompt: async (o) => window.prompt(o.title, o.defaultValue ?? ""),
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
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [value, setValue] = useState(dialog.input?.defaultValue ?? "");
  const isAlert = dialog.cancelLabel === null;
  const confirmDisabled = Boolean(dialog.input?.required) && value.trim() === "";

  useEffect(() => {
    (dialog.input ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel, dialog.input]);

  function submit() {
    if (confirmDisabled) return;
    onConfirm(value);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-sand-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-sand-200">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              dialog.variant === "danger"
                ? "bg-rose-100 text-rose-600"
                : "bg-sand-100 text-sand-600"
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
              className="text-base font-semibold text-sand-900"
            >
              {dialog.title}
            </h2>
            {dialog.description && (
              <div className="mt-1 text-sm text-sand-600">
                {dialog.description}
              </div>
            )}
            {dialog.input && (
              <label className="mt-3 block text-xs font-bold text-sand-700">
                {dialog.input.label}
                {dialog.input.multiline ? (
                  <textarea
                    ref={inputRef}
                    rows={3}
                    value={value}
                    placeholder={dialog.input.placeholder}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                    }}
                    className="mt-1 block w-full rounded-lg border border-sand-300 px-3 py-2 text-sm font-normal text-sand-900"
                  />
                ) : (
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    placeholder={dialog.input.placeholder}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    className="mt-1 block min-h-10 w-full rounded-lg border border-sand-300 px-3 text-sm font-normal text-sand-900"
                  />
                )}
              </label>
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
            ref={dialog.input ? undefined : confirmRef}
            variant={dialog.variant === "danger" ? "danger" : "primary"}
            onClick={submit}
            disabled={confirmDisabled}
          >
            {dialog.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
