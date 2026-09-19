"use client";
import { useState } from "react";

export function DestructiveActionForm({ action, target, label = "Arsipkan / hapus", compact = false }: { action: (formData: FormData) => void | Promise<void>; target: string; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="min-h-10 rounded-xl border border-rose-300 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50">{label}</button>;
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Tindakan ini dapat menghapus atau mengarsipkan data. Lanjutkan?")) event.preventDefault(); }} className={`rounded-xl border border-rose-200 bg-rose-50 p-3 ${compact ? "space-y-2" : "grid gap-3 sm:grid-cols-2"}`}>
    <label className="text-xs font-bold text-rose-900">Alasan<input name="reason" required minLength={5} className="mt-1 min-h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal" placeholder="Jelaskan alasan tindakan"/></label>
    <label className="text-xs font-bold text-rose-900">Ketik <span className="font-mono">{target}</span><input name="confirmation" required className="mt-1 min-h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal"/></label>
    <div className="flex gap-2 sm:col-span-2"><button className="min-h-10 rounded-lg bg-rose-700 px-3 text-sm font-bold text-white">Konfirmasi</button><button type="button" onClick={() => setOpen(false)} className="min-h-10 px-3 text-sm font-bold text-sand-600">Batal</button></div>
  </form>;
}
