"use client";

import { useActionState, useState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { requestPhoneChange } from "./actions";
import { WorkspaceDialog } from "@/components/ui/WorkspaceDialog";

type PhoneRequest = { id: string; newPhone: string; status: string; decisionReason: string | null; createdAt: string };

export function PhoneChangeForm({ currentPhone, requests }: { currentPhone: string | null; requests: PhoneRequest[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestPhoneChange, undefined);
  const pendingRequest = requests.find((item) => item.status === "PENDING");
  return <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-sand-900">Nomor WhatsApp toko</h2><p className="mt-1 text-sm text-sand-500">Perubahan nomor harus disetujui owner agar kontak toko tetap aman.</p></div><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">Persetujuan owner</span></div>
    <div className="mt-4 rounded-xl border border-sand-200 bg-sand-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Nomor saat ini</p><p className="mt-1 break-all text-lg font-extrabold text-sand-900">{currentPhone || "Belum tercatat"}</p></div>
    {pendingRequest ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Menunggu owner</strong><p className="mt-1">Permintaan mengganti ke {pendingRequest.newPhone} sedang ditinjau.</p></div> : <button type="button" onClick={() => setOpen((value) => !value)} className="mt-4 min-h-11 w-full rounded-xl border border-brand-300 px-4 text-sm font-bold text-brand-700 sm:w-auto">{open ? "Tutup formulir" : "Ajukan ganti nomor"}</button>}
    {open && !pendingRequest && <WorkspaceDialog title="Ajukan ganti nomor" eyebrow="Persetujuan owner" onClose={() => setOpen(false)}><p className="mb-5 rounded-xl bg-sand-50 p-4 text-sm text-sand-600">Nomor saat ini: <strong className="text-sand-900">{currentPhone || "Belum tercatat"}</strong>. Nomor baru hanya berlaku setelah owner menyetujui pengajuan.</p><form action={action} className="space-y-4"><label className="block text-sm font-bold text-sand-700">Nomor baru<input name="newPhone" required inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3"/></label><label className="block text-sm font-bold text-sand-700">Alasan perubahan<textarea name="reason" required minLength={10} maxLength={1000} rows={3} placeholder="Jelaskan alasan mengganti nomor untuk owner" className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2"/></label><ToastFeedback error={state?.error} success={state?.success}/><div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-sand-300 px-5 text-sm font-bold">Batal</button><button disabled={pending} className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Mengirim..." : "Kirim permintaan"}</button></div></form></WorkspaceDialog>}
    {requests.some((item) => item.status !== "PENDING") && <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-brand-700">Riwayat permintaan</summary><ul className="mt-3 space-y-2">{requests.filter((item) => item.status !== "PENDING").map((item) => <li key={item.id} className="rounded-xl bg-sand-50 p-3"><b>{item.newPhone}</b> · {item.status === "APPROVED" ? "Disetujui" : "Ditolak"}{item.decisionReason && <p className="text-sand-600">Alasan: {item.decisionReason}</p>}</li>)}</ul></details>}
  </section>;
}
