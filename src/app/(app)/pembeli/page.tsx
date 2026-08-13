import Link from "next/link";
import { api } from "@/lib/api";
import { OrderBadge } from "@/components/badges";
import { Card, EmptyState, Input, ScrollList } from "@/components/ui";
import { formatTanggal } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type PembeliOrder = {
  id: string;
  namaPembeli: string;
  kontak: string;
  status: OrderStatus;
  createdAt: string;
  campaign: { namaProduk: string };
  items: { jumlah: number }[];
};

export default async function PembeliPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const orders = query
    ? await api.get<PembeliOrder[]>("/pembeli", { q: query })
    : [];

  // Kelompokkan per pembeli (nama+kontak) untuk melihat riwayat lintas kampanye.
  const grouped = new Map<string, typeof orders>();
  for (const o of orders) {
    const key = `${o.namaPembeli.toLowerCase()}|${o.kontak.toLowerCase()}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(o);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Pembeli
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cari riwayat pesanan pembeli berdasarkan nama atau kontak (lintas
          kampanye).
        </p>
      </div>

      <Card className="p-4">
        <form className="flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Cari nama, WA atau email…"
            className="flex-1"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Cari
          </button>
        </form>
      </Card>

      {!query ? (
        <Card>
          <EmptyState
            title="Masukkan kata kunci"
            description="Ketik nama pembeli atau kontak untuk melihat riwayat pesanannya."
          />
        </Card>
      ) : grouped.size === 0 ? (
        <Card>
          <EmptyState
            title="Tidak ditemukan"
            description={`Tidak ada pesanan yang cocok dengan "${query}".`}
          />
        </Card>
      ) : (
        <ScrollList maxRows={6} rowHeight={7} className="space-y-4 pr-1">
          {Array.from(grouped.values()).map((group) => {
            const first = group[0];
            return (
              <Card key={`${first.namaPembeli}|${first.kontak}`}>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {first.namaPembeli}
                    </p>
                    <p className="text-xs text-slate-500">{first.kontak}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {group.length} pesanan
                  </span>
                </div>
                <ScrollList>
                <ul className="divide-y divide-slate-100">
                  {group.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/pesanan/${o.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {o.campaign.namaProduk}
                          </p>
                          <p className="text-xs text-slate-500">
                            {o.items.reduce((s, it) => s + it.jumlah, 0)} unit ·{" "}
                            {formatTanggal(o.createdAt)}
                          </p>
                        </div>
                        <OrderBadge status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
                </ScrollList>
              </Card>
            );
          })}
        </ScrollList>
      )}
    </div>
  );
}
