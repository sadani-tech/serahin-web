import Link from "next/link";
import { auth, signOut } from "@/auth";
import { NavLinks } from "@/components/nav";
import { Button } from "@/components/ui";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-slate-900">
              Serahin
            </Link>
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" type="submit">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 py-4">
        <p className="mx-auto max-w-6xl px-4 text-xs text-slate-400">
          Serahin · Sistem Manajemen Pre-Order v1.0
        </p>
      </footer>
    </div>
  );
}
