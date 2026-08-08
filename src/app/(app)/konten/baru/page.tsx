import Link from "next/link";
import { StaticPageForm } from "../StaticPageForm";
import { createStaticPage } from "../actions";

export default function KontenBaruPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/konten"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke Konten
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Halaman Baru
        </h1>
      </div>
      <StaticPageForm action={createStaticPage} submitLabel="Simpan Halaman" />
    </div>
  );
}
