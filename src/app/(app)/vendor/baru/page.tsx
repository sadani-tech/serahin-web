import Link from "next/link";
import { VendorForm } from "../VendorForm";
import { createVendor } from "../actions";

export default function VendorBaruPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/vendor" className="text-sm text-sand-500 hover:text-sand-700">
          ← Kembali ke daftar vendor
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          Vendor Baru
        </h1>
      </div>
      <VendorForm action={createVendor} submitLabel="Simpan Vendor" />
    </div>
  );
}
