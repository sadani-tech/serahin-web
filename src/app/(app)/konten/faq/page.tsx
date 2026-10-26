import Link from "next/link";
import { api } from "@/lib/api";
import { FaqManager } from "./FaqManager";

export const dynamic = "force-dynamic";

type FaqRow = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  aktif: boolean;
  campaignId: string | null;
};

export default async function FaqPage() {
  const [faqs, campaigns] = await Promise.all([
    api.list<FaqRow>("/cms/faq"),
    api.list<{ id: string; namaProduk: string }>("/pre-orders"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/konten"
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Kembali ke Konten
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          FAQ
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Pertanyaan yang sering diajukan. FAQ global tampil di semua form
          publik; FAQ Batch PO hanya tampil pada form PO terkait.
        </p>
      </div>

      <FaqManager faqs={faqs} campaigns={campaigns} />
    </div>
  );
}
