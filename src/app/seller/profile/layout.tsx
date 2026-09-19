import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/(app)/AppShell";
import { getSession } from "@/lib/session";

export default async function SellerProfileLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session?.role !== "SELLER") redirect("/seller/login");
  return <AppShell user={{ name: session.name, email: session.email ?? undefined, role: "SELLER" }}>{children}</AppShell>;
}
