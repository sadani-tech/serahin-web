"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

/**
 * Dropdown bertema Serahin — pengganti `<select>` native yang popup-nya
 * dirender OS/browser (biru khas Chrome) dan tidak bisa diwarnai lewat CSS
 * apa pun. Komponen ini menerima props identik dengan `<select>` native
 * (`name`, `defaultValue`, `value`, `onChange`, `children` berupa
 * `<option>`) sehingga jadi pengganti drop-in — dipakai lewat `Select` di
 * `components/ui.tsx`, bukan diimpor langsung di kebanyakan tempat.
 *
 * Kotak tertutup dan daftar pilihan sepenuhnya di-render pakai `<div>`/CSS
 * biasa (bisa diberi warna brand), sementara `<input type="hidden">`
 * membawa nilai terpilih supaya form action / server action yang sudah ada
 * (form submission tanpa JS tambahan) tetap berfungsi tanpa perubahan.
 *
 * Daftar pilihan di-render lewat React portal ke `document.body`, BUKAN
 * sebagai anak `position:absolute` di dalam trigger. Banyak container di
 * design system ini (`Card`, dll) memakai `overflow-hidden` untuk merapikan
 * sudut membulat — itu aman untuk popup native (di-render OS, di luar DOM),
 * tapi memotong popup berbasis CSS biasa. Portal menghindari masalah itu
 * sepenuhnya, di semua tempat sekaligus (v2.3.7, perbaikan pasca-rilis).
 */
export function Dropdown(props: ComponentProps<"select">) {
  const {
    name,
    defaultValue,
    value,
    onChange,
    disabled,
    className = "",
    children,
    id,
    "aria-label": ariaLabel,
  } = props;

  const options = Children.toArray(children).filter(isValidElement) as ReactElement<
    ComponentProps<"option">
  >[];

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string>(() =>
    defaultValue !== undefined ? String(defaultValue) : "",
  );
  const current = controlled ? String(value) : internal;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onViewportChange() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  function openList() {
    const idx = options.findIndex((o) => String(o.props.value ?? "") === current);
    setHighlight(idx >= 0 ? idx : 0);
    const el = triggerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < 260 && r.top > spaceBelow;
      setRect({ top: openUp ? r.top : r.bottom, left: r.left, width: r.width, openUp });
    }
    setOpen(true);
  }

  const selectedOption = options.find((o) => String(o.props.value ?? "") === current);

  function commit(v: string) {
    if (!controlled) setInternal(v);
    setOpen(false);
    onChange?.({ target: { value: v } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openList();
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = options[highlight];
      if (o && !o.props.disabled) commit(String(o.props.value ?? ""));
    }
  }

  const panel = open && rect
    ? createPortal(
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          data-dropdown-list
          style={{
            position: "fixed",
            top: rect.openUp ? undefined : rect.top + 4,
            bottom: rect.openUp ? window.innerHeight - rect.top + 4 : undefined,
            left: rect.left,
            width: rect.width,
          }}
          className="z-[200] max-h-64 min-w-max overflow-auto rounded-xl border border-sand-200 bg-white py-1 shadow-lg focus:outline-none"
        >
          {options.map((o, i) => {
            const v = String(o.props.value ?? "");
            const isSelected = v === current;
            const isHighlighted = i === highlight;
            return (
              <li
                key={v || i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => !o.props.disabled && commit(v)}
                className={`cursor-pointer whitespace-nowrap px-3.5 py-2 text-sm transition-colors ${
                  o.props.disabled
                    ? "cursor-not-allowed text-sand-300"
                    : isSelected
                      ? "bg-brand-50 font-bold text-brand-700"
                      : isHighlighted
                        ? "bg-sand-50 text-sand-900"
                        : "text-sand-800"
                }`}
              >
                {o.props.children}
              </li>
            );
          })}
        </ul>,
        document.body,
      )
    : null;

  return (
    <div className="relative">
      {name && (
        <input type="hidden" name={name} value={current} onChange={() => {}} />
      )}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex items-center justify-between gap-2 rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-left text-sm text-sand-900 transition hover:border-sand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className="truncate">{selectedOption?.props.children ?? "Pilih"}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-sand-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {panel}
    </div>
  );
}
