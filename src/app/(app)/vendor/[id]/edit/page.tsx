import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { VendorForm } from "../../VendorForm";
import { updateVendor } from "../../actions";

export const dynamic = "force-dynamic";

type VendorDetail = {
  nama: string;
  kontak: string | null;
  spesialisasi: string | null;
  catatanUmum: string | null;
  pricelist: string | null;
};

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let vendor: VendorDetail;
  try {
    vendor = await api.get<VendorDetail>(`/vendor/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const action = updateVendor.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/vendor/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke vendor
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Edit Vendor
        </h1>
      </div>
      <VendorForm
        action={action}
        submitLabel="Simpan Perubahan"
        initial={{
          nama: vendor.nama,
          kontak: vendor.kontak ?? undefined,
          spesialisasi: vendor.spesialisasi ?? undefined,
          catatanUmum: vendor.catatanUmum ?? undefined,
          pricelist: vendor.pricelist ?? undefined,
        }}
      />
    </div>
  );
}
