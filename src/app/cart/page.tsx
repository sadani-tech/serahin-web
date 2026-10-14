import type { Metadata } from "next";
import { IconSprite } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";
import { getSession } from "@/lib/session";
import { CartPageClient } from "./CartPageClient";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false, follow: false } };

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#testimonial", label: "Testimonial" },
  { href: "/#faq", label: "FAQ" },
];

export default async function CartPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const session = await getSession();
  const { checkout } = await searchParams;
  const buyerProfile = session?.role === "BUYER"
    ? await api.get<{ name: string; email: string | null; phone: string | null; avatarUrl: string | null }>("/auth/buyer/profile").catch(() => ({ name: session.name, email: session.email, phone: null, avatarUrl: null }))
    : null;
  return (
    <div className="rv-scope js is-loaded">
      <IconSprite />
      <RevampHeader navLinks={NAV_LINKS} loggedIn={Boolean(session)} role={session?.role} />
      <main className="cart-page">
        <CartPageClient resumeCheckout={checkout === "1"} switchingAccount={Boolean(session && session.role !== "BUYER")} buyerProfile={buyerProfile} />
      </main>
      <RevampFooter />
    </div>
  );
}
