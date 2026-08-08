import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_TYPE_LABEL } from "@/lib/domain";
import { IMPORT_MODE_LABEL } from "@/lib/import-labels";
import type { ImportMode, OrderStatus, PaymentType } from "@/lib/types";
import { ConfirmBar } from "./ConfirmBar";

export const dynamic = "force-dynamic";

type Validation = {
  ringkasan: { pesananValid: number; pesananError: number };
  kuotaWarnings: string[];
  kampanye: {
    errors: string[];
    namaProduk: string;
    harga: number;
    tanggalBuka: string | null;
    tanggalTutup: string | null;
    paymentScheme: string;
  } | null;
  varian: { namaVarian: string; harga: number; kuotaMaks: number; errors: string[] }[];
  pesanan: {
    idRef: string;
    namaPembeli: string;
    kontak: string;
    status: OrderStatus;
    errors: string[];
    warnings: string[];
  }[];
  items: {
    idRefPesanan: string;
    varianInput: string;
    jumlah: number;
    hargaSaatPesan: number;
    errors: string[];
  }[];
  pembayaran: {
    idRefPesanan: string;
    jenis: PaymentType | null;
    jumlah: number | null;
    tanggal: string | null;
    errors: string[];
  }[];
};

export default async function ImportPreviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;

  let res: {
    draft: { mode: ImportMode; namaFile: string; targetNama: string | null };
    validation: Validation;
  };
  try {
    res = await api.get(`/import/draft/${draftId}/preview`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const { draft, validation: v } = res;
  const targetNama = draft.targetNama;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/import" className="text-sm text-slate-500 hover:text-slate-700">
          ← Batal & kembali
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Pratinjau Import
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {IMPORT_MODE_LABEL[draft.mode]} · {draft.namaFile}
          {targetNama ? ` · tujuan: ${targetNama}` : ""}
        </p>
      </div>

      <ConfirmBar
        draftId={draftId}
        pesananValid={v.ringkasan.pesananValid}
        pesananError={v.ringkasan.pesananError}
        bisaKonfirmasi={v.ringkasan.pesananValid > 0}
      />

      {v.kuotaWarnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          <p className="font-medium">Peringatan kuota (tidak memblokir):</p>
          <ul className="mt-1 list-inside list-disc">
            {v.kuotaWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Kampanye (Mode A) */}
      {v.kampanye && (
        <Card>
          <CardHeader title="Kampanye" />
          <div className="px-5 py-4 text-sm">
            {v.kampanye.errors.length > 0 && (
              <p className="mb-2 text-rose-600">
                {v.kampanye.errors.join(", ")}
              </p>
            )}
            <p className="font-medium text-slate-900">{v.kampanye.namaProduk}</p>
            <p className="text-slate-600">
              {formatRupiah(v.kampanye.harga)} ·{" "}
              {formatTanggal(v.kampanye.tanggalBuka)} –{" "}
              {formatTanggal(v.kampanye.tanggalTutup)} · {v.kampanye.paymentScheme}
            </p>
          </div>
        </Card>
      )}

      {/* Varian (Mode A) */}
      {v.varian.length > 0 && (
        <Card>
          <CardHeader title={`Varian (${v.varian.length})`} />
          <PreviewTable
            head={["Nama varian", "Harga", "Kuota"]}
            rows={v.varian.map((x) => ({
              cells: [x.namaVarian, formatRupiah(x.harga), String(x.kuotaMaks)],
              error: x.errors.join(", "),
            }))}
          />
        </Card>
      )}

      {/* Pesanan (header) */}
      <Card>
        <CardHeader
          title={`Pesanan (${v.pesanan.length})`}
          subtitle="Baris merah akan dilewati saat konfirmasi."
        />
        <PreviewTable
          head={["Ref", "Nama", "Kontak", "Status"]}
          rows={v.pesanan.map((p) => ({
            cells: [
              p.idRef,
              p.namaPembeli || "—",
              p.kontak || "—",
              ORDER_STATUS_LABEL[p.status],
            ],
            error: p.errors.join(", "),
            warning: p.warnings.join(", "),
          }))}
        />
      </Card>

      {/* Item Pesanan (keranjang) */}
      <Card>
        <CardHeader title={`Item Pesanan (${v.items.length})`} />
        <PreviewTable
          head={["Ref Pesanan", "Varian", "Qty", "Harga"]}
          rows={v.items.map((it) => ({
            cells: [
              it.idRefPesanan || "—",
              it.varianInput || "—",
              String(it.jumlah),
              formatRupiah(it.hargaSaatPesan),
            ],
            error: it.errors.join(", "),
          }))}
        />
      </Card>

      {/* Pembayaran */}
      <Card>
        <CardHeader title={`Pembayaran (${v.pembayaran.length})`} />
        <PreviewTable
          head={["Ref Pesanan", "Jenis", "Jumlah", "Tanggal"]}
          rows={v.pembayaran.map((p) => ({
            cells: [
              p.idRefPesanan || "—",
              p.jenis ? PAYMENT_TYPE_LABEL[p.jenis] : "—",
              p.jumlah != null ? formatRupiah(p.jumlah) : "—",
              formatTanggal(p.tanggal),
            ],
            error: p.errors.join(", "),
          }))}
        />
      </Card>
    </div>
  );
}

function PreviewTable({
  head,
  rows,
}: {
  head: string[];
  rows: { cells: string[]; error?: string; warning?: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {head.map((h) => (
              <th key={h} className="px-4 py-2 font-medium">
                {h}
              </th>
            ))}
            <th className="px-4 py-2 font-medium">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i} className={r.error ? "bg-rose-50" : ""}>
              {r.cells.map((c, j) => (
                <td key={j} className="px-4 py-2 text-slate-700">
                  {c}
                </td>
              ))}
              <td className="px-4 py-2 text-xs">
                {r.error && <span className="text-rose-600">{r.error}</span>}
                {!r.error && r.warning && (
                  <span className="text-amber-600">⚠ {r.warning}</span>
                )}
                {!r.error && !r.warning && (
                  <span className="text-emerald-600">✓</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
