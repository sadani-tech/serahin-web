import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { getSession } from "@/lib/session";
import { CartPageClient } from "./CartPageClient";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false, follow: false } };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const session = await getSession();
  const { checkout } = await searchParams;
  const buyerProfile = session?.role === "BUYER"
    ? await api.get<{ name: string; email: string | null; phone: string | null }>("/auth/buyer/profile").catch(() => ({ name: session.name, email: session.email, phone: null }))
    : null;
  return <div className="bg-serahin-dots min-h-full"><PublicHeader loggedIn={Boolean(session)} role={session?.role} name={session?.name} email={session?.email} /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6"><CartPageClient resumeCheckout={checkout === "1"} switchingAccount={Boolean(session && session.role !== "BUYER")} buyerProfile={buyerProfile} /></main><PublicFooter /></div>;
}
