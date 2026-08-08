import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CampaignForm, type VendorOption } from "../../CampaignForm";
import { updateCampaign } from "../../actions";
import { toDateInput, toNumber } from "@/lib/format";
import { computeVendorStats, type EvalInput } from "@/lib/vendor";
import type { CampaignStatus, PaymentScheme } from "@/lib/types";

export const dynamic = "force-dynamic";

type CampaignDetail = {
  vendorId: string | null;
  namaProduk: string;
  deskripsi: string | null;
  tanggalBuka: string;
  tanggalTutup: string;
  estimasiProduksi: string | null;
  estimasiKirim: string | null;
  paymentScheme: PaymentScheme;
  dpPercent: number | null;
  deadlinePelunasan: string | null;
  status: CampaignStatus;
  variants: {
    id: string;
    namaVarian: string;
    kuotaMaks: number;
    harga: string;
    gambarUrl: string | null;
    hargaPerluTinjau: boolean;
    terisi: number;
  }[];
};

type VendorRow = {
  id: string;
  nama: string;
  _count: { campaigns: number };
  evaluations: EvalInput[];
};

export default async function EditCampaignPage({
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

  const vendors = await api.get<VendorRow[]>("/vendor");
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

  const action = updateCampaign.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/kampanye/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke kampanye
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Edit Kampanye
        </h1>
      </div>

      <CampaignForm
        action={action}
        submitLabel="Simpan Perubahan"
        vendors={vendorOptions}
        initial={{
          vendorId: campaign.vendorId ?? undefined,
          namaProduk: campaign.namaProduk,
          deskripsi: campaign.deskripsi ?? undefined,
          tanggalBuka: toDateInput(campaign.tanggalBuka),
          tanggalTutup: toDateInput(campaign.tanggalTutup),
          estimasiProduksi: toDateInput(campaign.estimasiProduksi),
          estimasiKirim: toDateInput(campaign.estimasiKirim),
          paymentScheme: campaign.paymentScheme,
          dpPercent: campaign.dpPercent ?? undefined,
          deadlinePelunasan: toDateInput(campaign.deadlinePelunasan),
          variants: campaign.variants.map((v) => ({
            id: v.id,
            namaVarian: v.namaVarian,
            kuotaMaks: v.kuotaMaks,
            harga: toNumber(v.harga),
            gambarUrl: v.gambarUrl ?? undefined,
            perluTinjau: v.hargaPerluTinjau,
            terisi: v.terisi,
          })),
        }}
      />
    </div>
  );
}
