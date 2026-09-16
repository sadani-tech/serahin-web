import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";
import { SerahinLogo } from "@/components/brand";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  const isBuyer = user?.role === "BUYER";
  return <div className="bg-serahin-dots min-h-full"><header className="border-b border-sand-200 bg-white"><nav className="mx-auto flex min-h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6"><SerahinLogo href="/" size="sm" />{isBuyer && <><Link href="/account" className="ml-auto rounded-lg px-2 py-2 text-sm font-bold text-sand-700 hover:bg-brand-50 hover:text-brand-700">Pesanan Saya</Link><Link href="/account/profile" className="rounded-lg px-2 py-2 text-sm font-bold text-sand-700 hover:bg-brand-50 hover:text-brand-700">Profil</Link><form action={logoutAction}><button className="rounded-lg px-2 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">Keluar</button></form></>}</nav></header>{children}</div>;
}
