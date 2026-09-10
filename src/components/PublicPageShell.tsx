import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

export function PublicPageShell({
  title,
  eyebrow,
  intro,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-serahin-dots min-h-full">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="text-sm font-bold text-brand-700 hover:underline"
        >
          ← Kembali ke beranda
        </Link>
        <header className="mt-6 rounded-3xl border border-brand-200 bg-cream-soft p-6 shadow-sm sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-sand-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-sand-600">
            {intro}
          </p>
        </header>
        <article className="prose-serahin mt-8 rounded-3xl border border-sand-200 bg-white p-6 shadow-sm sm:p-9">
          {children}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
