import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { CampaignBadge } from "@/components/badges";
import { formatTanggal } from "@/lib/format";
import {
  computeVendorStats,
  ratingStars,
  KETEPATAN_LABEL,
  KUALITAS_LABEL,
} from "@/lib/vendor";

export const dynamic = "force-dynamic";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        select: { id: true, namaProduk: true, status: true, createdAt: true },
      },
      evaluations: {
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { id: true, namaProduk: true } } },
      },
    },
  });
  if (!vendor) notFound();

  const stats = computeVendorStats(vendor.evaluations);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/vendor" className="text-sm text-slate-500 hover:text-slate-700">
          ← Daftar vendor
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {vendor.nama}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {vendor.spesialisasi ?? "Tanpa spesialisasi"}
              {vendor.kontak ? ` · ${vendor.kontak}` : ""}
            </p>
          </div>
          <LinkButton href={`/vendor/${id}/edit`} variant="secondary">
            Edit
          </LinkButton>
        </div>
      </div>

      {/* Ringkasan performa (FR-7.4) */}
      <Card>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Kampanye</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {vendor.campaigns.length}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Rating rata-rata
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-600">
              {ratingStars(stats.avgRating)}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Kampanye telat
            </p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">
              {stats.jumlahTelat}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total hari telat
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.totalHariTelat}
            </p>
          </div>
        </div>
      </Card>

      {vendor.catatanUmum && (
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Catatan umum
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {vendor.catatanUmum}
          </p>
        </Card>
      )}

      {/* Riwayat kampanye */}
      <Card>
        <CardHeader title="Riwayat kampanye" />
        {vendor.campaigns.length === 0 ? (
          <EmptyState title="Belum pernah dikaitkan ke kampanye" />
        ) : (
          <div className="divide-y divide-slate-100">
            {vendor.campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/kampanye/${c.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{c.namaProduk}</p>
                  <p className="text-xs text-slate-500">
                    {formatTanggal(c.createdAt)}
                  </p>
                </div>
                <CampaignBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Riwayat evaluasi */}
      <Card>
        <CardHeader title="Riwayat evaluasi" />
        {vendor.evaluations.length === 0 ? (
          <EmptyState
            title="Belum ada evaluasi"
            description="Isi evaluasi dari halaman kampanye setelah kampanye selesai."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {vendor.evaluations.map((e) => (
              <div key={e.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/kampanye/${e.campaign.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {e.campaign.namaProduk}
                  </Link>
                  <span className="text-amber-600">
                    {ratingStars(e.rating)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {KETEPATAN_LABEL[e.ketepatanWaktu]}
                  {e.ketepatanWaktu === "TELAT" && e.jumlahHariTelat
                    ? ` (${e.jumlahHariTelat} hari)`
                    : ""}{" "}
                  · {KUALITAS_LABEL[e.kesesuaianKualitas]}
                </p>
                {e.catatan && (
                  <p className="mt-1 text-sm text-slate-500">{e.catatan}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
