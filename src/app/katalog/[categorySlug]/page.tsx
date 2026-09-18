import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { ProductImage } from "@/components/ProductImage";
import { getPublicCatalog } from "@/lib/public-catalog";
import { getSession } from "@/lib/session";
import { formatRupiah } from "@/lib/format";
import { toPublicSlug } from "@/lib/slug";

type Params = Promise<{ categorySlug: string }>;

async function categoryName(categorySlug: string) {
  const catalog = await getPublicCatalog({ page: 1, limit: 48 });
  return catalog.filters.categories.find((category) => toPublicSlug(category) === categorySlug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await categoryName(categorySlug);
  if (!category) return { title: "Kategori tidak ditemukan" };
  return { title: `Produk ${category}`, description: `Jelajahi produk kategori ${category} dalam Batch PO aktif Serahin.`, alternates: { canonical: `/katalog/${categorySlug}` } };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { categorySlug } = await params;
  const category = await categoryName(categorySlug);
  if (!category) notFound();
  const [catalog, session] = await Promise.all([getPublicCatalog({ category, page: 1, limit: 48 }), getSession()]);
  return <div className="bg-serahin-dots min-h-full"><PublicHeader loggedIn={Boolean(session)} role={session?.role} name={session?.name} email={session?.email} /><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Katalog Serahin</p><h1 className="mt-2 text-4xl font-extrabold text-sand-900">Kategori {category}</h1><p className="mt-2 text-sand-600">{catalog.meta.total} produk dalam Batch PO aktif.</p><div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{catalog.campaigns.flatMap((campaign) => campaign.variants.map((variant) => <article key={`${campaign.id}-${variant.id}`} className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm"><div className="aspect-square bg-sand-100"><ProductImage src={variant.gambarUrl} alt={variant.namaVarian} className="h-full w-full object-cover" /></div><div className="p-4"><h2 className="font-extrabold text-sand-900">{variant.namaVarian}</h2><p className="mt-1 font-extrabold text-brand-700">{formatRupiah(variant.harga)}</p><Link href={variant.productSlug ? `/s/${campaign.seller.slug}/produk/${variant.productSlug}?variant=${encodeURIComponent(variant.id)}` : `/po/${campaign.formToken}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-extrabold text-white">Lihat Produk</Link></div></article>))}</div></main><PublicFooter /></div>;
}
