import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui";
import { StaticPageForm } from "../StaticPageForm";
import { updateStaticPage, deleteStaticPage } from "../actions";

export const dynamic = "force-dynamic";

export default async function KontenEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.staticPage.findUnique({ where: { id } });
  if (!page) notFound();

  const updateAction = updateStaticPage.bind(null, id);
  const deleteAction = deleteStaticPage.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/konten"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Kembali ke Konten
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Edit Halaman
          </h1>
        </div>
        {page.status === "PUBLISH" && (
          <Link
            href={`/halaman/${page.slug}`}
            target="_blank"
            className="mt-6 text-sm font-medium text-teal-700 hover:underline"
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

      <form action={deleteAction} className="mt-6 border-t border-slate-200 pt-6">
        <Button variant="danger" type="submit">
          Hapus Halaman
        </Button>
      </form>
    </div>
  );
}
