import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { PublicFooter } from "@/components/PublicFooter";
import { SerahinLogo } from "@/components/brand";
import { PortalLinkBox } from "./PortalLinkBox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pesanan Terkirim — Serahin",
  robots: { index: false, follow: false },
};

type SuccessOrder = {
  namaPembeli: string;
  tokenAkses: string;
  items: {
    id: string;
    jumlah: number;
    hargaSaatPesan: string;
    variant: { namaVarian: string };
  }[];
  campaign: { namaProduk: string };
};

export default async function PublicOrderSuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let order: SuccessOrder;
  try {
    order = await api.get<SuccessOrder>(`/public/order/${token}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const total = order.items.reduce(
    (s, it) => s + Number(it.hargaSaatPesan) * it.jumlah,
    0,
  );
  const totalQty = order.items.reduce((s, it) => s + it.jumlah, 0);

  return (
    <div className="bg-serahin-dots relative min-h-full py-10">
      <div
        aria-hidden="true"
        className="bg-serahin-sunburst pointer-events-none absolute inset-x-0 top-0 h-72"
      />
      <div className="relative mx-auto max-w-lg space-y-6 px-4">
        <div className="flex flex-col items-center text-center">
          <SerahinLogo size="md" layout="stacked" />
          <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl ring-4 ring-brand-50">
            ✓
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-sand-900">
            Pesanan terkirim!
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Terima kasih. Pesanan Anda sedang menunggu verifikasi Admin.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lg">
          <div className="border-b border-sand-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-sand-900">
              Ringkasan pesanan
            </h2>
          </div>
          <dl className="divide-y divide-sand-100 text-sm">
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

        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-lg">
          <p className="mb-1 text-sm font-semibold text-sand-900">
            Pantau status pesanan Anda
          </p>
          <p className="mb-3 text-xs text-sand-500">
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
      <dt className="text-sand-500">{label}</dt>
      <dd className="font-medium text-sand-900">{value}</dd>
    </div>
  );
}
