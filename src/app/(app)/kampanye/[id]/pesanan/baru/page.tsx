import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { OrderForm } from "@/app/(app)/pesanan/OrderForm";
import { createOrder } from "@/app/(app)/pesanan/actions";
import { campaignMenerimaPesanan } from "@/lib/domain";
import { formatTanggal, toNumber } from "@/lib/format";
import { richTextToPlain } from "@/lib/sanitize";
import type { CampaignStatus } from "@/lib/types";
import { Card } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

type CampaignDetail = {
  namaProduk: string;
  deskripsi: string | null;
  status: CampaignStatus;
  tanggalTutup: string;
  variants: {
    id: string;
    namaVarian: string;
    sisa: number;
    harga: string;
    warna: string[];
  }[];
};

export default async function TambahPesananPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let campaign: CampaignDetail;
  try {
    campaign = await api.get<CampaignDetail>(`/kampanye/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const bisaPesan = campaignMenerimaPesanan(campaign.status);

  const variantOptions = campaign.variants.map((v) => ({
    id: v.id,
    namaVarian: v.namaVarian,
    sisa: v.sisa,
    harga: toNumber(v.harga),
    warna: v.warna ?? [],
  }));

  const action = createOrder.bind(null, id);
  const deskripsiPlain = campaign.deskripsi
    ? richTextToPlain(campaign.deskripsi)
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/kampanye/${id}?tab=pesanan`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke kampanye
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Tambah Pesanan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {campaign.namaProduk}
        </p>
      </div>

      <Card className="mb-6 p-4">
        <p className="text-sm text-slate-700">
          Kampanye tutup:{" "}
          <span className="font-medium text-slate-900">
            {formatTanggal(campaign.tanggalTutup)}
          </span>
        </p>
        {deskripsiPlain && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Deskripsi kampanye
              </span>
              <CopyButton text={deskripsiPlain} label="Salin deskripsi" />
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {deskripsiPlain}
            </p>
          </div>
        )}
      </Card>

      {!bisaPesan ? (
        <Card className="p-6">
          <p className="text-sm text-rose-700">
            Kampanye ini berstatus bukan <b>Open</b>, sehingga tidak dapat
            menerima pesanan baru (FR-1.6).
          </p>
        </Card>
      ) : (
        <OrderForm
          action={action}
          variants={variantOptions}
          submitLabel="Simpan Pesanan"
          withBuktiPembayaran
        />
      )}
    </div>
  );
}
