import Link from "next/link";
import { api } from "@/lib/api";
import { CampaignBadge } from "@/components/badges";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { formatRupiah, formatTanggal, toNumber } from "@/lib/format";
import type { CampaignStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type CampaignRow = {
  id: string;
  namaProduk: string;
  status: CampaignStatus;
  tanggalTutup: string | null;
  kuotaTotal: number;
  terisi: number;
  variants: { harga: string }[];
  _count: { orders: number };
};

/** Rentang harga varian sebuah kampanye, mis. "Rp150.000 – Rp165.000". */
function rentangHarga(variants: { harga: string }[]): string {
  if (variants.length === 0) return "-";
  const hargas = variants.map((v) => toNumber(v.harga));
  const min = Math.min(...hargas);
  const max = Math.max(...hargas);
  return min === max
    ? formatRupiah(min)
    : `${formatRupiah(min)} – ${formatRupiah(max)}`;
}

export default async function KampanyeListPage() {
  const campaigns = await api.get<CampaignRow[]>("/kampanye");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kampanye PO
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Semua batch Pre-Order dalam satu tempat.
          </p>
        </div>
        <LinkButton href="/kampanye/baru">+ Kampanye Baru</LinkButton>
      </div>

      <Card>
        {campaigns.length === 0 ? (
          <EmptyState
            title="Belum ada kampanye"
            description="Mulai dengan membuat kampanye Pre-Order pertama Anda."
            action={
              <LinkButton href="/kampanye/baru">+ Kampanye Baru</LinkButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Produk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Harga</th>
                  <th className="px-5 py-3 font-medium">Kuota</th>
                  <th className="px-5 py-3 font-medium">Pesanan</th>
                  <th className="px-5 py-3 font-medium">Tutup PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const kuotaTotal = c.kuotaTotal;
                  const terisi = c.terisi;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/kampanye/${c.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {c.namaProduk}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <CampaignBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {rentangHarga(c.variants)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {terisi} / {kuotaTotal}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {c._count.orders}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {formatTanggal(c.tanggalTutup)}
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
