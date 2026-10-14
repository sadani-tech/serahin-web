import type { Metadata } from "next";
import Link from "next/link";
import { IconSprite, Icon } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";
import { PublicFaq } from "@/components/PublicFaq";
import { ProductImage } from "@/components/ProductImage";
import { getPublicCatalog, getPublicTestimonials } from "@/lib/public-catalog";
import { getSession } from "@/lib/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import { publicSite } from "@/lib/public-site";
import { CatalogQuickAdd } from "@/components/CatalogQuickAdd";
import { ToastFeedback } from "@/components/Toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Produk Pre-Order — Serahin",
  description:
    "Jelajahi Batch PO aktif, pilih produk, buat pesanan, dan bayar secara aman melalui Serahin.",
  alternates: { canonical: "/catalog" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/catalog",
    siteName: "Serahin",
    title: "Serahin — Katalog Produk Pre-Order",
    description:
      "Temukan produk pre-order aktif dan selesaikan pesanan dari satu tempat.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Serahin — Pre-Order Lebih Rapi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Serahin — Katalog Produk Pre-Order",
    description: "Temukan produk pre-order aktif dan pesan dari satu tempat.",
    images: [{ url: "/twitter-image", alt: "Serahin — Pre-Order Lebih Rapi" }],
  },
};

type HomeSearchParams = {
  campaign?: string;
  seller?: string;
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
  /** "closed" = tampilkan PO yang sudah ditutup (dulu halaman /arsip terpisah) — v2.3.9 tetap di /catalog, cuma filter. */
  status?: string;
};

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#testimonial", label: "Testimonial" },
  { href: "/#faq", label: "FAQ" },
];

function pageHref(params: HomeSearchParams, page: number) {
  const query = new URLSearchParams();
  if (params.campaign) query.set("campaign", params.campaign);
  if (params.seller) query.set("seller", params.seller);
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (params.status) query.set("status", params.status);
  if (page > 1) query.set("page", String(page));
  const value = query.toString();
  return value ? `/catalog?${value}#catalog` : "/catalog#catalog";
}

function categoryHref(params: HomeSearchParams, category: string | null) {
  const query = new URLSearchParams();
  if (params.campaign) query.set("campaign", params.campaign);
  if (params.seller) query.set("seller", params.seller);
  if (category) query.set("category", category);
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (params.status) query.set("status", params.status);
  const value = query.toString();
  return value ? `/catalog?${value}#catalog` : "/catalog#catalog";
}

