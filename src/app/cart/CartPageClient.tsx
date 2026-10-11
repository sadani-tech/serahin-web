"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { ToastFeedback } from "@/components/Toast";
import { BuyerAccessModal } from "@/components/BuyerAccessModal";
import { Select } from "@/components/ui";
import { formatRupiah, formatTanggal } from "@/lib/format";

export function CartPageClient({ resumeCheckout = false, switchingAccount = false, buyerProfile }: {
  resumeCheckout?: boolean;
  switchingAccount?: boolean;
  buyerProfile?: { name: string; email: string | null; phone: string | null } | null;
}) {
  const router = useRouter();
  const { cart, ready, authenticated, syncConflict, setQuantity, setColor, removeItem, clear, sync } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"GATEWAY" | "MANUAL">("GATEWAY");
  const [gatewayMethod, setGatewayMethod] = useState("");
  const [gatewayMethods, setGatewayMethods] = useState<Array<{ code: string; name: string; fee?: number; imageUrl?: string }>>([]);
  const [gatewayAvailable, setGatewayAvailable] = useState(false);
  const [manualTransferEnabled, setManualTransferEnabled] = useState(true);
  const [manualTransfer, setManualTransfer] = useState<{
    id: string;
    accountType: "BANK" | "EWALLET";
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  } | null>(null);
  const [manualTransfers, setManualTransfers] = useState<Array<{
    id: string;
    accountType: "BANK" | "EWALLET";
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    isPrimary: boolean;
  }>>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentBilling, setPaymentBilling] = useState<{
    billingType: "DOWN_PAYMENT" | "FULL_PAYMENT";
    downPaymentType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
    downPaymentPercentage: number | null;
    downPaymentAmount: number | null;
    totalQuantity: number;
  } | null>(null);
  const [accepted, setAccepted] = useState(false);
  // WhatsApp belum terintegrasi — consent dikunci false sampai fitur tersedia.
  const whatsapp = false;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showAccessModal, setShowAccessModal] = useState(false);
  const checkoutPanel = useRef<HTMLElement>(null);
  const checkoutKey = useRef<string>("");
  const checkoutCartId = useRef<string>("");
  const total = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  const selectedGatewayMethod = gatewayMethods.find((method) => method.code === gatewayMethod);

  useEffect(() => {
    if (!authenticated || !cart) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/cart/payment-methods").catch(() => null);
      if (!response?.ok) return;
      try {
        const data = await response.json() as {
          amount: number;
          gatewayEnabled: boolean;
          manualTransferEnabled: boolean;
          manualTransfer: {
            id: string;
            accountType: "BANK" | "EWALLET";
            bankName: string;
            accountNumber: string;
            accountHolderName: string;
          } | null;
          manualTransfers: Array<{
            id: string;
            accountType: "BANK" | "EWALLET";
            bankName: string;
            accountNumber: string;
            accountHolderName: string;
            isPrimary: boolean;
          }>;
          methods: Array<{ code: string; name: string; fee?: number; imageUrl?: string }>;
          billingType: "DOWN_PAYMENT" | "FULL_PAYMENT";
          downPaymentType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
          downPaymentPercentage: number | null;
          downPaymentAmount: number | null;
          totalQuantity: number;
        };
        setPaymentAmount(data.amount);
        setPaymentBilling(data);
        const gatewayUsable = data.gatewayEnabled && data.methods.length > 0;
        setGatewayMethods(data.methods);
        setGatewayAvailable(gatewayUsable);
        setManualTransferEnabled(data.manualTransferEnabled);
        setManualTransfer(data.manualTransfer);
        setManualTransfers(data.manualTransfers ?? []);
        setSelectedBankAccountId((current) =>
          data.manualTransfers?.some((account) => account.id === current)
            ? current
            : data.manualTransfer?.id ?? "",
        );
        setGatewayMethod((current) =>
          data.methods.some((method) => method.code === current)
            ? current
            : data.methods[0]?.code || "",
        );
        setPaymentMethod((current) => {
          if (current === "MANUAL" && !data.manualTransferEnabled) return "GATEWAY";
          if (current === "GATEWAY" && !gatewayUsable && data.manualTransferEnabled) return "MANUAL";
          return current;
        });
      } catch {
        setError("Metode pembayaran belum dapat dimuat. Silakan coba lagi.");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authenticated, cart]);

  useEffect(() => {
    if (!authenticated || !resumeCheckout || !cart) return;
    const timer = window.setTimeout(() => checkoutPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => window.clearTimeout(timer);
  }, [authenticated, cart, resumeCheckout]);

  async function checkout() {
    if (!cart) return;
    if (!authenticated) {
      setShowAccessModal(true);
      return;
    }
    if (!accepted) {
      setError("Setujui kebijakan Serahin untuk membuat pesanan.");
      return;
    }
    setPending(true); setError("");
    try {
      if (syncConflict) throw new Error("Pilih keranjang yang ingin digunakan sebelum checkout.");
      await sync();
      const keyStorage = `serahin:cart:checkout-key:${cart.salesEventId}`;
      if (checkoutCartId.current !== cart.salesEventId) {
        checkoutCartId.current = cart.salesEventId;
        checkoutKey.current = sessionStorage.getItem(keyStorage) ?? "";
      }
      if (!checkoutKey.current) {
        checkoutKey.current = crypto.randomUUID();
        sessionStorage.setItem(keyStorage, checkoutKey.current);
      }
      const response = await fetch("/api/cart/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutKey: checkoutKey.current, paymentMethod, paymentMethodCode: paymentMethod === "GATEWAY" ? gatewayMethod || undefined : undefined, selectedBankAccountId: paymentMethod === "MANUAL" ? selectedBankAccountId || undefined : undefined, acceptPolicies: accepted, whatsappConsent: whatsapp }),
      });
      const data = await response.json().catch(() => ({ message: "Respons server tidak valid. Silakan coba lagi." })) as { message?: string; paymentUrl?: string | null; tokenAkses?: string; needsConfirm?: boolean; warning?: string };
      if (response.status === 401 || response.status === 403) {
        setPending(false);
        setShowAccessModal(true);
        return;
      }
      if (!response.ok) throw new Error(data.message ?? "Checkout belum berhasil.");
      if (data.needsConfirm) throw new Error(data.warning ?? "Pesanan serupa baru saja dibuat.");
      sessionStorage.removeItem(keyStorage);
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else if (data.tokenAkses) router.push(`/portal/${data.tokenAkses}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout belum berhasil.");
      setPending(false);
    }
  }

  if (!ready) return <div className="cart-page"><p className="cart-page__loading">Memuat keranjang…</p></div>;
  if (!cart) return <div className="cart-page"><div className="cart-page__empty">
    <h1>Keranjang masih kosong</h1>
    <p>Pilih produk dari Batch PO aktif untuk mulai memesan.</p>
    <Link href="/catalog" className="btn btn--primary btn--sm"><span>Jelajahi katalog</span><span className="btn__icon"><svg className="icon" aria-hidden="true"><use href="#i-arrow" /></svg></span></Link>
  </div></div>;

  return <div className="cart-page"><div className="cart-page__layout">
    <section>
      <div className="cart-page__head">
        <div>
          <p className="cart-page__eyebrow">{cart.sellerName}</p>
          <h1 className="cart-page__title">Keranjang</h1>
          <p className="cart-page__meta">{cart.eventTitle} · tutup {formatTanggal(cart.endsAt)}</p>
        </div>
        <button type="button" onClick={clear} className="cart-page__clear">Kosongkan</button>
      </div>

      {syncConflict && (
        <div className="cart-page__conflict">
          <strong>Keranjang akun berbeda dari keranjang perangkat ini.</strong>
          <p>Pilih isi keranjang yang ingin digunakan. Tidak ada pesanan yang terhapus.</p>
          <div className="cart-page__conflict-actions">
            <button type="button" onClick={() => void sync("KEEP_REMOTE")} className="cart-page__pill-btn">Gunakan keranjang tersimpan</button>
            <button type="button" onClick={() => void sync("REPLACE_WITH_LOCAL")} className="cart-page__pill-btn cart-page__pill-btn--primary">Gunakan keranjang perangkat</button>
          </div>
        </div>
      )}

      <div className="cart-page__items">{cart.items.map((item) => (
        <article key={`${item.variantId}:${item.selectedColor ?? ""}`} className="cart-page__item">
          <div className="cart-page__item-media"><ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>
          <div className="cart-page__item-body">
            <h2 className="cart-page__item-name">{item.name}</h2>
            {item.colors?.length ? (
              <label className="cart-page__item-color">
                Warna
                <Select value={item.selectedColor ?? ""} onChange={(event) => setColor(item.variantId, item.selectedColor, event.target.value)} className="ml-2 min-h-9 text-sm">
                  <option value="" disabled>Pilih warna</option>
                  {item.colors.map((color) => <option key={color} value={color}>{color}</option>)}
                </Select>
              </label>
            ) : item.selectedColor ? (
              <p className="cart-page__item-color-text">Warna: {item.selectedColor}</p>
            ) : null}
            <p className="cart-page__item-price">{formatRupiah(item.price)}</p>
            {item.invalidReason && <p className="cart-page__item-warn">{item.invalidReason}</p>}
            <div className="cart-page__item-row">
              <button type="button" onClick={() => setQuantity(item.variantId, item.selectedColor, item.quantity - 1)} className="cart-page__qty-btn" aria-label="Kurangi jumlah">−</button>
              <span className="cart-page__qty-value">{item.quantity}</span>
              <button type="button" onClick={() => setQuantity(item.variantId, item.selectedColor, item.quantity + 1)} className="cart-page__qty-btn" aria-label="Tambah jumlah">+</button>
              <button type="button" onClick={() => removeItem(item.variantId, item.selectedColor)} className="cart-page__item-remove">Hapus</button>
            </div>
          </div>
        </article>
      ))}</div>
    </section>

    <aside ref={checkoutPanel} className="cart-page__summary scroll-mt-24">
      <p className="cart-page__eyebrow">Checkout</p>
      <h2 className="cart-page__title" style={{ fontSize: "1.3rem" }}>Konfirmasi dan bayar</h2>
      <p className="cart-page__meta" style={{ fontWeight: 500 }}>Keranjang ini langsung menjadi pesanan. Tidak ada form produk tambahan setelah halaman ini.</p>
      <div className="cart-page__summary-total"><span>Total produk</span><strong>{formatRupiah(total)}</strong></div>

      {authenticated && buyerProfile ? (
        <div className="cart-page__buyer">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong>Data Buyer</strong>
              <p className="mt-1 text-xs leading-5">{buyerProfile.name}<br />{buyerProfile.email ?? "Email belum tersedia"}{buyerProfile.phone ? ` · ${buyerProfile.phone}` : ""}</p>
            </div>
            <Link href="/account/profile?callbackUrl=%2Fcart%3Fcheckout%3D1" className="whitespace-nowrap">Ubah</Link>
          </div>
        </div>
      ) : (
        <div className="cart-page__guest">Masuk baru diperlukan saat kamu siap membuat pesanan. Isi keranjang tetap tersimpan.</div>
      )}

      {/* iOS: label onClick + preventDefault + input pointer-events-none —
          beberapa in-app browser (WebView WhatsApp dkk) tidak meneruskan tap
          pada <label> ke <input> anaknya lewat forwarding native, jadi
          toggle ditangani eksplisit di sini (lihat juga PortalSettlementForm). */}
      <fieldset className="cart-page__fieldset">
        <legend className="cart-page__legend">Cara pembayaran</legend>
        <label
          onClick={(e) => { if (authenticated && !gatewayAvailable) return; e.preventDefault(); setPaymentMethod("GATEWAY"); }}
          className={`cart-page__option${authenticated && !gatewayAvailable ? " cart-page__option--disabled" : ""}`}
        >
          <input type="radio" checked={paymentMethod === "GATEWAY"} disabled={authenticated && !gatewayAvailable} readOnly />
          <span className="min-w-0 flex-1">
            <span className="cart-page__option-title">Bayar online</span>
            <span className="cart-page__option-text">Diproses aman melalui payment-service.</span>
            {authenticated && !gatewayAvailable && <span className="cart-page__option-warn">Pembayaran online belum tersedia untuk nominal tagihan ini. Pilih transfer manual.</span>}
            {paymentMethod === "GATEWAY" && gatewayMethods.length > 0 && (
              <Select value={gatewayMethod} onClick={(e) => e.stopPropagation()} onChange={(event) => setGatewayMethod(event.target.value)} className="mt-2 min-h-10 w-full text-sm">
                {gatewayMethods.map((method) => <option key={method.code} value={method.code}>{method.name}{method.fee ? ` (+${formatRupiah(method.fee)})` : ""}</option>)}
              </Select>
            )}
          </span>
        </label>
        <label
          onClick={(e) => { if (authenticated && !manualTransferEnabled) return; e.preventDefault(); setPaymentMethod("MANUAL"); }}
          className={`cart-page__option${authenticated && !manualTransferEnabled ? " cart-page__option--disabled" : ""}`}
        >
          <input type="radio" checked={paymentMethod === "MANUAL"} disabled={authenticated && !manualTransferEnabled} readOnly />
          <span>
            <span className="cart-page__option-title">Transfer manual</span>
            <span className="cart-page__option-text">Bayar ke rekening Seller dan unggah bukti melalui portal pesanan.</span>
            {authenticated && !manualTransferEnabled && <span className="cart-page__option-warn">Seller belum menyediakan rekening transfer.</span>}
          </span>
        </label>
      </fieldset>

      {paymentAmount !== null && (
        <div className="cart-page__billing">
          <div className="cart-page__billing-row"><span>{paymentBilling?.billingType === "DOWN_PAYMENT" ? "DP yang dibayar sekarang" : "Tagihan tahap ini"}</span><strong>{formatRupiah(paymentAmount)}</strong></div>
          {paymentBilling?.billingType === "DOWN_PAYMENT" && <p className="cart-page__billing-note">{paymentBilling.downPaymentType === "FIXED_AMOUNT" ? `${formatRupiah(paymentBilling.downPaymentAmount ?? 0)} per unit × ${paymentBilling.totalQuantity} unit` : `${paymentBilling.downPaymentPercentage ?? 50}% dari harga setiap unit produk`}</p>}
          {paymentMethod === "GATEWAY" && selectedGatewayMethod?.fee ? <div className="cart-page__billing-row"><span>Estimasi fee {selectedGatewayMethod.name}</span><strong>{formatRupiah(selectedGatewayMethod.fee)}</strong></div> : null}
        </div>
      )}

      {/* v2.3.9: nomor rekening & nama pemilik tidak perlu ditampilkan di
          sini — akan tampil jelas di halaman pembayaran setelah Pesanan
          dibuat. Pilihan rekening hanya ditampilkan bila Seller punya lebih
          dari satu rekening aktif (perlu dipilih sebelum checkout); bila
          cuma satu, backend otomatis memakai rekening utama. */}
      {authenticated && paymentMethod === "MANUAL" && manualTransfer && manualTransfers.length > 1 && (
        <div className="cart-page__bank">
          <p className="cart-page__bank-label">Pilih rekening tujuan</p>
          <Select value={selectedBankAccountId} onChange={(event) => setSelectedBankAccountId(event.target.value)} className="mt-2 min-h-10 w-full text-sm font-semibold">
            {manualTransfers.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountType === "EWALLET" ? "E-wallet" : "Bank"} · {account.bankName}{account.isPrimary ? " (utama)" : ""}
              </option>
            ))}
          </Select>
          <p className="cart-page__bank-note">Detail nomor rekening akan muncul di halaman pembayaran.</p>
        </div>
      )}

      <label className="cart-page__policy" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) return; e.preventDefault(); setAccepted((v) => !v); }}>
        <input type="checkbox" checked={accepted} readOnly />
        <span>Saya menyetujui <Link href="/terms">Syarat &amp; Ketentuan</Link>, <Link href="/privacy">Kebijakan Privasi</Link>, dan <Link href="/refund-policy">Kebijakan Refund</Link>.</span>
      </label>

      <ToastFeedback error={error} info={authenticated && resumeCheckout ? "Akun Buyer siap. Periksa ringkasan lalu selesaikan pembayaran." : undefined} />

      <button
        type="button"
        disabled={pending || syncConflict || cart.items.some((item) => item.eligible === false) || (authenticated && paymentMethod === "GATEWAY" && !gatewayAvailable) || (authenticated && paymentMethod === "MANUAL" && !manualTransferEnabled)}
        onClick={checkout}
        className="cart-page__submit"
      >
        {pending ? "Memproses…" : !authenticated ? "Masuk untuk Melanjutkan" : paymentMethod === "GATEWAY" ? "Bayar Sekarang" : "Buat Pesanan"}
      </button>
      <p className="cart-page__hint">Kuota dan harga akan divalidasi kembali sebelum pesanan dibuat.</p>
      {showAccessModal && <BuyerAccessModal callbackUrl="/cart?checkout=1" switchingAccount={switchingAccount} onClose={() => setShowAccessModal(false)} />}
    </aside>
  </div></div>;
}
