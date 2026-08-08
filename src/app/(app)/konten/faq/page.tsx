import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FaqManager } from "./FaqManager";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const [faqs, campaigns] = await Promise.all([
    prisma.faqEntry.findMany({
      orderBy: [{ campaignId: "asc" }, { urutan: "asc" }, { createdAt: "asc" }],
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, namaProduk: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/konten"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke Konten
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          FAQ
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pertanyaan yang sering diajukan. FAQ global tampil di semua form
          publik; FAQ kampanye hanya di form kampanye terkait.
        </p>
      </div>

      <FaqManager faqs={faqs} campaigns={campaigns} />
    </div>
  );
}
