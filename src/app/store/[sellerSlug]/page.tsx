import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconSprite } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";
import { ProductImage } from "@/components/ProductImage";
import { CatalogQuickAdd } from "@/components/CatalogQuickAdd";
import { getPublicCatalog, getPublicStoreProfile } from "@/lib/public-catalog";
import { getSession } from "@/lib/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = Promise<{ sellerSlug: string }>;

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#testimonial", label: "Testimonial" },
  { href: "/#faq", label: "FAQ" },
];

async function loadProfile(sellerSlug: string) {
  try {
    return await getPublicStoreProfile(sellerSlug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sellerSlug } = await params;
  const profile = await loadProfile(sellerSlug);
  const title = `${profile.businessName} — Toko Serahin`;
  const description = profile.description?.slice(0, 160) || `Jelajahi seluruh Batch PO yang sedang dibuka ${profile.businessName} di Serahin.`;
  return {
    title,
    description,
    alternates: { canonical: `/store/${profile.slug}` },
    openGraph: { title, description, images: profile.logoUrl ? [profile.logoUrl] : ["/opengraph-image"] },
  };
}

export default async function StorePage({ params }: { params: Params }) {
  const { sellerSlug } = await params;
  const [profile, session] = await Promise.all([loadProfile(sellerSlug), getSession()]);
  const catalog = await getPublicCatalog({ seller: profile.slug, limit: 48 });
  const cards = catalog.campaigns.flatMap((campaign) => campaign.variants.map((variant) => ({ campaign, variant })));

  return (
    <div className="rv-scope js is-ready">
      <IconSprite />
      <RevampHeader navLinks={NAV_LINKS} loggedIn={Boolean(session)} role={session?.role} />
      <main id="main">
        <section className="store-hero">
          <div className="store-hero__inner">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo toko bisa dari S3/CDN eksternal
              <img src={profile.logoUrl} alt={profile.businessName} className="store-avatar" />
            ) : (
              <div className="store-avatar" aria-hidden="true">{profile.businessName.slice(0, 1).toUpperCase()}</div>
            )}
            <div className="store-hero__body">
              <h1 id="k-title" className="store-hero__name">{profile.businessName}</h1>
              {profile.description && <p className="store-hero__desc">{profile.description}</p>}

              <dl className="store-stats">
                <div>
                  <dt>Rating</dt>
                  <dd className={profile.ratingCount > 0 ? undefined : "is-muted"}>
                    {profile.ratingCount > 0 ? <>★ {profile.ratingAverage?.toFixed(1)} <small>({profile.ratingCount})</small></> : "Belum ada rating"}
                  </dd>
                </div>
                <div>
                  <dt>Pesanan selesai</dt>
                  <dd>{profile.completedOrderCount}</dd>
                </div>
                <div>
                  <dt>Produk</dt>
                  <dd>{profile.activeProductCount}</dd>
                </div>
                <div>
                  <dt>Batch PO dibuka</dt>
                  <dd>{profile.openCampaignCount}</dd>
                </div>
                <div>
                  <dt>Bergabung</dt>
                  <dd>{formatTanggal(profile.registeredAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="store-products" aria-label={`Produk yang sedang dijual ${profile.businessName}`}>
          <div className="k-shop__inner">
            {cards.length === 0 ? (
              <p className="k-empty">Belum ada Batch PO yang sedang dibuka dari toko ini. Coba lagi nanti.</p>
            ) : (
              <div className="k-grid">
                {cards.map(({ campaign, variant }) => {
                  const detailHref = variant.productSlug ? `/store/${profile.slug}/produk/${variant.productSlug}?variant=${encodeURIComponent(variant.id)}` : `/po/${campaign.formToken}`;
                  return (
                    <article key={`${campaign.id}-${variant.id}`} className="pcard">
                      <div className="pcard__media">
                        <ProductImage src={variant.gambarUrl} alt={variant.namaVarian} className="h-full w-full object-cover" />
                      </div>
                      <div className="pcard__body">
                        <p className="pcard__seller">{campaign.namaProduk}</p>
                        <h3 className="pcard__name">{variant.namaVarian}</h3>
                        {variant.label && (
                          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-accent-100 px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-wide text-accent-800 ring-1 ring-accent-200">
                            {variant.label}
                          </span>
                        )}
                        <div className="pcard__row">
                          <p className="pcard__price">{formatRupiah(variant.harga)}</p>
                          <span className={`pcard__meta${variant.sisa > 0 && variant.sisa <= 10 ? " pcard__meta--low" : ""}`}>
                            {variant.sisa > 0 ? `Sisa ${variant.sisa} pcs` : "Kuota habis"}
                          </span>
                        </div>
                        <div className="pcard__actions">
                          <Link href={detailHref} className="pcard__buy">Beli Produk</Link>
                          <CatalogQuickAdd
                            role={session?.role}
                            detailHref={detailHref}
                            event={{ salesEventId: campaign.id, eventTitle: campaign.namaProduk, formToken: campaign.formToken, sellerId: profile.id, sellerName: profile.businessName, endsAt: campaign.tanggalTutup }}
                            item={{ variantId: variant.id, name: `${campaign.namaProduk} — ${variant.namaVarian}`, price: variant.harga, image: variant.gambarUrl, colors: variant.warna, quotaRemaining: variant.sisa }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <RevampFooter />
    </div>
  );
}
