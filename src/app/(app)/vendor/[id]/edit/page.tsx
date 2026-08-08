import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VendorForm } from "../../VendorForm";
import { updateVendor } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

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
        }}
      />
    </div>
  );
}
