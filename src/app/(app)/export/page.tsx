import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatWaktu } from "@/lib/format";
import { ExportPanel } from "./ExportPanel";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const [campaigns, audits] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, namaProduk: true },
    }),
    prisma.exportAudit.findMany({
      where: { jenis: "kontak" },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { createdBy: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Export
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ekspor data pesanan, rekap pembayaran, dan kontak pembeli dengan
          filter dan pilihan format.
        </p>
      </div>

      <ExportPanel campaigns={campaigns} />

      {/* Audit ekspor kontak (4.3) */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Riwayat Ekspor Kontak
        </h2>
        <Card>
          {audits.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Belum ada ekspor kontak.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Waktu</th>
                    <th className="px-5 py-3 font-medium">Oleh</th>
                    <th className="px-5 py-3 font-medium">Jumlah</th>
                    <th className="px-5 py-3 font-medium">Format</th>
                    <th className="px-5 py-3 font-medium">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audits.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-600">
                        {formatWaktu(a.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {a.createdBy.name ?? a.createdBy.email}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {a.jumlahBaris} kontak
                      </td>
                      <td className="px-5 py-3 uppercase text-slate-500">
                        {a.format}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {a.keterangan ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
