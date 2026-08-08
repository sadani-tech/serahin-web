import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CampaignForm, type VendorOption } from "../../CampaignForm";
import { updateCampaign } from "../../actions";
import { toDateInput, toNumber } from "@/lib/format";
import { computeVendorStats } from "@/lib/vendor";
import { terisiForVariants } from "@/lib/quota";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) notFound();

  // Hitung terisi per varian untuk batas bawah kuota.
  const terisiMap = await terisiForVariants(
    prisma,
    campaign.variants.map((v) => v.id),
  );

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
            terisi: terisiMap.get(v.id) ?? 0,
          })),
        }}
      />
    </div>
  );
}
