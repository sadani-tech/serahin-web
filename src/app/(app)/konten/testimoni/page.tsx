import Link from "next/link";
import { api } from "@/lib/api";
import { badge } from "@/lib/domain";
import { formatWaktu } from "@/lib/format";
import { publishTestimonial, unpublishTestimonial, deleteTestimonialAction } from "./actions";

export const dynamic = "force-dynamic";

type TestimonialRow = {
  id: string;
  customerName: string;
  productLabel: string | null;
  quote: string;
  rating: number | null;
  orderId: string | null;
  isVerified: boolean;
  status: "DRAFT" | "PUBLISHED";
  nameAnonymized: boolean;
  createdAt: string;
  seller: { id: string; slug: string; businessName: string } | null;
  order: { id: string; publicToken: string; status: string } | null;
};

export default async function TestimoniPage() {
  const rows = await api.list<TestimonialRow>("/cms/testimonials");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">Testimoni</h1>
        <p className="mt-1 text-sm text-sand-500">
          Termasuk ulasan yang dikirim Buyer sendiri setelah Pesanan Selesai (v2.3.9 FR-42.23) — tinjau lalu
          Publikasikan supaya tampil di halaman Katalog/Toko. Baru masuk selalu berstatus Draft.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
              <th className="px-5 py-3 font-medium">Pengirim</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Ulasan</th>
              <th className="px-5 py-3 font-medium">Seller</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Dikirim</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-sand-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-sand-900">{row.nameAnonymized ? `${row.customerName.charAt(0)}***` : row.customerName}</p>
                  {row.order && (
                    <Link href={`/pesanan/${row.order.id}`} className="text-xs font-bold text-brand-700 hover:underline">
                      Lihat Pesanan
                    </Link>
                  )}
                </td>
                <td className="px-5 py-3 text-amber-500">{row.rating ? "★".repeat(row.rating) + "☆".repeat(5 - row.rating) : "—"}</td>
                <td className="px-5 py-3 max-w-md text-sand-700">{row.quote}</td>
                <td className="px-5 py-3 text-sand-600">{row.seller?.businessName ?? "—"}</td>
                <td className="px-5 py-3">
                  {row.status === "PUBLISHED" ? (
                    <span className={badge("bg-emerald-100 text-emerald-800 ring-emerald-600/20")}>Publish</span>
                  ) : (
                    <span className={badge("bg-sand-100 text-sand-600 ring-sand-600/20")}>Draft</span>
                  )}
                </td>
                <td className="px-5 py-3 text-sand-500">{formatWaktu(row.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.status === "PUBLISHED" ? (
                      <form action={unpublishTestimonial.bind(null, row)}>
                        <button className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-bold text-sand-700 hover:bg-sand-100">Jadikan Draft</button>
                      </form>
                    ) : (
                      <form action={publishTestimonial.bind(null, row)}>
                        <button className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">Publikasikan</button>
                      </form>
                    )}
                    <form action={deleteTestimonialAction.bind(null, row.id)}>
                      <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50">Hapus</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-sand-500">
                  Belum ada testimoni.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
