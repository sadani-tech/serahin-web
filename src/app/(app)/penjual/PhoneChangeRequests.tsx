"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";
import { decideSellerPhoneChange } from "../management-actions";

export type PhoneChangeRequest = { id: string; oldPhone: string | null; newPhone: string; reason: string; createdAt: string; seller: { businessName: string; contactPhone: string | null } };

export function PhoneChangeRequests({ requests }: { requests: PhoneChangeRequest[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { confirm, prompt } = useConfirm();
  const router = useRouter();
  async function decide(request: PhoneChangeRequest, decision: "approve" | "reject") {
    const reason = decision === "reject" ? await prompt({ title: `Tolak permintaan ${request.seller.businessName}`, description: <div className="space-y-2 text-left text-sm"><p>{request.oldPhone || "Belum tercatat"} → <b>{request.newPhone}</b></p><p className="rounded-xl bg-sand-50 p-3">Alasan Seller: {request.reason}</p></div>, label: "Alasan penolakan untuk Seller", confirmLabel: "Tolak", variant: "danger" }) : undefined;
    if (decision === "reject" && !reason) return;
    if (decision === "approve" && !await confirm({ title: `Setujui nomor baru ${request.seller.businessName}?`, description: <div className="space-y-2 text-left text-sm"><p>{request.oldPhone || "Belum tercatat"} → <b>{request.newPhone}</b></p><p className="rounded-xl bg-sand-50 p-3">Alasan Seller: {request.reason}</p><p>Kontak toko langsung berubah setelah disetujui.</p></div>, confirmLabel: "Setujui", variant: "primary" })) return;
    setBusy(request.id); setError("");
    const result = await decideSellerPhoneChange(request.id, decision, reason ?? undefined);
    setBusy(null);
    if (result.error) setError(result.error); else router.refresh();
  }
  return <section className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-extrabold text-sand-900">Permintaan ganti nomor</h2><p className="mt-1 text-sm text-sand-500">Tinjau alasan sebelum mengubah kontak Seller.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{requests.length} menunggu</span></div>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}{requests.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{requests.map((request) => <article key={request.id} className="rounded-xl border border-sand-200 bg-sand-50 p-4"><h3 className="font-extrabold text-sand-900">{request.seller.businessName}</h3><p className="mt-2 break-all text-sm text-sand-600">{request.oldPhone || "—"} → <b className="text-brand-700">{request.newPhone}</b></p><p className="mt-2 rounded-lg bg-white p-3 text-sm text-sand-700">{request.reason}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy === request.id} onClick={() => decide(request, "approve")} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white disabled:opacity-50">Setujui</button><button disabled={busy === request.id} onClick={() => decide(request, "reject")} className="min-h-11 flex-1 rounded-xl border border-rose-300 px-4 text-sm font-bold text-rose-700 disabled:opacity-50">Tolak</button></div></article>)}</div> : <p className="mt-4 text-sm text-sand-500">Tidak ada permintaan yang menunggu.</p>}</section>;
}
