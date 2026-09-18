import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { getSession } from "@/lib/session";
import { CartPageClient } from "./CartPageClient";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false, follow: false } };

export default async function CartPage() {
  const session = await getSession();
  return <div className="bg-serahin-dots min-h-full"><PublicHeader loggedIn={Boolean(session)} role={session?.role} name={session?.name} email={session?.email} /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6"><CartPageClient /></main><PublicFooter /></div>;
}
