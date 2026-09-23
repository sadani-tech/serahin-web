"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ToastFeedback, useToast } from "@/components/Toast";
import { Select } from "@/components/ui";
import { createBroadcast, loadBroadcastOptions, previewBroadcast, type BroadcastOptions, type BroadcastPayload, type BroadcastPreview } from "./actions";

type SellerOption = { id: string; name: string };

export function BroadcastComposer({ sellers, initialOptions }: { sellers: SellerOption[]; initialOptions?: BroadcastOptions }) {
  const [sellerId, setSellerId] = useState(initialOptions?.sellerId ?? "");
  const [options, setOptions] = useState<BroadcastOptions | undefined>(initialOptions);
  const [campaignId, setCampaignId] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [readyForSettlement, setReadyForSettlement] = useState(true);
  const [excludePendingPayment, setExcludePendingPayment] = useState(true);
  const [preview, setPreview] = useState<BroadcastPreview>();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const selectedProduct = options?.products.find((product) => product.id === productId);

  const payload = useMemo<BroadcastPayload>(() => ({
    ...(sellerId ? { sellerId } : {}),
    name,
    purpose: readyForSettlement ? "SETTLEMENT_READY" : "ORDER_UPDATE",
    subject,
    body,
    ...(campaignId ? { campaignIds: [campaignId] } : {}),
    ...(productId ? { productIds: [productId] } : {}),
    ...(variantId ? { variantIds: [variantId] } : {}),
    readyForSettlement,
    excludePendingPayment,
  }), [sellerId, name, subject, body, campaignId, productId, variantId, readyForSettlement, excludePendingPayment]);

  function changeSeller(value: string) {
    setSellerId(value); setOptions(undefined); setCampaignId(""); setProductId(""); setVariantId(""); setPreview(undefined);
    if (!value) return;
    startTransition(async () => {
      const result = await loadBroadcastOptions(value);
      if (result.error) setError(result.error); else setOptions(result.data);
    });
  }

  function doPreview() {
    setError("");
    startTransition(async () => {
      const result = await previewBroadcast(payload);
      if (result.error) setError(result.error); else setPreview(result.data);
    });
  }

  function send() {
    if (!preview || !window.confirm(`Antrekan email untuk ${preview.recipientCount} Buyer? Audience akan disimpan sebagai snapshot.`)) return;
    setError("");
    startTransition(async () => {
      const result = await createBroadcast(payload);
      if (result.error) return setError(result.error);
      toast.success("Broadcast masuk antrean pengiriman.");
      setPreview(undefined); setName(""); setSubject(""); setBody("");
      router.refresh();
    });
  }

  return <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
    <div className="space-y-4 rounded-2xl border border-sand-200 bg-white p-5">
      <div><h2 className="text-lg font-extrabold text-sand-900">Buat broadcast</h2><p className="mt-1 text-sm text-sand-500">Khusus pemberitahuan operasional kepada Buyer yang benar-benar membeli produk terkait.</p></div>
      {sellers.length > 0 && <Field label="Seller"><Select value={sellerId} onChange={(event) => changeSeller(event.target.value)}><option value="">Pilih Seller</option>{sellers.map((seller) => <option value={seller.id} key={seller.id}>{seller.name}</option>)}</Select></Field>}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Batch PO"><Select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); setPreview(undefined); }} disabled={!options}><option value="">Semua Batch PO produk terpilih</option>{options?.campaigns.map((campaign) => <option value={campaign.id} key={campaign.id}>{campaign.name}</option>)}</Select></Field>
        <Field label="Produk"><Select value={productId} onChange={(event) => { setProductId(event.target.value); setVariantId(""); setPreview(undefined); }} disabled={!options}><option value="">Pilih produk</option>{options?.products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</Select></Field>
      </div>
      {selectedProduct && <Field label="Varian (opsional)"><Select value={variantId} onChange={(event) => { setVariantId(event.target.value); setPreview(undefined); }}><option value="">Semua varian</option>{selectedProduct.variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.name}</option>)}</Select></Field>}
      <Field label="Nama internal"><input value={name} onChange={(event) => { setName(event.target.value); setPreview(undefined); }} className="input" placeholder="Pelunasan Produk A — September" /></Field>
      <Field label="Subjek email"><input value={subject} onChange={(event) => { setSubject(event.target.value); setPreview(undefined); }} className="input" placeholder="Produkmu sudah siap dilunasi" /></Field>
      <Field label="Pesan singkat"><textarea value={body} onChange={(event) => { setBody(event.target.value); setPreview(undefined); }} className="input min-h-28 py-3" placeholder="Kabar baik! Produk pesananmu sudah masuk tahap pelunasan." /></Field>
      <label className="flex items-start gap-3 rounded-xl bg-cream-soft p-3 text-sm"><input type="checkbox" checked={readyForSettlement} onChange={(event) => { setReadyForSettlement(event.target.checked); setPreview(undefined); }} className="mt-1" /><span><b>Siap dilunasi</b><small className="block text-sand-500">Hanya Buyer dengan DP terverifikasi dan sisa tagihan.</small></span></label>
      <label className="flex items-start gap-3 rounded-xl bg-cream-soft p-3 text-sm"><input type="checkbox" checked={excludePendingPayment} onChange={(event) => { setExcludePendingPayment(event.target.checked); setPreview(undefined); }} className="mt-1" /><span><b>Kecualikan pembayaran pending</b><small className="block text-sand-500">Mencegah Buyer membayar dua kali saat bukti sedang diperiksa.</small></span></label>
      <ToastFeedback error={error} />
      <button type="button" disabled={pending || !options} onClick={doPreview} className="min-h-11 rounded-xl bg-brand-600 px-5 font-extrabold text-white disabled:opacity-50">{pending ? "Menghitung..." : "Preview audience"}</button>
    </div>
    <aside className="rounded-2xl border border-sand-200 bg-cream-soft p-5">
      <h2 className="text-lg font-extrabold text-sand-900">Preview recipient</h2>
      {!preview ? <p className="mt-3 text-sm leading-6 text-sand-500">Pilih Seller dan produk, isi pesan, lalu hitung audience sebelum mengirim.</p> : <div className="mt-4 space-y-4">
        <div className="rounded-2xl bg-brand-700 p-5 text-white"><p className="text-xs font-bold uppercase tracking-wide text-brand-100">Recipient unik</p><strong className="mt-2 block text-4xl">{preview.recipientCount}</strong><small>Maksimum {preview.maximumRecipients}</small></div>
        <div className="grid grid-cols-2 gap-2 text-xs">{Object.entries(preview.excluded).map(([key, value]) => <div key={key} className="rounded-xl bg-white p-3"><b className="block text-lg text-sand-900">{value}</b><span className="text-sand-500">{excludedLabel[key] ?? key}</span></div>)}</div>
        <div className="space-y-2"><h3 className="text-xs font-extrabold uppercase tracking-wide text-sand-500">Sampel</h3>{preview.sample.map((item) => <div className="rounded-xl border border-sand-200 bg-white p-3 text-sm" key={item.email}><b>{item.name}</b><p className="text-xs text-sand-500">{item.email} · {item.orderCount} pesanan</p><p className="mt-1 text-xs text-sand-600">{item.products.join(", ")}</p></div>)}</div>
        <button type="button" disabled={pending || preview.recipientCount === 0} onClick={send} className="min-h-11 w-full rounded-xl bg-accent-600 px-5 font-extrabold text-white disabled:opacity-50">Konfirmasi & antrekan</button>
      </div>}
    </aside>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-sand-700">{label}{children}</label>; }
const excludedLabel: Record<string, string> = { noEmail: "Tidak ada email tercatat", malformedEmail: "Format email tidak valid", noOutstandingBalance: "Tidak ada sisa", pendingPayment: "Pembayaran pending", duplicate: "Recipient duplikat" };
