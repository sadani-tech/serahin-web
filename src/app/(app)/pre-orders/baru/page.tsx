import Link from "next/link";
import { api } from "@/lib/api";
import { PreorderForm, type VendorOption } from "../PreorderForm";
import { createPreorder } from "../actions";
import { computeVendorStats, type EvalInput } from "@/lib/vendor";

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  nama: string;
  _count: { campaigns: number };
  evaluations: EvalInput[];
};

export default async function NewPreorderPage() {
  const vendors = await api.list<VendorRow>("/vendor");

  const vendorOptions: VendorOption[] = vendors.map((v) => {
    const stats = computeVendorStats(v.evaluations);
    return {
      id: v.id,
      nama: v.nama,
      avgRating: stats.avgRating,
      jumlahTelat: stats.jumlahTelat,
      jumlahKampanye: v._count.campaigns,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/pre-orders"
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Kembali ke daftar Batch PO
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          Batch PO Baru
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Buat batch Pre-Order baru beserta varian dan kuotanya.
        </p>
      </div>

      <PreorderForm
        action={createPreorder}
        submitLabel="Buat Batch PO"
        vendors={vendorOptions}
      />
    </div>
  );
}
