"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { useCart, type CartDraft } from "@/components/CartProvider";
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
  const { carts, activeEventId, setActiveEvent, ready, authenticated, setQuantity, setColor, removeItem, clearOne, syncCart } = useCart();
  const cart = carts.find((c) => c.salesEventId === activeEventId) ?? null;
  const siblingsSameSeller = cart ? carts.filter((c) => c.sellerId && c.sellerId === cart.sellerId) : [];
  const [paymentMethod, setPaymentMethod] = useState<"GATEWAY" | "MANUAL">("GATEWAY");
  const [gatewayMethod, setGatewayMethod] = useState("");
  const [gatewayMethods, setGatewayMethods] = useState<Array<{ code: string; name: string; fee?: number; imageUrl?: string }>>([]);
  const [gatewayAvailable, setGatewayAvailable] = useState(false);
  const [manualTransferEnabled, setManualTransferEnabled] = useState(true);
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
  const [groupPending, setGroupPending] = useState(false);
  const [error, setError] = useState("");
  const [showAccessModal, setShowAccessModal] = useState(false);
  const checkoutPanel = useRef<HTMLElement>(null);
  const checkoutKey = useRef<string>("");
  const checkoutCartId = useRef<string>("");
  const total = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  const selectedGatewayMethod = gatewayMethods.find((method) => method.code === gatewayMethod);
  const cartRevision = cart?.items.map((item) => `${item.variantId}:${item.selectedColor ?? ""}:${item.quantity}`).join("|") ?? "";

  useEffect(() => {
    if (!authenticated || !cart) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPaymentAmount(null);
      setGatewayAvailable(false);
      setGatewayMethods([]);
      try {
        // Ensure the latest local quantity/color write reaches the API before
        // asking it to calculate the payable amount and available methods.
        await syncCart(cart.salesEventId);
        if (cancelled) return;
        const response = await fetch(`/api/cart/payment-methods?salesEventId=${encodeURIComponent(cart.salesEventId)}`);
        if (!response.ok) throw new Error("Metode pembayaran belum dapat dimuat. Silakan coba lagi.");
        const data = await response.json() as {
          amount: number;
          gatewayEnabled: boolean;
          manualTransferEnabled: boolean;
          methods: Array<{ code: string; name: string; fee?: number; imageUrl?: string }>;
          billingType: "DOWN_PAYMENT" | "FULL_PAYMENT";
          downPaymentType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
          downPaymentPercentage: number | null;
          downPaymentAmount: number | null;
          totalQuantity: number;
        };
        if (cancelled) return;
        setPaymentAmount(data.amount);
        setPaymentBilling(data);
        const gatewayUsable = data.gatewayEnabled && data.methods.length > 0;
        setGatewayMethods(data.methods);
        setGatewayAvailable(gatewayUsable);
        setManualTransferEnabled(data.manualTransferEnabled);
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
      } catch (reason) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Metode pembayaran belum dapat dimuat. Silakan coba lagi.");
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authenticated, cart, cartRevision, syncCart]);

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
      await syncCart(cart.salesEventId);
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
        body: JSON.stringify({ checkoutKey: checkoutKey.current, salesEventId: cart.salesEventId, paymentMethod, paymentMethodCode: paymentMethod === "GATEWAY" ? gatewayMethod || undefined : undefined, acceptPolicies: accepted, whatsappConsent: whatsapp }),
      });
      const data = await response.json().catch(() => ({ message: "Respons server tidak valid. Silakan coba lagi." })) as { message?: string; paymentUrl?: string | null; tokenAkses?: string; needsConfirm?: boolean; warning?: string; paymentFallback?: boolean };
      if (response.status === 401 || response.status === 403) {
        setPending(false);
        setShowAccessModal(true);
        return;
      }
      if (!response.ok) throw new Error(data.message ?? "Checkout belum berhasil.");
      if (data.needsConfirm) throw new Error(data.warning ?? "Pesanan serupa baru saja dibuat.");
      sessionStorage.removeItem(keyStorage);
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else if (data.tokenAkses) router.push(`/portal/${data.tokenAkses}${data.paymentFallback ? "?payment=fallback" : ""}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout belum berhasil.");
      setPending(false);
    }
  }

  async function checkoutGabungan(selectedIds: string[]) {
    if (!authenticated) { setShowAccessModal(true); return; }
    if (!accepted) { setError("Setujui kebijakan Serahin untuk melanjutkan checkout gabungan."); return; }
    setGroupPending(true); setError("");
    try {
      const response = await fetch("/api/checkout-groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesEventIds: selectedIds, acceptPolicies: true }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string; checkoutGroupId?: string };
      if (response.status === 401 || response.status === 403) { setGroupPending(false); setShowAccessModal(true); return; }
      if (!response.ok || !data.checkoutGroupId) throw new Error(data.message ?? "Checkout gabungan belum berhasil.");
      router.push(`/account/checkout-groups/${data.checkoutGroupId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout gabungan belum berhasil.");
      setGroupPending(false);
    }
  }

  if (!ready) return <div className="cart-page"><p className="cart-page__loading">Memuat keranjang…</p></div>;
  if (!carts.length || !cart) return <div className="cart-page"><div className="cart-page__empty">
    <h1>Keranjang masih kosong</h1>
    <p>Pilih produk dari Batch PO aktif untuk mulai memesan.</p>
    <Link href="/catalog" className="btn btn--primary btn--sm"><span>Jelajahi katalog</span><span className="btn__icon"><svg className="icon" aria-hidden="true"><use href="#i-arrow" /></svg></span></Link>
  </div></div>;

  return <div className="cart-page"><div className="cart-page__layout">
    <section>
      {carts.length > 1 && (
        <div className="cart-page__tabs" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {carts.map((c) => (
            <button
              key={c.salesEventId}
              type="button"
              onClick={() => setActiveEvent(c.salesEventId)}
              className="cart-page__pill-btn"
              style={c.salesEventId === cart.salesEventId ? { fontWeight: 800, borderWidth: 2 } : undefined}
            >
              {c.eventTitle} ({c.items.reduce((s, i) => s + i.quantity, 0)})
            </button>
          ))}
        </div>
      )}

      <div className="cart-page__head">
        <div>
          <p className="cart-page__eyebrow">{cart.sellerName}</p>
          <h1 className="cart-page__title">Keranjang</h1>
          <p className="cart-page__meta">{cart.eventTitle} · tutup {formatTanggal(cart.endsAt)}</p>
        </div>
        <button type="button" onClick={() => clearOne(cart.salesEventId)} className="cart-page__clear">Kosongkan</button>
      </div>

      {siblingsSameSeller.length > 1 && (
        <CheckoutGabunganPanel
          carts={siblingsSameSeller}
          pending={groupPending}
          onSubmit={checkoutGabungan}
        />
      )}

      <div className="cart-page__items">{cart.items.map((item) => (
        <article key={`${item.variantId}:${item.selectedColor ?? ""}`} className="cart-page__item">
          <div className="cart-page__item-media"><ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>
          <div className="cart-page__item-body">
            <h2 className="cart-page__item-name">{item.name}</h2>
            {item.colors?.length ? (
              <label className="cart-page__item-color">
                Warna
                <Select value={item.selectedColor ?? ""} onChange={(event) => setColor(cart.salesEventId, item.variantId, item.selectedColor, event.target.value)} className="ml-2 min-h-9 text-sm">
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
              <button type="button" onClick={() => setQuantity(cart.salesEventId, item.variantId, item.selectedColor, item.quantity - 1)} className="cart-page__qty-btn" aria-label="Kurangi jumlah">−</button>
              <span className="cart-page__qty-value">{item.quantity}</span>
              <button type="button" onClick={() => setQuantity(cart.salesEventId, item.variantId, item.selectedColor, item.quantity + 1)} className="cart-page__qty-btn" aria-label="Tambah jumlah">+</button>
              <button type="button" onClick={() => removeItem(cart.salesEventId, item.variantId, item.selectedColor)} className="cart-page__item-remove">Hapus</button>
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
                {gatewayMethods.map((method) => <option key={method.code} value={method.code}>{displayGatewayMethod(method.name)}{method.fee ? ` (+${formatRupiah(method.fee)})` : ""}</option>)}
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
          {paymentBilling?.billingType === "DOWN_PAYMENT" && <p className="cart-page__billing-note">{paymentBilling.downPaymentType === "FIXED_AMOUNT" ? `DP dihitung otomatis berdasarkan harga produk dan jumlah ${paymentBilling.totalQuantity} unit.` : `${paymentBilling.downPaymentPercentage ?? 50}% dari harga setiap unit produk · ${paymentBilling.totalQuantity} unit.`}</p>}
          {paymentMethod === "GATEWAY" && selectedGatewayMethod?.fee ? <div className="cart-page__billing-row"><span>Estimasi fee {selectedGatewayMethod.name}</span><strong>{formatRupiah(selectedGatewayMethod.fee)}</strong></div> : null}
        </div>
      )}
      {authenticated && paymentAmount === null && <p className="cart-page__billing-note" role="status">Menyinkronkan keranjang dan memperbarui nominal pembayaran…</p>}

      {/* v2.4.1: tidak lagi menawarkan pilihan rekening tujuan di sini —
          backend otomatis memakai rekening utama Seller (atau rekening
          tertua bila belum ada yang ditandai utama), dan Buyer tetap
          melihat seluruh rekening aktif Seller di halaman pembayaran
          setelah Pesanan dibuat untuk transfer ke rekening manapun. */}

      <label className="cart-page__policy" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) return; e.preventDefault(); setAccepted((v) => !v); }}>
        <input type="checkbox" checked={accepted} readOnly />
        <span>Saya menyetujui <Link href="/terms">Syarat &amp; Ketentuan</Link>, <Link href="/privacy">Kebijakan Privasi</Link>, dan <Link href="/refund-policy">Kebijakan Refund</Link>.</span>
      </label>

      <ToastFeedback error={error} info={authenticated && resumeCheckout ? "Akun Buyer siap. Periksa ringkasan lalu selesaikan pembayaran." : undefined} />

      <button
        type="button"
        disabled={pending || (authenticated && paymentAmount === null) || cart.items.some((item) => item.eligible === false) || (authenticated && paymentMethod === "GATEWAY" && !gatewayAvailable) || (authenticated && paymentMethod === "MANUAL" && !manualTransferEnabled)}
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

