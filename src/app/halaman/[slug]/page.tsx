import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RichText } from "@/components/RichText";
import { PublicFooter } from "@/components/PublicFooter";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.staticPage.findUnique({
    where: { slug },
    select: { judul: true, status: true },
  });
  if (!page || page.status !== "PUBLISH") {
    return { title: "Halaman tidak ditemukan — Serahin" };
  }
  return { title: `${page.judul} — Serahin` };
}

export default async function PublicStaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISH") notFound();

  return (
    <div className="min-h-full bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
        >
          Serahin
        </Link>
        <article className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {page.judul}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Diperbarui {formatTanggal(page.updatedAt)}
          </p>
          <div className="mt-6">
            <RichText html={page.konten} />
          </div>
        </article>
        <PublicFooter />
      </div>
    </div>
  );
}
