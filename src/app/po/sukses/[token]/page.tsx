import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { PublicFooter } from "@/components/PublicFooter";
import { PortalLinkBox } from "./PortalLinkBox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pesanan Terkirim — Serahin",
  robots: { index: false, follow: false },
};

export default async function PublicOrderSuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { tokenAkses: token },
    include: {
      items: { include: { variant: { select: { namaVarian: true } } } },
      campaign: { select: { namaProduk: true } },
    },
  });
  if (!order) notFound();

  const total = order.items.reduce(
    (s, it) => s + Number(it.hargaSaatPesan) * it.jumlah,
    0,
  );
  const totalQty = order.items.reduce((s, it) => s + it.jumlah, 0);

  return (
    <div className="min-h-full bg-slate-50 py-10">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Pesanan terkirim!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Terima kasih. Pesanan Anda sedang menunggu verifikasi Admin.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Ringkasan pesanan
            </h2>
          </div>
          <dl className="divide-y divide-slate-100 text-sm">
            <Row label="Produk" value={order.campaign.namaProduk} />
            {order.items.map((it) => (
              <Row
                key={it.id}
                label={it.variant.namaVarian}
                value={`${it.jumlah} × ${formatRupiah(it.hargaSaatPesan)}`}
              />
            ))}
            <Row label="Total unit" value={`${totalQty} unit`} />
            <Row label="Perkiraan total" value={formatRupiah(total)} />
            <Row label="Atas nama" value={order.namaPembeli} />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-slate-900">
            Pantau status pesanan Anda
          </p>
          <p className="mb-3 text-xs text-slate-500">
            Simpan link ini. Anda bisa mengecek status pesanan kapan saja tanpa
            login.
          </p>
          <PortalLinkBox token={order.tokenAkses} />
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
