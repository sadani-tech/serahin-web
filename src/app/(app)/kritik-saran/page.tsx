import Link from "next/link";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { formatTanggal } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { KritikSaranForm } from "./KritikSaranForm";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  actorType: "ADMIN" | "SELLER";
  actorName: string;
  actorEmail: string | null;
  sellerName: string | null;
  message: string;
  createdAt: string;
};
type Params = { page?: string };

export default async function KritikSaranPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);
  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Bantuan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-sand-900">Kritik &amp; Saran</h1>
        <p className="mt-2 text-sm text-sand-600">
          {isAdmin
            ? "Seluruh masukan dari Admin dan Seller — tersimpan di sini sejak dikirim."
            : "Ada fitur yang membingungkan, error, atau ide perbaikan? Tulis di sini — masukan kamu langsung masuk ke tim internal Serahin, bukan ke Buyer atau Seller lain."}
        </p>
      </header>

      {isAdmin ? <FeedbackList page={sp.page} /> : <KritikSaranForm />}
    </div>
  );
}

async function FeedbackList({ page: pageParam }: { page?: string }) {
  const page = Math.max(1, Number(pageParam) || 1);
  const res = await api.get<{ data: FeedbackRow[]; meta: { page: number; totalPages: number; total: number } }>("/feedback", { page, limit: 10 });

  if (res.data.length === 0) {
    return <EmptyState title="Belum ada masukan" description="Kritik & Saran dari Admin/Seller akan muncul di sini." />;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {res.data.map((row) => (
          <li key={row.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                  {row.actorType === "ADMIN" ? "Admin" : "Seller"}
                </span>
                <span className="ml-2 text-sm font-bold text-sand-900">{row.actorName}</span>
                {row.sellerName && <span className="ml-1 text-xs text-sand-500">· {row.sellerName}</span>}
              </div>
              <span className="text-xs text-sand-400">{formatTanggal(row.createdAt)}</span>
            </div>
            {row.actorEmail && <p className="mt-1 text-xs text-sand-400">{row.actorEmail}</p>}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-sand-700">{row.message}</p>
          </li>
        ))}
      </ul>
      {res.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-sand-600">
          <Link
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none text-sand-300" : "font-bold text-brand-700"}
            href={{ pathname: "/kritik-saran", query: { page: page - 1 } }}
          >
            Sebelumnya
          </Link>
          <span>Halaman {res.meta.page} dari {res.meta.totalPages} · {res.meta.total} masukan</span>
          <Link
            aria-disabled={page >= res.meta.totalPages}
            className={page >= res.meta.totalPages ? "pointer-events-none text-sand-300" : "font-bold text-brand-700"}
            href={{ pathname: "/kritik-saran", query: { page: page + 1 } }}
          >
            Berikutnya
          </Link>
        </div>
      )}
    </div>
  );
}
