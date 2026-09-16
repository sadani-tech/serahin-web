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
  title: "Serahin — Katalog Produk Pre-Order",
  description:
    "Jelajahi Batch PO aktif, pilih produk, buat pesanan, dan bayar secara aman melalui Serahin.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // Gambar preview diambil otomatis dari `src/app/opengraph-image.tsx` &
  // `twitter-image.tsx` (kartu 1200x630). Jangan set `images` di sini.
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Serahin",
    title: "Serahin — Katalog Produk Pre-Order",
    description:
      "Temukan produk pre-order aktif dan selesaikan pesanan dari satu tempat.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Serahin — Katalog Produk Pre-Order",
    description: "Temukan produk pre-order aktif dan pesan dari satu tempat.",
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
  return value ? `/?${value}#catalog` : "/#catalog";
}

export default async function HomePage({
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
      <PublicHeader loggedIn={Boolean(session)} role={session?.role} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <main>
        <section className="bg-serahin-sunburst relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-5xl text-center">
            <span className="inline-flex rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700 ring-1 ring-brand-200">
              Katalog Pre-Order Serahin
            </span>
            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-sand-900 sm:text-6xl">
              Temukan produk pilihan, pesan dalam satu alur yang jelas.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-sand-600 sm:text-lg">
              Jelajahi seluruh Batch PO yang sedang dibuka, pilih
              produk, lakukan pembayaran, lalu pantau progres pesanan Anda dari
              satu tautan pribadi.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="#catalog"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-extrabold text-white shadow-brand hover:bg-brand-700"
              >
                Jelajahi Katalog
              </Link>
              <Link
                href="#faq"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-sand-700 ring-1 ring-sand-300 hover:bg-cream-soft"
              >
                Pertanyaan Umum
              </Link>
            </div>
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
                Sedang dibuka
              </p>
              <h2 className="mt-1 text-3xl font-extrabold text-sand-900">
                Semua Batch PO
              </h2>
            </div>
            {catalog && (
              <p className="text-sm font-bold text-sand-500">
                {catalog.meta.total} produk ditemukan
              </p>
            )}
          </div>

          <form
            action="/"
            method="get"
            className="mt-7 grid gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr_auto] lg:items-end"
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
            <button className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700">
              Terapkan
            </button>
          </form>

          {(params.campaign || params.seller || params.category || params.q) && (
            <div className="mt-3 text-right">
              <Link href="/#catalog" className="text-sm font-bold text-brand-700 hover:underline">
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
                <article key={`${campaign.id}-${variant.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
                  <div className="aspect-square bg-sand-100">
                    <ProductImage src={variant.gambarUrl} alt={variant.namaVarian} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <Link href={`/katalog/${toPublicSlug(variant.kategori ?? "Others")}`} className="rounded-full bg-brand-100 px-2.5 py-1 text-brand-800 hover:bg-brand-200">{variant.kategori}</Link>
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
