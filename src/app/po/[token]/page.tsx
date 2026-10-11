import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatWaktu } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import type { PaymentScheme } from "@/lib/types";
import { RichText } from "@/components/RichText";
import { PublicFaq } from "@/components/PublicFaq";
import { isRichTextEmpty } from "@/lib/sanitize";
import { IconSprite, Icon } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";
import { PublicOrderForm } from "./PublicOrderForm";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Pre-Order — Serahin",
  robots: { index: false, follow: false },
};

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#testimonial", label: "Testimonial" },
  { href: "/#faq", label: "FAQ" },
];

type FormInfo = {
  id: string;
  namaProduk: string;
  deskripsi: string | null;
  harga: number;
  paymentScheme: PaymentScheme;
  dpTipe: "PERSEN" | "NOMINAL";
  dpPercent: number | null;
  dpNominal: number | null;
  tanggalTutup: string | null;
  bukaPesanan: boolean;
  gatewayEnabled?: boolean;
  manualTransferEnabled?: boolean;
  manualTransfer?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  } | null;
  manualTransfers?: {
    id: string;
    accountType: "BANK" | "EWALLET";
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    isPrimary: boolean;
  }[];
  linkCheckoutShopee?: string | null;
  nominalCheckoutShopee?: number | null;
  variants: {
    id: string;
    namaVarian: string;
    sisa: number;
    harga: number;
    gambarUrl: string | null;
    images: string[];
    warna: string[];
    kategori: string;
    label: string | null;
    ukuran: string | null;
    material: string | null;
    sku: string | null;
    deskripsi: string | null;
    // DP kustom Produk (v2.3.7 §3.18) — null berarti ikuti DP Batch PO
    // (dpTipe/dpPercent/dpNominal di level campaign di atas).
    dpTipe: "PERSEN" | "NOMINAL" | null;
    dpPercent: number | null;
    dpNominal: number | null;
    terjual?: number;
  }[];
};

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { token } = await params;
  const { checkout } = await searchParams;
  const session = await getSession();
  const buyerProfile = session?.role === "BUYER"
    ? await api.get<{ name: string; email: string | null; phone: string | null }>("/auth/buyer/profile").catch(() => ({ name: session.name, email: session.email, phone: null }))
    : null;

  let data: FormInfo;
  try {
    data = await api.get<FormInfo>(`/public/form/${token}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const adaSisa = data.variants.some((v) => v.sisa > 0);
  const hargaVarian = data.variants.map((v) => v.harga);
  const hargaTerendah = Math.min(...hargaVarian);
  const hargaTertinggi = Math.max(...hargaVarian);
  const labelHarga =
    hargaVarian.length === 0
      ? formatRupiah(data.harga)
      : hargaTerendah === hargaTertinggi
        ? formatRupiah(hargaTerendah)
        : `${formatRupiah(hargaTerendah)} – ${formatRupiah(hargaTertinggi)}`;
  const alasanTidakBisaPesan = !data.bukaPesanan
    ? "Maaf, formulir pesanan untuk Batch PO ini sedang tidak aktif."
    : !adaSisa
      ? "Semua varian sudah habis kuotanya."
      : undefined;

  return (
    <div className="bg-cream-soft min-h-full">
      <IconSprite />

      {/* Header pakai chrome revamp (sama dengan /catalog). PublicOrderForm
          di bawah SENGAJA ada di LUAR .rv-scope — form itu 1000+ baris
          interaktif (stepper qty, modal warna, metode bayar/kirim, upload
          bukti) yang semuanya styling-nya Tailwind murni lewat komponen
          @/components/ui (Button/Field/Input/Select — sudah pill/rounded
          konsisten tema revamp sejak token-only pass dashboard). Bila
          dibungkus .rv-scope, reset `.rv-scope button{background:none}` di
          revamp.css (unlayered, selalu menang atas utility Tailwind
          ber-@layer) akan menghapus bg semua tombol polos di form ini —
          bug yang sama persis dengan yang baru diperbaiki di
          AuthForm/SellerAuthForm. IconSprite di atas tetap berlaku untuk
          <Icon> di luar .rv-scope karena <use href="#i-..."> SVG resolve ID
          di seluruh dokumen, tidak terikat ancestor. */}
      <div className="rv-scope js is-loaded">
        <RevampHeader navLinks={NAV_LINKS} loggedIn={Boolean(session)} role={session?.role} />
        <section className="po-hero" aria-labelledby="po-title">
          <div className="po-hero__inner">
            <p className="po-hero__status"><span className="k-hero__dot" aria-hidden="true" />Katalog Pre-Order</p>
            <h1 className="po-hero__title" id="po-title">{data.namaProduk}</h1>
            <p className="po-hero__price">
              <strong>{labelHarga}</strong> <span>· {PAYMENT_SCHEME_LABEL[data.paymentScheme]}</span>
            </p>
            {data.tanggalTutup && (
              <p className="po-hero__deadline">
                <Icon name="calendar" />
                PO ditutup {formatWaktu(data.tanggalTutup)}
              </p>
            )}
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-6xl space-y-7 px-4 pb-10 pt-7 sm:px-6 sm:pt-10">
        {data.deskripsi && !isRichTextEmpty(data.deskripsi) && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
            <RichText html={data.deskripsi} />
          </div>
        )}

        <PublicOrderForm
          formToken={token}
          variants={data.variants}
          gatewayEnabled={Boolean(data.gatewayEnabled)}
          manualTransferEnabled={Boolean(data.manualTransferEnabled)}
          manualTransfer={data.manualTransfer}
          manualTransfers={data.manualTransfers}
          linkCheckoutShopee={data.linkCheckoutShopee}
          nominalCheckoutShopee={data.nominalCheckoutShopee}
          paymentScheme={data.paymentScheme}
          dpTipe={data.dpTipe}
          dpPercent={data.dpPercent}
          dpNominal={data.dpNominal}
          orderingDisabled={Boolean(alasanTidakBisaPesan)}
          unavailableMessage={alasanTidakBisaPesan}
          buyerAuthenticated={session?.role === "BUYER"}
          switchingAccount={Boolean(session && session.role !== "BUYER")}
          buyerProfile={buyerProfile}
          resumeCheckout={checkout === "1"}
        />

        <p className="mx-auto max-w-xl text-center text-xs text-sand-500">
          Pesanan Anda akan diverifikasi Admin terlebih dahulu. Setelah kirim,
          Anda akan mendapat link untuk memantau status pesanan.
        </p>

        <PublicFaq campaignId={data.id} />
      </main>

      <div className="rv-scope js is-loaded">
        <RevampFooter />
      </div>
    </div>
  );
}
