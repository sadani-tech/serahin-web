"use client";

import { useEffect, useRef, useState } from "react";
import { Dropdown } from "@/components/Dropdown";

type Mode = "date" | "datetime";

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseValue(v: string | undefined | null): Parts | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: m[4] ? Number(m[4]) : 0,
    minute: m[5] ? Number(m[5]) : 0,
  };
}

function formatValue(p: Parts, mode: Mode): string {
  const base = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  return mode === "datetime" ? `${base}T${pad(p.hour)}:${pad(p.minute)}` : base;
}

function formatDisplay(p: Parts, mode: Mode): string {
  const tanggal = `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
  return mode === "datetime" ? `${tanggal}, ${pad(p.hour)}:${pad(p.minute)}` : tanggal;
}

function today(): Parts {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: 0, minute: 0 };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Kalender bertema Serahin — pengganti popup native `input[type=date]`/
 * `datetime-local` (dirender OS/browser, selalu tampil biru khas Chrome
 * dan tidak bisa diberi warna brand lewat CSS). Menyimpan nilai di
 * `<input type="hidden">` dengan format identik dengan native
 * (`YYYY-MM-DD` atau `YYYY-MM-DDTHH:mm`) agar seluruh kode di sisi
 * pemanggil (server action, `withWibOffset`, dll) tidak perlu berubah.
 */
export function DatePicker({
  name,
  defaultValue,
  className = "",
  disabled,
  required,
  mode = "date",
  id,
  "aria-label": ariaLabel,
}: {
  name?: string;
  defaultValue?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  mode?: Mode;
  id?: string;
  "aria-label"?: string;
}) {
  const initial = parseValue(defaultValue);
  const [selected, setSelected] = useState<Parts | null>(initial);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const base = initial ?? today();
    return { year: base.year, month: base.month };
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const value = selected ? formatValue(selected, mode) : "";

  function pickDay(day: number) {
    setSelected((current) => ({
      year: view.year,
      month: view.month,
      day,
      hour: current?.hour ?? 0,
      minute: current?.minute ?? 0,
    }));
    if (mode === "date") setOpen(false);
  }

  function setHour(h: string) {
    setSelected((current) => ({
      year: current?.year ?? view.year,
      month: current?.month ?? view.month,
      day: current?.day ?? today().day,
      hour: Number(h),
      minute: current?.minute ?? 0,
    }));
  }
  function setMinute(m: string) {
    setSelected((current) => ({
      year: current?.year ?? view.year,
      month: current?.month ?? view.month,
      day: current?.day ?? today().day,
      hour: current?.hour ?? 0,
      minute: Number(m),
    }));
  }

  function goToday() {
    const t = today();
    setView({ year: t.year, month: t.month });
    setSelected((current) => ({ ...t, hour: current?.hour ?? 0, minute: current?.minute ?? 0 }));
    if (mode === "date") setOpen(false);
  }

  function clear() {
    setSelected(null);
    setOpen(false);
  }

  // Grid 6 minggu x 7 hari, termasuk tanggal ekor bulan sebelum/sesudah.
  const firstWeekday = new Date(view.year, view.month - 1, 1).getDay();
  const totalDays = daysInMonth(view.year, view.month);
  const prevMonthDays = daysInMonth(view.year, view.month === 1 ? 12 : view.month - 1);
  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, inMonth: false });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0 || cells.length < 42) cells.push({ day: cells.length - firstWeekday - totalDays + 1, inMonth: false });

  function shiftMonth(delta: number) {
    setView((v) => {
      let month = v.month + delta;
      let year = v.year;
      if (month < 1) { month = 12; year -= 1; }
      if (month > 12) { month = 1; year += 1; }
      return { year, month };
    });
  }

  const t = today();

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={value} required={required} onChange={() => {}} />}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-sand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className={selected ? "text-sand-900" : "text-sand-400"}>
          {selected ? formatDisplay(selected, mode) : mode === "datetime" ? "Pilih tanggal & jam" : "Pilih tanggal"}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-sand-500" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div role="dialog" aria-label="Pilih tanggal" className="absolute z-30 mt-1 w-72 rounded-xl border border-sand-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya" className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-500 hover:bg-sand-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <p className="text-sm font-extrabold text-sand-900">{MONTHS[view.month - 1]} {view.year}</p>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya" className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-500 hover:bg-sand-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-bold uppercase text-sand-400">
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              const isSelected = !!selected && c.inMonth && selected.year === view.year && selected.month === view.month && selected.day === c.day;
              const isToday = c.inMonth && t.year === view.year && t.month === view.month && t.day === c.day;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!c.inMonth}
                  onClick={() => pickDay(c.day)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                    !c.inMonth
                      ? "cursor-default text-transparent"
                      : isSelected
                        ? "bg-brand-600 text-white shadow-brand"
                        : isToday
                          ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-300"
                          : "text-sand-700 hover:bg-sand-100"
                  }`}
                >
                  {c.inMonth ? c.day : "·"}
                </button>
              );
            })}
          </div>

          {mode === "datetime" && (
            <div className="mt-3 flex items-center gap-2 border-t border-sand-100 pt-3">
              <span className="text-xs font-bold text-sand-600">Jam</span>
              <Dropdown
                value={pad(selected?.hour ?? 0)}
                onChange={(e) => setHour(e.target.value)}
                aria-label="Jam"
                className="!py-1.5 !px-2.5 text-xs"
              >
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={pad(h)}>{pad(h)}</option>)}
              </Dropdown>
              <span className="text-xs font-bold text-sand-400">:</span>
              <Dropdown
                value={pad(selected?.minute ?? 0)}
                onChange={(e) => setMinute(e.target.value)}
                aria-label="Menit"
                className="!py-1.5 !px-2.5 text-xs"
              >
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={pad(m)}>{pad(m)}</option>)}
              </Dropdown>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-sand-100 pt-3 text-xs font-bold">
            <button type="button" onClick={clear} className="text-sand-500 hover:text-rose-700">Hapus</button>
            <button type="button" onClick={goToday} className="text-brand-700 hover:underline">Hari ini</button>
            {mode === "datetime" && (
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">Selesai</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
