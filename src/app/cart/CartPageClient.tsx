"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { formatRupiah, formatTanggal } from "@/lib/format";

export function CartPageClient() {
  const { cart, ready, authenticated, syncConflict, setQuantity, setColor, removeItem, clear, sync } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"GATEWAY" | "MANUAL">("GATEWAY");
  const [gatewayMethod, setGatewayMethod] = useState("");
  const [gatewayMethods, setGatewayMethods] = useState<Array<{ code: string; name: string; fee?: number; imageUrl?: string }>>([]);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const checkoutKey = useRef<string>("");
  const total = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  const selectedGatewayMethod = gatewayMethods.find((method) => method.code === gatewayMethod);

  useEffect(() => {
    if (!authenticated || !cart) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/cart/payment-methods").catch(() => null);
      if (!response?.ok) return;
      try {
        const data = await response.json() as { amount: number; gatewayEnabled: boolean; methods: Array<{ code: string; name: string; fee?: number; imageUrl?: string }> };
        setPaymentAmount(data.amount);
        setGatewayMethods(data.methods);
        setGatewayMethod((current) => current || data.methods[0]?.code || "");
        if (!data.gatewayEnabled) setPaymentMethod("MANUAL");
      } catch {
        setError("Metode pembayaran belum dapat dimuat. Silakan coba lagi.");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authenticated, cart]);

  async function checkout() {
    if (!cart || !accepted) return;
    if (!authenticated) {
      window.location.assign(`/account/login?callbackUrl=${encodeURIComponent("/cart")}`);
      return;
    }
    setPending(true); setError("");
    try {
      if (syncConflict) throw new Error("Pilih keranjang yang ingin digunakan sebelum checkout.");
      await sync();
      if (!checkoutKey.current) checkoutKey.current = crypto.randomUUID();
      const response = await fetch("/api/cart/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutKey: checkoutKey.current, paymentMethod, paymentMethodCode: paymentMethod === "GATEWAY" ? gatewayMethod || undefined : undefined, acceptPolicies: accepted, whatsappConsent: whatsapp }),
      });
      const data = await response.json().catch(() => ({ message: "Respons server tidak valid. Silakan coba lagi." })) as { message?: string; paymentUrl?: string | null; tokenAkses?: string; needsConfirm?: boolean; warning?: string };
      if (!response.ok) throw new Error(data.message ?? "Checkout belum berhasil.");
      if (data.needsConfirm) throw new Error(data.warning ?? "Pesanan serupa baru saja dibuat.");
      if (data.paymentUrl) window.location.assign(data.paymentUrl);
      else if (data.tokenAkses) window.location.assign(`/portal/${data.tokenAkses}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout belum berhasil.");
      setPending(false);
    }
  }

  if (!ready) return <div className="py-20 text-center font-bold text-sand-500">Memuat keranjang…</div>;
  if (!cart) return <div className="rounded-3xl border border-dashed border-sand-300 bg-white px-6 py-16 text-center">
    <h1 className="text-2xl font-extrabold text-sand-900">Keranjang masih kosong</h1>
    <p className="mt-2 text-sm text-sand-600">Pilih produk dari Batch PO aktif untuk mulai memesan.</p>
    <Link href="/#catalog" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 text-sm font-extrabold text-white">Jelajahi katalog</Link>
  </div>;

  return <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
    <section>
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">{cart.sellerName}</p><h1 className="mt-1 text-3xl font-extrabold text-sand-900">Keranjang</h1><p className="mt-1 text-sm font-bold text-sand-500">{cart.eventTitle} · tutup {formatTanggal(cart.endsAt)}</p></div><button type="button" onClick={clear} className="text-sm font-bold text-rose-700 hover:underline">Kosongkan</button></div>
      {syncConflict && <div className="mt-5 rounded-2xl border border-sun-300 bg-sun-50 p-4 text-sm text-sun-900"><p className="font-extrabold">Keranjang akun berbeda dari keranjang perangkat ini.</p><p className="mt-1">Pilih isi keranjang yang ingin digunakan. Tidak ada pesanan yang terhapus.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void sync("KEEP_REMOTE")} className="min-h-10 rounded-xl border border-sun-400 bg-white px-4 font-extrabold">Gunakan cart tersimpan</button><button type="button" onClick={() => void sync("REPLACE_WITH_LOCAL")} className="min-h-10 rounded-xl bg-brand-700 px-4 font-extrabold text-white">Gunakan cart perangkat</button></div></div>}
      <div className="mt-6 space-y-3">{cart.items.map((item) => <article key={`${item.variantId}:${item.selectedColor ?? ""}`} className="flex gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100"><ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>
        <div className="min-w-0 flex-1"><h2 className="font-extrabold text-sand-900">{item.name}</h2>{item.colors?.length ? <label className="mt-1 block text-xs font-bold text-sand-500">Warna<select value={item.selectedColor ?? ""} onChange={(event) => setColor(item.variantId, item.selectedColor, event.target.value)} className="ml-2 min-h-9 rounded-lg border border-sand-300 bg-white px-2 text-sm"><option value="" disabled>Pilih warna</option>{item.colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></label> : item.selectedColor ? <p className="text-sm text-sand-500">Warna: {item.selectedColor}</p> : null}<p className="mt-1 font-extrabold text-brand-700">{formatRupiah(item.price)}</p>{item.invalidReason && <p className="mt-2 text-xs font-bold text-rose-700">{item.invalidReason}</p>}
          <div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => setQuantity(item.variantId, item.selectedColor, item.quantity - 1)} className="h-10 w-10 rounded-xl border border-sand-300 font-extrabold">−</button><span className="w-8 text-center font-bold">{item.quantity}</span><button type="button" onClick={() => setQuantity(item.variantId, item.selectedColor, item.quantity + 1)} className="h-10 w-10 rounded-xl border border-sand-300 font-extrabold">+</button><button type="button" onClick={() => removeItem(item.variantId, item.selectedColor)} className="ml-auto text-sm font-bold text-rose-700">Hapus</button></div>
        </div>
      </article>)}</div>
    </section>

    <aside className="h-fit rounded-3xl border border-sand-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-xl font-extrabold text-sand-900">Ringkasan</h2>
      <div className="mt-4 flex justify-between border-b border-sand-200 pb-4"><span className="text-sm font-bold text-sand-600">Total produk</span><strong className="text-lg text-brand-700">{formatRupiah(total)}</strong></div>
      <fieldset className="mt-5"><legend className="text-sm font-extrabold text-sand-700">Cara pembayaran</legend><label className="mt-2 flex cursor-pointer gap-3 rounded-xl border border-sand-200 p-3"><input type="radio" checked={paymentMethod === "GATEWAY"} disabled={authenticated && gatewayMethods.length === 0} onChange={() => setPaymentMethod("GATEWAY")} /><span className="min-w-0 flex-1"><strong className="block text-sm">Bayar online</strong><span className="text-xs text-sand-500">Diproses aman melalui payment-service (Paywuz).</span>{paymentMethod === "GATEWAY" && gatewayMethods.length > 0 && <select value={gatewayMethod} onChange={(event) => setGatewayMethod(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-sand-300 bg-white px-2 text-sm">{gatewayMethods.map((method) => <option key={method.code} value={method.code}>{method.name}{method.fee ? ` (+${formatRupiah(method.fee)})` : ""}</option>)}</select>}</span></label><label className="mt-2 flex cursor-pointer gap-3 rounded-xl border border-sand-200 p-3"><input type="radio" checked={paymentMethod === "MANUAL"} onChange={() => setPaymentMethod("MANUAL")} /><span><strong className="block text-sm">Transfer manual</strong><span className="text-xs text-sand-500">Bayar dan unggah bukti melalui portal pesanan.</span></span></label></fieldset>
      {paymentAmount !== null && <div className="mt-4 space-y-1 rounded-xl bg-sand-50 p-3 text-sm"><div className="flex justify-between"><span>Tagihan tahap ini</span><strong>{formatRupiah(paymentAmount)}</strong></div>{paymentMethod === "GATEWAY" && selectedGatewayMethod?.fee ? <div className="flex justify-between text-sand-600"><span>Estimasi fee {selectedGatewayMethod.name}</span><strong>{formatRupiah(selectedGatewayMethod.fee)}</strong></div> : null}</div>}
      <label className="mt-5 flex gap-3 text-sm leading-5 text-sand-700"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" /><span>Saya menyetujui <Link href="/terms" className="font-bold text-brand-700 underline">Syarat & Ketentuan</Link>, <Link href="/privacy" className="font-bold text-brand-700 underline">Kebijakan Privasi</Link>, dan <Link href="/refund-policy" className="font-bold text-brand-700 underline">Kebijakan Refund</Link>.</span></label>
      <label className="mt-3 flex gap-3 text-sm leading-5 text-sand-600"><input type="checkbox" checked={whatsapp} onChange={(event) => setWhatsapp(event.target.checked)} className="mt-1" /><span>Saya bersedia menerima pembaruan transaksional melalui WhatsApp.</span></label>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      <button type="button" disabled={!accepted || pending || syncConflict || cart.items.some((item) => item.eligible === false)} onClick={checkout} className="mt-5 min-h-12 w-full rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white disabled:bg-sand-300">{pending ? "Memproses…" : authenticated ? "Lanjutkan Checkout" : "Masuk untuk Checkout"}</button>
      <p className="mt-3 text-center text-xs text-sand-500">Kuota dan harga akan divalidasi kembali sebelum pesanan dibuat.</p>
    </aside>
  </div>;
}
