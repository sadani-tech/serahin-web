import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { badge } from "@/lib/domain";
import { formatWaktu } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function KontenPage() {
  const [pages, faqCount] = await Promise.all([
    prisma.staticPage.findMany({
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    }),
    prisma.faqEntry.count(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Konten
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola halaman statis (S&K, Tentang) dan FAQ yang tampil di halaman
            publik.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/konten/faq" variant="secondary">
            Kelola FAQ ({faqCount})
          </LinkButton>
          <LinkButton href="/konten/baru">+ Halaman Baru</LinkButton>
        </div>
      </div>

      <Card>
        {pages.length === 0 ? (
          <EmptyState
            title="Belum ada halaman"
            description="Buat halaman statis pertama Anda, mis. Syarat & Ketentuan."
            action={<LinkButton href="/konten/baru">+ Halaman Baru</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Judul</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Diperbarui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/konten/${p.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {p.judul}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs text-slate-500">/{p.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "PUBLISH" ? (
                        <span className={badge("bg-emerald-100 text-emerald-800 ring-emerald-600/20")}>
                          Publish
                        </span>
                      ) : (
                        <span className={badge("bg-slate-100 text-slate-600 ring-slate-600/20")}>
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatWaktu(p.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
