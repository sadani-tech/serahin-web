"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribeToBrowser = () => () => {};

/** A viewport-bound dialog for review and edit flows, including short mobile screens. */
export function WorkspaceDialog({ title, eyebrow, children, footer, onClose, wide = false }: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const titleId = useId();
  const mounted = useSyncExternalStore(subscribeToBrowser, () => true, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== panelRef.current) return;
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [mounted]);

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-sand-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[min(90dvh,850px)] sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"}`}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-sand-100 px-5 py-4 sm:px-7 sm:py-5">
          <div>{eyebrow && <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700">{eyebrow}</p>}<h2 id={titleId} className="mt-1 text-xl font-extrabold text-sand-900">{title}</h2></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup dialog" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sand-200 text-xl text-sand-600 hover:bg-sand-50">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">{children}</div>
        {footer && <div className="shrink-0 border-t border-sand-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">{footer}</div>}
      </div>
    </div>, document.body,
  );
}
