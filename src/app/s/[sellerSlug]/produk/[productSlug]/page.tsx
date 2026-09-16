import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { getPublicProduct } from "@/lib/public-product";
import { getSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { ProductDetailClient } from "./ProductDetailClient";
import { toPublicSlug } from "@/lib/slug";

type Params = Promise<{ sellerSlug: string; productSlug: string }>;
type SearchParams = Promise<{ variant?: string }>;

async function load(params: Params) {
  const { sellerSlug, productSlug } = await params;
  try { return await getPublicProduct(sellerSlug, productSlug); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || `Pesan ${product.name} melalui Batch PO Serahin.`;
  const images = product.variants.flatMap((variant) => variant.images).slice(0, 1);
  return { title, description, alternates: { canonical: `/s/${product.seller.slug}/produk/${product.canonicalSlug}` }, openGraph: { title, description, images } };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [product, session, query] = await Promise.all([
    load(params),
    getSession(),
    searchParams,
  ]);
  const requested = (await params).productSlug;
  if (product.redirected && product.canonicalSlug !== requested) permanentRedirect(`/s/${product.seller.slug}/produk/${product.canonicalSlug}`);
  const productJsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    description: product.seoDescription ?? undefined,
    image: product.variants.flatMap((variant) => variant.images),
    brand: { "@type": "Brand", name: product.seller.businessName },
    offers: product.variants.filter((variant) => variant.offering).map((variant) => ({
      "@type": "Offer", priceCurrency: "IDR", price: variant.offering!.price,
      availability: variant.offering!.orderable && variant.offering!.quotaRemaining > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };
  return <div className="bg-serahin-dots min-h-full">
    <PublicHeader loggedIn={Boolean(session)} role={session?.role} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-sand-500"><Link href="/" className="hover:text-brand-700">Katalog</Link><span>/</span><Link href={`/katalog/${toPublicSlug(product.variants[0]?.category ?? "Others")}`} className="hover:text-brand-700">{product.variants[0]?.category ?? "Produk"}</Link><span>/</span><span className="text-sand-800">{product.name}</span></nav><ProductDetailClient product={product} initialVariantId={query.variant} /></main>
    <PublicFooter />
  </div>;
}
