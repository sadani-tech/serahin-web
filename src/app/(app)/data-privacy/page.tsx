import { api } from "@/lib/api";
import { formatTanggal } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { updateDeletionRequest } from "./actions";

type DeletionStatus =
  | "DITERIMA"
  | "DIVERIFIKASI"
  | "DIPROSES"
  | "SELESAI"
  | "DITOLAK_DENGAN_ALASAN";

type DeletionRequest = {
  id: string;
  email: string | null;
  phone: string | null;
  orderReference: string | null;
  reason: string | null;
  internalNote: string | null;
  status: DeletionStatus;
  createdAt: string;
  resolvedAt: string | null;
};

const labels: Record<DeletionStatus, string> = {
  DITERIMA: "Diterima",
  DIVERIFIKASI: "Diverifikasi",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITOLAK_DENGAN_ALASAN: "Ditolak dengan alasan",
};

export const dynamic = "force-dynamic";

export default async function DataPrivacyAdminPage() {
  const response = await api.get<{
    data: DeletionRequest[];
    meta: { total: number };
  }>("/data-privacy/deletion-requests", { limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
          Privasi Data
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Kelola permintaan penghapusan data pembeli · {response.meta.total} permintaan.
        </p>
      </div>

      {response.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center text-sm text-sand-500">
          Belum ada permintaan penghapusan data.
        </div>
      ) : (
        <div className="space-y-4">
          {response.data.map((request) => (
            <article key={request.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-extrabold text-sand-900">
                    {request.email || request.phone || "Kontak tidak tersedia"}
                  </p>
                  <p className="mt-1 text-xs text-sand-500">
                    {request.phone && request.email ? `${request.phone} · ` : ""}
                    Diajukan {formatTanggal(request.createdAt)} · Referensi {request.id}
                  </p>
                  {request.orderReference && (
                    <p className="mt-1 text-xs font-bold text-brand-700">
                      Pesanan: {request.orderReference}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-extrabold text-sand-700">
                  {labels[request.status]}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-cream-soft p-3 text-sm text-sand-700">
                {request.reason}
              </p>
              <form action={updateDeletionRequest} className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
                <input type="hidden" name="id" value={request.id} />
                <label className="text-xs font-bold text-sand-600">
                  Status
                  <select name="status" defaultValue={request.status} className="mt-1 block min-h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm">
                    {(Object.keys(labels) as DeletionStatus[]).map((status) => (
                      <option key={status} value={status}>{labels[status]}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-sand-600">
                  Catatan internal
                  <input name="internalNote" defaultValue={request.internalNote ?? ""} maxLength={1000} className="mt-1 block min-h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm" />
                </label>
                <SubmitButton loadingText="Menyimpan…">Simpan</SubmitButton>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