function displayGatewayMethod(name: string) {
  return /^virtual account\s+\d{3}$/i.test(name) ? "Virtual Account" : name;
}

/** v2.4.1 FR-39.5: checkout gabungan lintas Batch PO (manual transfer, satu
 * bukti) untuk Batch PO yang berasal dari Seller yang sama dengan cart aktif. */
function CheckoutGabunganPanel({ carts, pending, onSubmit }: { carts: CartDraft[]; pending: boolean; onSubmit: (salesEventIds: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(carts.map((c) => c.salesEventId)));
  const total = carts.filter((c) => selected.has(c.salesEventId)).reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
  return (
    <div className="cart-page__conflict" style={{ marginBottom: "1rem" }}>
      <strong>Checkout gabungan tersedia — {carts[0]?.sellerName}</strong>
      <p>Kamu punya {carts.length} keranjang Batch PO dari Seller ini. Gabungkan jadi satu pembayaran (satu bukti transfer).</p>
      <ul style={{ margin: "0.5rem 0", paddingLeft: 0, listStyle: "none" }}>
        {carts.map((c) => (
          <li key={c.salesEventId} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0" }}>
            <input
              type="checkbox"
              checked={selected.has(c.salesEventId)}
              onChange={() => setSelected((current) => {
                const next = new Set(current);
                if (next.has(c.salesEventId)) next.delete(c.salesEventId); else next.add(c.salesEventId);
                return next;
              })}
            />
            <span>{c.eventTitle} ({c.items.reduce((s, i) => s + i.quantity, 0)} item)</span>
          </li>
        ))}
      </ul>
      <div className="cart-page__conflict-actions">
        <button
          type="button"
          disabled={pending || selected.size < 2}
          onClick={() => onSubmit([...selected])}
          className="cart-page__pill-btn cart-page__pill-btn--primary"
        >
          {pending ? "Memproses…" : `Checkout Gabungan · ${formatRupiah(total)}`}
        </button>
      </div>
    </div>
  );
}
