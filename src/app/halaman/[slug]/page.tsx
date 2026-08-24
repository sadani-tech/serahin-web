import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { RichText } from "@/components/RichText";
import { PublicFooter } from "@/components/PublicFooter";
import { SerahinLogo } from "@/components/brand";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

type StaticPage = {
  judul: string;
  konten: string;
  updatedAt: string;
};

async function fetchPage(slug: string): Promise<StaticPage | null> {
  try {
    return await api.get<StaticPage>(`/cms/public/pages/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  return {
    title: page ? `${page.judul} — Serahin` : "Halaman tidak ditemukan — Serahin",
  };
}

export default async function PublicStaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  return (
    <div className="bg-serahin-dots min-h-full py-10">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/"
          className="inline-flex"
        >
          <SerahinLogo size="sm" />
        </Link>
        <article className="mt-4 rounded-2xl border border-sand-200 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
            {page.judul}
          </h1>
          <p className="mt-1 text-xs text-sand-400">
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
