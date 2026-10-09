import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatTanggal } from "@/lib/format";
import { Status } from "../page";

export const dynamic = "force-dynamic";

type Recipient = {
  id: string;
  recipientName: string;
  recipientEmail: string;
  status: "PENDING" | "SENDING" | "SENT" | "FAILED" | "SKIPPED";
  attemptCount: number;
  sentAt: string | null;
  lastError: string | null;
};

type BroadcastDetail = {
  id: string;
  name: string;
  subject: string;
  purpose: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string;
  seller?: { businessName: string } | null;
  recipients: Recipient[];
};

const RECIPIENT_STATUS_LABEL: Record<Recipient["status"], string> = {
  PENDING: "Menunggu",
  SENDING: "Mengirim",
  SENT: "Berhasil",
  FAILED: "Gagal",
  SKIPPED: "Dilewati",
};
const RECIPIENT_STATUS_BADGE: Record<Recipient["status"], string> = {
  PENDING: "bg-sand-100 text-sand-600",
  SENDING: "bg-brand-100 text-brand-800",
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  SKIPPED: "bg-amber-100 text-amber-800",
};

export default async function BroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let broadcast: BroadcastDetail;
  try {
    broadcast = await api.get<BroadcastDetail>(`/broadcasts/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link href="/broadcast" className="text-sm font-bold text-brand-700">← Riwayat broadcast</Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-sand-900">{broadcast.name}</h1>
          <p className="mt-1 text-sm text-sand-500">{broadcast.seller?.businessName ?? "Serahin"} · {broadcast.subject}</p>
          <p className="mt-1 text-xs text-sand-400">Dibuat {formatTanggal(broadcast.createdAt)}</p>
        </div>
        <Status value={broadcast.status} />
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-sand-200 bg-white p-4"><p className="text-xs font-bold uppercase text-sand-500">Penerima</p><p className="mt-1 text-xl font-extrabold text-sand-900">{broadcast.recipientCount}</p></div>
        <div className="rounded-xl border border-sand-200 bg-white p-4"><p className="text-xs font-bold uppercase text-sand-500">Berhasil</p><p className="mt-1 text-xl font-extrabold text-emerald-700">{broadcast.sentCount}</p></div>
        <div className="rounded-xl border border-sand-200 bg-white p-4"><p className="text-xs font-bold uppercase text-sand-500">Gagal</p><p className="mt-1 text-xl font-extrabold text-rose-700">{broadcast.failedCount}</p></div>
        <div className="rounded-xl border border-sand-200 bg-white p-4"><p className="text-xs font-bold uppercase text-sand-500">Dilewati</p><p className="mt-1 text-xl font-extrabold text-amber-700">{broadcast.skippedCount}</p></div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-sand-900">Penerima ({broadcast.recipients.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-soft text-left text-xs uppercase text-sand-500">
              <tr>
                <th className="p-4">Buyer</th>
                <th className="p-4">Status</th>
                <th className="p-4">Percobaan</th>
                <th className="p-4">Terkirim</th>
                <th className="p-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {broadcast.recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td className="p-4"><b>{recipient.recipientName}</b><p className="text-xs text-sand-500">{recipient.recipientEmail}</p></td>
                  <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${RECIPIENT_STATUS_BADGE[recipient.status]}`}>{RECIPIENT_STATUS_LABEL[recipient.status]}</span></td>
                  <td className="p-4 text-sand-600">{recipient.attemptCount}×</td>
                  <td className="p-4 text-sand-600">{recipient.sentAt ? formatTanggal(recipient.sentAt) : "—"}</td>
                  <td className="p-4 text-xs text-rose-700">{recipient.lastError ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {broadcast.recipients.length === 0 && <p className="p-10 text-center text-sand-500">Belum ada penerima.</p>}
        </div>
      </section>
    </div>
  );
}
