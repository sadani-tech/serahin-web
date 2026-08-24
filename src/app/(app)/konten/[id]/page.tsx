import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SubmitButton } from "@/components/SubmitButton";
import type { PageStatus } from "@/lib/types";
import { StaticPageForm } from "../StaticPageForm";
import { updateStaticPage, deleteStaticPage } from "../actions";

export const dynamic = "force-dynamic";

type StaticPageDetail = {
  id: string;
  judul: string;
  slug: string;
  konten: string;
  status: PageStatus;
  urutan: number;
};

export default async function KontenEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let page: StaticPageDetail;
  try {
    page = await api.get<StaticPageDetail>(`/cms/pages/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const updateAction = updateStaticPage.bind(null, id);
  const deleteAction = deleteStaticPage.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/konten"
            className="text-sm text-sand-500 hover:text-sand-700"
          >
            ← Kembali ke Konten
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
            Edit Halaman
          </h1>
        </div>
        {page.status === "PUBLISH" && (
          <Link
            href={`/halaman/${page.slug}`}
            target="_blank"
            className="mt-6 text-sm font-medium text-brand-700 hover:underline"
          >
            Lihat halaman publik ↗
          </Link>
        )}
      </div>

      <StaticPageForm
        action={updateAction}
        initial={{
          judul: page.judul,
          slug: page.slug,
          konten: page.konten,
          status: page.status,
          urutan: page.urutan,
        }}
        submitLabel="Simpan Perubahan"
      />

      <form action={deleteAction} className="mt-6 border-t border-sand-200 pt-6">
        <SubmitButton variant="danger" loadingText="Menghapus…">
          Hapus Halaman
        </SubmitButton>
      </form>
    </div>
  );
}
