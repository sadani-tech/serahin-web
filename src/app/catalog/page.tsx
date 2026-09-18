import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicFaq } from "@/components/PublicFaq";
import { ProductImage } from "@/components/ProductImage";
import { getPublicCatalog, getPublicTestimonials } from "@/lib/public-catalog";
import { getSession } from "@/lib/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import { publicSite } from "@/lib/public-site";
import { toPublicSlug } from "@/lib/slug";

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
  page?: string;
};

function pageHref(params: HomeSearchParams, page: number) {
  const query = new URLSearchParams();
  if (params.campaign) query.set("campaign", params.campaign);
  if (params.seller) query.set("seller", params.seller);
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);
  if (page > 1) query.set("page", String(page));
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
  const [session, catalogResult, testimonials] = await Promise.all([
    getSession(),
    getPublicCatalog({
      campaign: params.campaign,
      seller: params.seller,
      category: params.category,
      q: params.q,
      page: requestedPage,
      limit: 8,
    }).then(
      (data) => ({ data, error: null }),
      () => ({ data: null, error: "Katalog belum dapat dimuat. Silakan coba lagi." }),
    ),
    getPublicTestimonials().catch(() => []),
  ]);
  const catalog = catalogResult.data;

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
    <div className="bg-serahin-dots min-h-full">
      <PublicHeader loggedIn={Boolean(session)} role={session?.role} name={session?.name} email={session?.email} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <main>
        <section id="catalog" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14">
          <div className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-6 py-7 text-white shadow-[0_20px_55px_rgba(34,67,36,.18)] sm:px-8 sm:py-9">
            <div aria-hidden="true" className="absolute -right-12 -top-20 h-56 w-56 rounded-full border border-sun-300/30" />
            <div aria-hidden="true" className="absolute -right-4 -top-10 h-40 w-40 rounded-full border border-sun-300/25" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-brand-100">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-sun-400" /> Sedang dibuka
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Semua Batch PO</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-100 sm:text-base">Temukan produk dari Seller pilihan, cek kuota yang tersedia, lalu pilih Batch PO yang paling cocok untuk Anda.</p>
              </div>
              {catalog && (
                <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                  <strong className="text-3xl font-extrabold text-sun-300">{catalog.meta.total}</strong>
                  <span className="text-xs font-bold leading-4 text-brand-50">produk<br/>ditemukan</span>
                </div>
              )}
            </div>
          </div>

          <form
            action="/catalog"
            method="get"
            className="mt-7 grid gap-4 rounded-3xl border border-brand-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(38,76,39,.09)] md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr_auto] lg:items-end"
          >
            <label className="block text-sm font-bold text-sand-700">
              Seller
              <select name="seller" defaultValue={params.seller ?? ""} className="mt-1.5 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm font-medium">
                <option value="">Semua Seller</option>
                {catalog?.filters.sellers.map((seller) => <option key={seller.slug} value={seller.slug}>{seller.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-sand-700">
              Batch PO
              <select
                name="campaign"
                defaultValue={params.campaign ?? ""}
                className="mt-1.5 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm font-medium"
              >
                <option value="">Semua Batch PO</option>
                {catalog?.filters.campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-sand-700">
              Kategori
              <select
                name="category"
                defaultValue={params.category ?? ""}
                className="mt-1.5 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm font-medium"
              >
                <option value="">Semua Kategori</option>
                {catalog?.filters.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-sand-700">
              Cari produk
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                maxLength={120}
                placeholder="Nama Batch PO atau produk"
                className="mt-1.5 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm"
              />
            </label>
            <button className="min-h-11 rounded-xl bg-accent-600 px-5 text-sm font-extrabold text-white shadow-sm hover:bg-accent-700">
              Terapkan
            </button>
          </form>

          {(params.campaign || params.seller || params.category || params.q) && (
            <div className="mt-3 text-right">
              <Link href="/catalog#catalog" className="text-sm font-bold text-brand-700 hover:underline">
                Reset semua filter
              </Link>
            </div>
          )}

          {catalogResult.error && (
            <div role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-bold text-rose-700">
              {catalogResult.error}
            </div>
          )}

          {catalog && catalog.campaigns.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-sand-300 bg-white px-6 py-14 text-center">
              <h3 className="text-xl font-extrabold text-sand-900">Belum ada produk yang cocok</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-sand-500">
                Belum ada Batch PO aktif untuk pilihan ini. Coba reset filter
                atau hubungi kami bila Anda membutuhkan bantuan.
              </p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {catalog?.campaigns.flatMap((campaign) =>
              campaign.variants.map((variant) => (
                <article key={`${campaign.id}-${variant.id}`} className="group flex flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_45px_rgba(38,76,39,.12)]">
                  <div className="relative aspect-square overflow-hidden bg-sand-100">
                    <ProductImage src={variant.gambarUrl} alt={variant.namaVarian} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-brand-800 shadow-sm backdrop-blur">Open PO</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <Link href={ `/catalog/${toPublicSlug(variant.kategori ?? "Others")}`} className="rounded-full bg-brand-100 px-2.5 py-1 text-brand-800 hover:bg-brand-200">{variant.kategori}</Link>
                      <span className={`rounded-full px-2.5 py-1 ${variant.sisa > 0 ? "bg-sun-100 text-sun-800" : "bg-sand-200 text-sand-600"}`}>
                        {variant.sisa > 0 ? `Kuota ${variant.sisa}` : "Kuota habis"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-extrabold text-sand-900">{variant.namaVarian}</h3>
                    <p className="mt-1 text-xs font-bold text-sand-500">{campaign.seller.businessName} · {campaign.namaProduk}</p>
                    <p className="mt-1 text-lg font-extrabold text-brand-700">{formatRupiah(variant.harga)}</p>
                    <p className="mt-2 text-xs font-bold text-sand-500">
                      {PAYMENT_SCHEME_LABEL[campaign.paymentScheme]} · tutup {formatTanggal(campaign.tanggalTutup)}
                    </p>
                    <Link
                      href={variant.productSlug ? `/s/${campaign.seller.slug}/produk/${variant.productSlug}?variant=${encodeURIComponent(variant.id)}` : `/po/${campaign.formToken}`}
                      aria-disabled={variant.sisa <= 0}
                      aria-label={`Lihat dan pesan dari ${campaign.namaProduk}`}
                      className={`mt-5 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-3 text-center text-xs font-extrabold sm:text-sm ${variant.sisa > 0 ? "bg-brand-600 text-white hover:bg-brand-700" : "pointer-events-none bg-sand-200 text-sand-500"}`}
                    >
                      {variant.sisa > 0 ? "Lihat Produk" : "Kuota habis"}
                    </Link>
                  </div>
                </article>
              )),
            )}
          </div>

          {catalog && catalog.meta.totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination katalog global">
              <Link
                aria-disabled={catalog.meta.page <= 1}
                href={pageHref(params, Math.max(1, catalog.meta.page - 1))}
                className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold ${
                  catalog.meta.page <= 1
                    ? "pointer-events-none border-sand-200 text-sand-300"
                    : "border-sand-300 bg-white text-sand-700 hover:border-brand-400"
                }`}
              >
                Sebelumnya
              </Link>
              <span className="text-sm font-extrabold text-sand-600">
                {catalog.meta.page} / {catalog.meta.totalPages}
              </span>
              <Link
                aria-disabled={catalog.meta.page >= catalog.meta.totalPages}
                href={pageHref(params, Math.min(catalog.meta.totalPages, catalog.meta.page + 1))}
                className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold ${
                  catalog.meta.page >= catalog.meta.totalPages
                    ? "pointer-events-none border-sand-200 text-sand-300"
                    : "border-sand-300 bg-white text-sand-700 hover:border-brand-400"
                }`}
              >
                Berikutnya
              </Link>
            </nav>
          )}
        </section>

        {testimonials.length > 0 && <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="text-center"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand-700">Cerita Buyer</p><h2 className="mt-2 text-3xl font-extrabold text-sand-900">Dipilih dari transaksi Serahin</h2></div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">{testimonials.slice(0, 6).map((item) => <figure key={item.id} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm"><div className="text-sun-600" aria-label={item.rating ? `${item.rating} dari 5 bintang` : undefined}>{item.rating ? "★".repeat(item.rating) : ""}</div><blockquote className="mt-3 text-sm leading-6 text-sand-700">“{item.quote}”</blockquote><figcaption className="mt-4 text-sm font-extrabold text-sand-900">{item.customerName} {item.verified && <span className="ml-1 rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-800">Pembelian terverifikasi</span>}</figcaption></figure>)}</div>
        </section>}

        <section id="faq" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-10 sm:px-6">
          <div className="mb-5 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
              Bantuan
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-sand-900">
              Pertanyaan yang sering diajukan
            </h2>
          </div>
          <PublicFaq />
          <p className="mt-5 text-center text-sm text-sand-600">
            Belum menemukan jawaban?{" "}
            <Link href="/contact" className="font-extrabold text-brand-700 hover:underline">
              Hubungi dukungan Serahin
            </Link>
            .
          </p>
        </section>

        <section className="bg-brand-800 px-4 py-12 text-brand-50 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Transaksi yang transparan sejak awal</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-100">
                Harga, skema pembayaran, deadline PO, dan progres pesanan ditampilkan dengan jelas.
                Pembayaran online diproses melalui penyedia payment gateway; Serahin tidak meminta PIN atau OTP perbankan Anda.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/terms" className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-800">Syarat & Ketentuan</Link>
              <Link href="/contact" className="rounded-xl border border-brand-400 px-4 py-3 text-sm font-extrabold text-white">Hubungi Kami</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
