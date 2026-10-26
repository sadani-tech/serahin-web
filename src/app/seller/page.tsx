import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { SellerApplicationView } from "@/components/revamp/SellerApplicationView";

export const metadata: Metadata = {
  title: "Menjadi Seller Serahin",
  description:
    "Ketentuan, tanggung jawab, dan cara mengajukan diri sebagai Seller Serahin.",
  alternates: { canonical: "/seller" },
};

export default async function SellerPage() {
  const session = await getSession();
  return <SellerApplicationView loggedIn={Boolean(session)} role={session?.role} />;
}
