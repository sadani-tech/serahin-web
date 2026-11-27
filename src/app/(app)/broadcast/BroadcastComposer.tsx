"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ToastFeedback, useToast } from "@/components/Toast";
import { Select } from "@/components/ui";
import { WorkspaceDialog } from "@/components/ui/WorkspaceDialog";
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

  async function send() {
    if (!preview) return;
    setError("");
    startTransition(async () => {
      const result = await createBroadcast(payload);
      if (result.error) return setError(result.error);
      toast.success("Broadcast masuk antrean pengiriman.");
      setPreview(undefined); setName(""); setSubject(""); setBody("");
      router.refresh();
    });
  }

  return <div className="mx-auto max-w-4xl">
    <div className="space-y-6 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
      <div><p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">Kampanye email</p><h2 className="mt-1 text-xl font-extrabold text-sand-900">Buat broadcast</h2><p className="mt-1 text-sm leading-6 text-sand-500">Tentukan siapa yang menerima pesan, tulis email, lalu periksa hasilnya sebelum dikirim.</p></div>
      <div className="border-t border-sand-100 pt-4"><h3 className="mb-3 text-sm font-extrabold text-sand-900">1. Pilih penerima</h3>
      {sellers.length > 0 && <Field label="Seller"><Select value={sellerId} onChange={(event) => changeSeller(event.target.value)}><option value="">Pilih Seller</option>{sellers.map((seller) => <option value={seller.id} key={seller.id}>{seller.name}</option>)}</Select></Field>}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Batch PO"><Select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); setPreview(undefined); }} disabled={!options}><option value="">Semua Batch PO produk terpilih</option>{options?.campaigns.map((campaign) => <option value={campaign.id} key={campaign.id}>{campaign.name}</option>)}</Select></Field>
        <Field label="Produk"><Select value={productId} onChange={(event) => { setProductId(event.target.value); setVariantId(""); setPreview(undefined); }} disabled={!options}><option value="">Pilih produk</option>{options?.products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</Select></Field>
      </div>
      {selectedProduct && <Field label="Varian (opsional)"><Select value={variantId} onChange={(event) => { setVariantId(event.target.value); setPreview(undefined); }}><option value="">Semua varian</option>{selectedProduct.variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.name}</option>)}</Select></Field>}
      </div>
      <div className="space-y-4 border-t border-sand-100 pt-4"><h3 className="text-sm font-extrabold text-sand-900">2. Tulis email</h3>
      <Field label="Nama internal"><input value={name} onChange={(event) => { setName(event.target.value); setPreview(undefined); }} className="input" placeholder="Pelunasan Produk A — September" /></Field>
      <Field label="Subjek email"><input value={subject} onChange={(event) => { setSubject(event.target.value); setPreview(undefined); }} className="input" placeholder="Produkmu sudah siap dilunasi" /></Field>
      <Field label="Pesan singkat"><textarea value={body} onChange={(event) => { setBody(event.target.value); setPreview(undefined); }} className="input min-h-28 py-3" placeholder="Kabar baik! Produk pesananmu sudah masuk tahap pelunasan." /></Field>
      </div>
      <div className="space-y-3 border-t border-sand-100 pt-4"><h3 className="text-sm font-extrabold text-sand-900">3. Atur kriteria</h3><label className="flex items-start gap-3 rounded-xl bg-cream-soft p-3 text-sm"><input type="checkbox" checked={readyForSettlement} onChange={(event) => { setReadyForSettlement(event.target.checked); setPreview(undefined); }} className="mt-1" /><span><b>Siap dilunasi</b><small className="block text-sand-500">Hanya Buyer dengan DP terverifikasi dan sisa tagihan.</small></span></label>
      <label className="flex items-start gap-3 rounded-xl bg-cream-soft p-3 text-sm"><input type="checkbox" checked={excludePendingPayment} onChange={(event) => { setExcludePendingPayment(event.target.checked); setPreview(undefined); }} className="mt-1" /><span><b>Kecualikan pembayaran pending</b><small className="block text-sand-500">Mencegah Buyer membayar dua kali saat bukti sedang diperiksa.</small></span></label>
      </div>
      <ToastFeedback error={error} />
      <div className="flex flex-col gap-3 border-t border-sand-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-sand-500">Preview menampilkan tampilan email dan jumlah penerima akhir. Belum ada email yang dikirim.</p><button type="button" disabled={pending || !options} onClick={doPreview} className="min-h-11 w-full shrink-0 rounded-xl bg-brand-600 px-5 font-extrabold text-white disabled:opacity-50 sm:w-auto">{pending ? "Menghitung..." : "Preview & periksa →"}</button></div>
    </div>
    {preview && <WorkspaceDialog title="Periksa broadcast" eyebrow="Preview sebelum kirim" onClose={() => setPreview(undefined)} wide footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-sand-500">Pengiriman akan masuk antrean untuk {preview.recipientCount} penerima unik.</p><div className="flex gap-2"><button type="button" onClick={() => setPreview(undefined)} className="min-h-11 flex-1 rounded-xl border border-sand-300 px-4 text-sm font-bold sm:flex-none">Kembali edit</button><button type="button" disabled={pending || preview.recipientCount === 0} onClick={send} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white disabled:opacity-50 sm:flex-none">{pending ? "Mengantrekan..." : "Kirim broadcast"}</button></div></div>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-3"><p className="text-xs font-extrabold uppercase tracking-wide text-sand-500">Tampilan email</p><div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm"><div className="space-y-2 border-b border-sand-100 bg-sand-50 px-5 py-4 text-sm"><p><span className="inline-block w-16 text-sand-500">Subjek</span><strong className="text-sand-900">{subject}</strong></p><p><span className="inline-block w-16 text-sand-500">Kepada</span><span>Buyer yang memenuhi kriteria</span></p></div><div className="min-h-48 whitespace-pre-wrap break-words px-5 py-6 text-sm leading-7 text-sand-800">{body}</div></div><p className="text-xs text-sand-500">Nama internal: {name}</p></div>
        <aside className="space-y-4"><div className="rounded-2xl bg-brand-700 p-5 text-white"><p className="text-xs font-bold uppercase tracking-wide text-brand-100">Penerima unik</p><strong className="mt-2 block text-4xl">{preview.recipientCount}</strong><small>Maksimum {preview.maximumRecipients}</small></div><div><h3 className="text-xs font-extrabold uppercase tracking-wide text-sand-500">Tidak disertakan</h3><dl className="mt-2 space-y-2">{Object.entries(preview.excluded).map(([key, value]) => <div key={key} className="flex justify-between gap-2 text-xs"><dt className="text-sand-600">{excludedLabel[key] ?? key}</dt><dd className="font-extrabold text-sand-900">{value}</dd></div>)}</dl></div><div className="border-t border-sand-100 pt-3"><h3 className="text-xs font-extrabold uppercase tracking-wide text-sand-500">Contoh penerima</h3>{preview.sample.map((item) => <div className="mt-2 text-xs" key={item.email}><b className="text-sand-900">{item.name}</b><p className="break-all text-sand-500">{item.email} · {item.orderCount} pesanan</p></div>)}</div></aside>
      </div><ToastFeedback error={error} />
    </WorkspaceDialog>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-sand-700">{label}{children}</label>; }
const excludedLabel: Record<string, string> = { noEmail: "Tidak ada email tercatat", malformedEmail: "Format email tidak valid", noOutstandingBalance: "Tidak ada sisa", pendingPayment: "Pembayaran pending", duplicate: "Recipient duplikat" };
