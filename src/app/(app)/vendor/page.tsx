import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { computeVendorStats, ratingStars } from "@/lib/vendor";

export const dynamic = "force-dynamic";

export default async function VendorListPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { nama: "asc" },
    include: {
      _count: { select: { campaigns: true } },
      evaluations: {
        select: { rating: true, ketepatanWaktu: true, jumlahHariTelat: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Vendor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Riwayat performa vendor untuk keputusan kampanye berikutnya.
          </p>
        </div>
        <LinkButton href="/vendor/baru">+ Vendor Baru</LinkButton>
      </div>

      <Card>
        {vendors.length === 0 ? (
          <EmptyState
            title="Belum ada vendor"
            description="Tambahkan profil vendor pertama Anda."
            action={<LinkButton href="/vendor/baru">+ Vendor Baru</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Spesialisasi</th>
                  <th className="px-5 py-3 font-medium">Kampanye</th>
                  <th className="px-5 py-3 font-medium">Rating</th>
                  <th className="px-5 py-3 font-medium">Telat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => {
                  const stats = computeVendorStats(v.evaluations);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/vendor/${v.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {v.nama}
                        </Link>
                        {v.kontak && (
                          <div className="text-xs text-slate-500">{v.kontak}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {v.spesialisasi ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {v._count.campaigns}
                      </td>
                      <td className="px-5 py-3 text-amber-600">
                        {ratingStars(stats.avgRating)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {stats.jumlahTelat > 0 ? (
                          <span className="text-rose-600">
                            {stats.jumlahTelat}× ({stats.totalHariTelat} hari)
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
