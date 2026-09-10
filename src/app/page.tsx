import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicFaq } from "@/components/PublicFaq";
import { PublicOrderForm } from "@/app/po/[token]/PublicOrderForm";
import { RichText } from "@/components/RichText";
import { getPublicCatalog } from "@/lib/public-catalog";
import { getSession } from "@/lib/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import { publicSite } from "@/lib/public-site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Serahin — Katalog Produk Pre-Order",
  description:
    "Jelajahi kampanye pre-order aktif, pilih produk, buat pesanan, dan bayar secara aman melalui Serahin.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Serahin",
    title: "Serahin — Katalog Produk Pre-Order",
    description:
      "Temukan produk pre-order aktif dan selesaikan pesanan dari satu tempat.",
    images: [{ url: "/icon.png", alt: "Logo Serahin" }],
  },
  twitter: {
    card: "summary",
    title: "Serahin — Katalog Produk Pre-Order",
    description: "Temukan produk pre-order aktif dan pesan dari satu tempat.",
    images: ["/icon.png"],
  },
};

type HomeSearchParams = {
  campaign?: string;
  category?: string;
  q?: string;
  page?: string;
};

function pageHref(params: HomeSearchParams, page: number) {
  const query = new URLSearchParams();
  if (params.campaign) query.set("campaign", params.campaign);
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
  const [session, catalogResult] = await Promise.all([
    getSession(),
    getPublicCatalog({
      campaign: params.campaign,
      category: params.category,
      q: params.q,
      page: requestedPage,
      limit: 24,
    }).then(
      (data) => ({ data, error: null }),
      () => ({ data: null, error: "Katalog belum dapat dimuat. Silakan coba lagi." }),
    ),
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
      <PublicHeader loggedIn={Boolean(session)} />
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
              Jelajahi seluruh kampanye pre-order yang sedang dibuka, pilih
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
                href="#cara-kerja"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-sand-700 ring-1 ring-sand-300 hover:bg-cream-soft"
              >
                Cara Pemesanan
              </Link>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
              Cara kerja
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-sand-900">
              Dari katalog sampai pesanan dipantau
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Pilih kampanye", "Cari produk atau fokuskan katalog ke satu kampanye PO yang sedang aktif."],
              ["2", "Pesan dan bayar", "Pilih varian dari satu kampanye, isi data dengan benar, lalu gunakan kanal pembayaran yang tersedia."],
              ["3", "Pantau progres", "Simpan tautan portal pesanan untuk melihat verifikasi pembayaran, produksi, dan pengiriman."],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-300 text-sm font-extrabold text-sand-900">
                  {number}
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-sand-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-sand-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
                Sedang dibuka
              </p>
              <h2 className="mt-1 text-3xl font-extrabold text-sand-900">
                Semua kampanye pre-order
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
            className="mt-7 grid gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-end"
          >
            <label className="block text-sm font-bold text-sand-700">
              Kampanye
              <select
                name="campaign"
                defaultValue={params.campaign ?? ""}
                className="mt-1.5 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm font-medium"
              >
                <option value="">Semua Kampanye</option>
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
                placeholder="Nama kampanye atau produk"
                className="mt-1.5 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm"
              />
            </label>
            <button className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700">
              Terapkan
            </button>
          </form>

          {(params.campaign || params.category || params.q) && (
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
                Belum ada kampanye aktif untuk pilihan ini. Coba reset filter
                atau hubungi kami bila Anda membutuhkan bantuan.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-12">
            {catalog?.campaigns.map((campaign) => {
              const prices = campaign.variants.map((variant) => variant.harga);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const priceLabel =
                min === max
                  ? formatRupiah(min)
                  : `${formatRupiah(min)} – ${formatRupiah(max)}`;
              const soldOut = campaign.variants.every((variant) => variant.sisa <= 0);

              return (
                <article key={campaign.id} id={`campaign-${campaign.id}`} className="scroll-mt-24">
                  <div className="mb-5 rounded-3xl border border-brand-200 bg-cream-soft p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                            Pre-Order
                          </span>
                          {soldOut && (
                            <span className="rounded-full bg-sand-200 px-3 py-1 text-xs font-extrabold text-sand-700">
                              Stok Habis
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 text-2xl font-extrabold text-sand-900 sm:text-3xl">
                          {campaign.namaProduk}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-brand-700">
                          {priceLabel} · {PAYMENT_SCHEME_LABEL[campaign.paymentScheme]} · Tutup {formatTanggal(campaign.tanggalTutup)}
                        </p>
                        {campaign.deskripsi && (
                          <RichText html={campaign.deskripsi} className="mt-4 line-clamp-4" />
                        )}
                      </div>
                      <Link
                        href={`/po/${campaign.formToken}`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-brand-300 bg-white px-4 text-sm font-extrabold text-brand-700 hover:bg-brand-50"
                      >
                        Buka katalog khusus
                      </Link>
                    </div>
                  </div>
                  <PublicOrderForm
                    formToken={campaign.formToken}
                    variants={campaign.variants}
                    gatewayEnabled={campaign.gatewayEnabled}
                    orderingDisabled={soldOut}
                    unavailableMessage={soldOut ? "Semua varian pada kampanye ini sudah habis." : undefined}
                    checkoutSource="HOME_CATALOG"
                    idPrefix={`home-${campaign.id}`}
                  />
                </article>
              );
            })}
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
