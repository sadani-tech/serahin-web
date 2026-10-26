import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { RichText } from "@/components/RichText";
import { IconSprite } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";
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
    <div className="rv-scope js is-loaded">
      <IconSprite />
      <RevampHeader navLinks={[]} />
      <main className="legal-page">
        <div className="legal-page__inner">
          <Link href="/" className="legal-page__back">
            ← Kembali ke beranda
          </Link>
          <article className="legal-page__card legal-page__card--standalone">
            <h1 className="legal-page__title font-head">{page.judul}</h1>
            <p className="legal-page__updated">
              Diperbarui {formatTanggal(page.updatedAt)}
            </p>
            <div className="mt-6">
              <RichText html={page.konten} />
            </div>
          </article>
        </div>
      </main>
      <RevampFooter />
    </div>
  );
}
