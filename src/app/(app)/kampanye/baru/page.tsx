import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CampaignForm, type VendorOption } from "../CampaignForm";
import { createCampaign } from "../actions";
import { computeVendorStats } from "@/lib/vendor";

export const dynamic = "force-dynamic";

export default async function KampanyeBaruPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { nama: "asc" },
    include: {
      _count: { select: { campaigns: true } },
      evaluations: {
        select: { rating: true, ketepatanWaktu: true, jumlahHariTelat: true },
      },
    },
  });

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
          href="/kampanye"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke daftar kampanye
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Kampanye PO Baru
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Buat batch Pre-Order baru beserta varian dan kuotanya.
        </p>
      </div>

      <CampaignForm
        action={createCampaign}
        submitLabel="Buat Kampanye"
        vendors={vendorOptions}
      />
    </div>
  );
}