/** Toggle href tab "Sedang Dibuka" / "PO Ditutup" — tetap di /catalog, filter lewat query `status`. */
function statusHref(params: HomeSearchParams, status: "open" | "closed") {
  const query = new URLSearchParams();
  if (params.campaign) query.set("campaign", params.campaign);
  if (params.seller) query.set("seller", params.seller);
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (status === "closed") query.set("status", "closed");
  const value = query.toString();
  return value ? `/catalog?${value}#catalog` : "/catalog#catalog";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const showClosed = params.status === "closed";
  const [session, catalogResult, testimonials] = await Promise.all([
    getSession(),
    getPublicCatalog({
      campaign: params.campaign,
      seller: params.seller,
      category: params.category,
      q: params.q,
      sort: params.sort as "default" | "name" | "price_asc" | "price_desc" | undefined,
      page: requestedPage,
      limit: 8,
      archive: showClosed,
    }).then(
      (data) => ({ data, error: null }),
      () => ({ data: null, error: "Katalog belum dapat dimuat. Silakan coba lagi." }),
    ),
    getPublicTestimonials().catch(() => []),
  ]);
  const catalog = catalogResult.data;
  const hasFilter = Boolean(params.campaign || params.seller || params.category || params.q || (params.sort && params.sort !== "default"));
  const resetHref = showClosed ? "/catalog?status=closed#catalog" : "/catalog#catalog";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: publicSite.legalName,
    url: publicSite.url,
    email: publicSite.email,
    telephone: publicSite.phoneHref,
    address: publicSite.location,
    brand: { "@type": "Brand", name: publicSite.name },
  };

  return (
    <div className="rv-scope js is-loaded">
      <IconSprite />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <RevampHeader navLinks={NAV_LINKS} loggedIn={Boolean(session)} role={session?.role} />

      <main id="main">
        <div className="k-stage">
          {/* ===== Katalog hero ===== */}
          <section className="k-hero" id="top" aria-labelledby="k-title">
            <div className="k-hero__bg" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="k-hero__inner">
              <div className="k-hero__copy">
                <p className="k-hero__status"><span className="k-hero__dot" aria-hidden="true" />{showClosed ? "PO Ditutup" : "Sedang Dibuka"}</p>
                <h1 className="k-hero__title" id="k-title">Semua Batch PO</h1>
              </div>
              <div className="k-hero__side">
                <div className="k-tabs" role="tablist" aria-label="Status Batch PO" data-active={showClosed ? 1 : 0}>
                  <span className="k-tabs__indicator" aria-hidden="true" />
                  <Link href={statusHref(params, "open")} className="k-tabs__btn" role="tab" aria-selected={!showClosed}>Sedang Dibuka</Link>
                  <Link href={statusHref(params, "closed")} className="k-tabs__btn" role="tab" aria-selected={showClosed}>PO Ditutup</Link>
                </div>
                <p className="k-hero__desc">{showClosed ? "Koleksi Batch PO yang sudah ditutup — tetap bisa dilihat sebagai referensi, tapi belum bisa dimasukkan ke keranjang." : "Temukan produk dari Seller pilihan, cek kuota yang tersedia, lalu pilih Batch PO yang paling cocok untuk Anda."}</p>
              </div>
            </div>
          </section>

          {/* ===== Products ===== */}
          <section className="k-shop" aria-label="Daftar produk">
            <div className="k-shop__inner">
              <div className="k-toolbar">
                <div className="k-cats" role="group" aria-label="Kategori produk">
                  <Link href={categoryHref(params, null)} className="k-chip" aria-pressed={!params.category}>Semua Produk</Link>
                  {catalog?.filters.categories.map((category) => (
                    <Link key={category} href={categoryHref(params, category)} className="k-chip" aria-pressed={params.category === category}>
                      {category}
                    </Link>
                  ))}
                </div>
              </div>

              <form action="/catalog" method="get" className="k-filterform">
                <label>
                  Seller
                  <select name="seller" defaultValue={params.seller ?? ""}>
                    <option value="">Semua Seller</option>
                    {catalog?.filters.sellers.map((seller) => <option key={seller.slug} value={seller.slug}>{seller.label}</option>)}
                  </select>
                </label>
                <label>
                  Batch PO
                  <select name="campaign" defaultValue={params.campaign ?? ""}>
                    <option value="">Semua Batch PO</option>
                    {catalog?.filters.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.label}</option>)}
                  </select>
                </label>
                <input type="hidden" name="category" value={params.category ?? ""} />
                <input type="hidden" name="status" value={params.status ?? ""} />
                <label>
                  Urutkan
                  <select name="sort" defaultValue={params.sort ?? "default"}>
                    <option value="default">Rekomendasi</option>
                    <option value="name">Nama (A-Z)</option>
                    <option value="price_asc">Harga: Termurah</option>
                    <option value="price_desc">Harga: Termahal</option>
                  </select>
                </label>
                <label>
                  Cari produk
                  <input type="search" name="q" defaultValue={params.q ?? ""} maxLength={120} placeholder="Nama Batch PO atau produk" />
                </label>
                <button type="submit" className="btn btn--primary btn--sm"><span>Terapkan</span><span className="btn__icon"><Icon name="arrow" /></span></button>
                {hasFilter && <Link href={resetHref} className="k-filterform__reset">Reset filter</Link>}
              </form>

              <ToastFeedback error={catalogResult.error} />

              {catalog && !(session?.role === "BUYER") && (
                <aside className="k-alert" aria-labelledby="k-alert-title">
                  <span className="k-alert__icon"><Icon name="info" /></span>
                  <div className="k-alert__copy">
                    <p className="k-alert__title" id="k-alert-title">Masuk sebagai buyer, untuk pengalaman lebih nyaman</p>
                    <p className="k-alert__text">Kalau masuk sebagai Buyer, semua pesananmu terkumpul di satu tempat, jadi kamu tidak perlu mencari tautan pesanan satu per satu.</p>
                  </div>
                  <Link href="/account/login" className="btn btn--ghost btn--sm"><span>Masuk</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
                </aside>
              )}

              {!catalog ? (
                <div className="k-state k-state--error">
                  <span className="k-state__icon"><Icon name="signal-off" /></span>
                  <p className="k-state__title">Katalog belum bisa dimuat</p>
                  <p className="k-state__text">Sepertinya ada kendala koneksi atau server sedang sibuk. Coba muat ulang halaman ini sebentar lagi.</p>
                  <Link href="/catalog" className="btn btn--primary btn--sm"><span>Muat Ulang</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
                </div>
              ) : catalog.campaigns.length === 0 ? (
                <p className="k-empty">Belum ada produk yang cocok. Coba pilih kategori atau filter lain.</p>
              ) : (
                <div className="k-grid">
                  {catalog?.campaigns.flatMap((campaign) =>
                    campaign.variants.map((variant) => {
                      const detailHref = variant.productSlug ? `/store/${campaign.seller.slug}/produk/${variant.productSlug}?variant=${encodeURIComponent(variant.id)}` : `/po/${campaign.formToken}`;
                      return (
                        <article key={`${campaign.id}-${variant.id}`} className="pcard">
                          <div className="pcard__media">
                            {showClosed && <span className="pcard__tag">PO Ditutup</span>}
                            <ProductImage src={variant.gambarUrl} alt={variant.namaVarian} className="h-full w-full object-cover" />
                          </div>
                          <div className="pcard__body">
                            <p className="pcard__seller">{campaign.seller.businessName} · {campaign.namaProduk}</p>
                            <h3 className="pcard__name">{variant.namaVarian}</h3>
                            <div className="pcard__row">
                              <p className="pcard__price">{formatRupiah(variant.harga)}</p>
                              <span className={`pcard__meta${variant.sisa > 0 && variant.sisa <= 10 ? " pcard__meta--low" : ""}`}>
                                {variant.sisa > 0 ? `Sisa ${variant.sisa} pcs` : "Kuota habis"}
                              </span>
                            </div>
                            <div className="pcard__actions">
                              {showClosed ? (
                                <Link href={detailHref} className="pcard__buy">Detail Produk</Link>
                              ) : (
                                <>
                                  <Link href={detailHref} className="pcard__buy">Beli Produk</Link>
                                  <CatalogQuickAdd
                                    role={session?.role}
                                    detailHref={detailHref}
                                    event={{ salesEventId: campaign.id, eventTitle: campaign.namaProduk, formToken: campaign.formToken, sellerName: campaign.seller.businessName, endsAt: campaign.tanggalTutup }}
                                    item={{ variantId: variant.id, name: `${campaign.namaProduk} — ${variant.namaVarian}`, price: variant.harga, image: variant.gambarUrl, colors: variant.warna, quotaRemaining: variant.sisa }}
                                  />
                                </>
                              )}
                            </div>
                            <p className="pcard__date"><Icon name="calendar" />{PAYMENT_SCHEME_LABEL[campaign.paymentScheme]} · Tutup PO: {formatTanggal(campaign.tanggalTutup)}</p>
                          </div>
                        </article>
                      );
                    }),
                  )}
                </div>
              )}

              {catalog && catalog.meta.totalPages > 1 && (
                <nav className="k-pager" aria-label="Pagination katalog">
                  <Link
                    href={pageHref(params, Math.max(1, catalog.meta.page - 1))}
                    aria-disabled={catalog.meta.page <= 1}
                    className="k-page k-page--nav"
                  >
                    <Icon name="chev-left" />
                  </Link>
                  <div className="k-pager__nums">
                    <span className="k-page" aria-current="page">{catalog.meta.page}</span>
                    <span className="k-page k-page--gap">/ {catalog.meta.totalPages}</span>
                  </div>
                  <Link
                    href={pageHref(params, Math.min(catalog.meta.totalPages, catalog.meta.page + 1))}
                    aria-disabled={catalog.meta.page >= catalog.meta.totalPages}
                    className="k-page k-page--nav"
                  >
                    <Icon name="chev-right" />
                  </Link>
                </nav>
              )}
            </div>
          </section>
        </div>

        {testimonials.length > 0 && (
          <section className="section" aria-labelledby="k-testi-title">
            <header className="section-head">
              <p className="eyebrow">Cerita Buyer</p>
              <h2 className="h2" id="k-testi-title">Dipilih dari transaksi Serahin</h2>
            </header>
            <div className="k-grid" style={{ "--testi-cols": 3 } as React.CSSProperties}>
              {testimonials.slice(0, 6).map((item) => (
                <figure key={item.id} className="tcard is-focus">
                  <div className="tcard__quote">
                    <svg className="tcard__mark" aria-hidden="true"><use href="#i-quote" /></svg>
                    <blockquote><p>{item.quote}</p></blockquote>
                  </div>
                  <figcaption className="tcard__foot">
                    <span className="tcard__name">{item.customerName}</span>
                    {item.verified && <span className="tcard__role"><Icon name="check-circle" />Terverifikasi</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ===== FAQ ===== */}
        <section className="panel faq" id="faq" aria-labelledby="faq-title">
          <p className="eyebrow">Bantuan</p>
          <h2 className="h2" id="faq-title">Yang mungkin ingin<br /> kamu tanyakan</h2>
          <PublicFaq />
          <div className="k-help">
            <span className="k-help__icon"><Icon name="info" /></span>
            <div className="k-help__copy">
              <p className="k-help__title">Butuh bantuan lebih lanjut?</p>
              <p className="k-help__text">Jangan ragu untuk bertanya. Tim Serahin siap membantu memberikan informasi yang kamu butuhkan.</p>
            </div>
            <Link href="/contact" className="btn btn--ghost btn--sm"><span>Hubungi Kami</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="cta k-cta" aria-labelledby="k-cta-title">
          <div>
            <h2 className="h2 h2--left cta__title" id="k-cta-title">Giliranmu membuka PO</h2>
            <p className="lead">Punya produk atau ide koleksi? Buka kampanye PO-mu sendiri dan tampil di katalog ini, lengkap dengan kuota, pembayaran, dan progres produksi yang rapi.</p>
          </div>
          <div className="btn-row">
            <Link href="/seller/login" className="btn btn--primary"><span>Mulai Jualan</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
            <Link href="/#cara-kerja" className="btn btn--ghost"><span><span className="hide-sm">Lihat </span>Cara Kerja<span className="hide-sm">nya</span></span><span className="btn__icon"><Icon name="arrow" /></span></Link>
          </div>
        </section>

        <div className="k-band" aria-hidden="true" />
      </main>

      <RevampFooter />
    </div>
  );
}
