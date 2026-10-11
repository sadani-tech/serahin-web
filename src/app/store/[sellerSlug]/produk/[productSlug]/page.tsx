import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { IconSprite } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";
import { getPublicProduct } from "@/lib/public-product";
import { getSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { ProductDetailClient } from "./ProductDetailClient";

type Params = Promise<{ sellerSlug: string; productSlug: string }>;
type SearchParams = Promise<{ variant?: string }>;

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#testimonial", label: "Testimonial" },
  { href: "/#faq", label: "FAQ" },
];

async function load(params: Params) {
  const { sellerSlug, productSlug } = await params;
  try { return await getPublicProduct(sellerSlug, productSlug); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || `Pesan ${product.name} melalui Batch PO Serahin.`;
  const productImages = product.variants.flatMap((variant) => variant.images).slice(0, 1);
  const images = productImages.length > 0 ? productImages : ["/opengraph-image"];
  return {
    title,
    description,
    alternates: { canonical: `/store/${product.seller.slug}/produk/${product.canonicalSlug}` },
    openGraph: { title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
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
  if (product.redirected && product.canonicalSlug !== requested) permanentRedirect(`/store/${product.seller.slug}/produk/${product.canonicalSlug}`);
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/store/${product.seller.slug}/produk/${product.canonicalSlug}`;
  const productJsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    url: canonicalUrl,
    description: product.seoDescription ?? undefined,
    image: product.variants.flatMap((variant) => variant.images),
    brand: { "@type": "Brand", name: product.seller.businessName },
    offers: product.variants.flatMap((variant) => (variant.offerings?.length ? variant.offerings : variant.offering ? [variant.offering] : []).map((offering) => ({
      "@type": "Offer", priceCurrency: "IDR", price: offering.price,
      url: canonicalUrl,
      sku: variant.sku ?? undefined,
      seller: { "@type": "Organization", name: product.seller.businessName },
      availability: offering.orderable && offering.quotaRemaining > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    }))),
  };
  return (
    <div className="rv-scope js is-loaded">
      <IconSprite />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <RevampHeader navLinks={NAV_LINKS} loggedIn={Boolean(session)} role={session?.role} />
      <main id="main">
        <div className="pd-stage">
          <ProductDetailClient product={product} initialVariantId={query.variant} role={session?.role} />
        </div>
        <div className="k-band" aria-hidden="true" />
      </main>
      <RevampFooter />
    </div>
  );
}

