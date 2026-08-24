import Link from "next/link";
import { api } from "@/lib/api";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { badge } from "@/lib/domain";
import { formatWaktu } from "@/lib/format";
import type { PageStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageRow = {
  id: string;
  judul: string;
  slug: string;
  status: PageStatus;
  updatedAt: string;
};

export default async function KontenPage() {
  const [pages, faqs] = await Promise.all([
    api.list<PageRow>("/cms/pages"),
    api.list<unknown>("/cms/faq"),
  ]);
  const faqCount = faqs.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
            Konten
          </h1>
          <p className="mt-1 text-sm text-sand-500">
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
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
                  <th className="px-5 py-3 font-medium">Judul</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Diperbarui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-sand-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/konten/${p.id}`}
                        className="font-medium text-sand-900 hover:underline"
                      >
                        {p.judul}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs text-sand-500">/{p.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "PUBLISH" ? (
                        <span className={badge("bg-emerald-100 text-emerald-800 ring-emerald-600/20")}>
                          Publish
                        </span>
                      ) : (
                        <span className={badge("bg-sand-100 text-sand-600 ring-sand-600/20")}>
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sand-500">
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
