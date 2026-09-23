import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { ProductImage } from "@/components/ProductImage";
import { getPublicCatalog } from "@/lib/public-catalog";
import { getSession } from "@/lib/session";
import { getBuyerAvatarUrl } from "@/lib/buyer-avatar";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Arsip Close PO",
  description: "Lihat koleksi Batch PO Serahin yang telah ditutup.",
  alternates: { canonical: "/arsip" },
};

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 8;
  const [catalog, session] = await Promise.all([
    getPublicCatalog({ archive: true, page, limit }),
    getSession(),
  ]);
  const avatarUrl = await getBuyerAvatarUrl(session);
  const items = catalog.campaigns.flatMap((campaign) =>
    campaign.variants.map((variant) => ({ campaign, variant })),
  );

  return (
    <div className="bg-serahin-dots min-h-full">
      <PublicHeader loggedIn={Boolean(session)} role={session?.role} name={session?.name} email={session?.email} avatarUrl={avatarUrl} />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">
          Close PO
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-sand-900">
          Arsip produk Serahin
        </h1>
        <p className="mt-3 max-w-2xl text-sand-600">
          Koleksi ini tetap dapat dilihat sebagai referensi. Produk arsip tidak
          dapat dimasukkan ke keranjang sampai Batch PO baru dibuka.
        </p>

        {catalog.meta.total === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-sand-300 bg-white p-12 text-center text-sand-600">
            Belum ada produk arsip.
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {items.map(({ campaign, variant }) => (
                <article
                  key={`${campaign.id}-${variant.id}`}
                  className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-square bg-sand-100">
                    <ProductImage
                      src={variant.gambarUrl}
                      alt={variant.namaVarian}
                      className="h-full w-full object-cover grayscale-[15%]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-sand-900/85 px-3 py-1 text-xs font-extrabold text-white">
                      Close PO
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-extrabold text-sand-900">
                      {variant.namaVarian}
                    </h2>
                    <p className="mt-1 text-sm font-extrabold text-brand-700">
                      {formatRupiah(variant.harga)}
                    </p>
                    <p className="mt-1 text-xs text-sand-500">
                      {campaign.seller.businessName} · ditutup {formatTanggal(campaign.tanggalTutup)}
                    </p>
                    <Link
                      href={
                        variant.productSlug
                          ? `/s/${campaign.seller.slug}/produk/${variant.productSlug}?variant=${encodeURIComponent(variant.id)}`
                          : `/po/${campaign.formToken}`
                      }
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-600 px-3 text-sm font-extrabold text-brand-700"
                    >
                      Lihat Arsip
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {catalog.meta.totalPages > 1 && (
              <nav
                aria-label="Navigasi halaman arsip"
                className="mt-8 flex items-center justify-center gap-3 text-sm font-bold"
              >
                {page > 1 ? (
                  <Link
                    href={`/arsip?page=${page - 1}`}
                    className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-sand-700 hover:border-brand-300"
                  >
                    ← Lebih baru
                  </Link>
                ) : (
                  <span />
                )}
                <span className="rounded-xl bg-brand-50 px-4 py-2 text-brand-700">
                  Halaman {page} dari {catalog.meta.totalPages}
                </span>
                {page < catalog.meta.totalPages ? (
                  <Link
                    href={`/arsip?page=${page + 1}`}
                    className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-sand-700 hover:border-brand-300"
                  >
                    Lebih lama →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
