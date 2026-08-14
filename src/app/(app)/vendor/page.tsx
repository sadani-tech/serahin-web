import { api } from "@/lib/api";
import { LinkButton } from "@/components/ui";
import VendorTable from "@/components/VendorTable";

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  nama: string;
  kontak: string | null;
  spesialisasi: string | null;
  _count: { campaigns: number };
  evaluations: {
    rating: number;
    ketepatanWaktu: "TEPAT_WAKTU" | "TELAT";
    jumlahHariTelat: number | null;
  }[];
};

export default async function VendorListPage() {
  const vendors = await api.list<VendorRow>("/vendor");

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

      <VendorTable vendors={vendors} />
    </div>
  );
}
