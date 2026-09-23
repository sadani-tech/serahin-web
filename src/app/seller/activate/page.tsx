import { PublicPageShell } from "@/components/PublicPageShell";
import { SellerAuthForm } from "../SellerAuthForm";

export default async function SellerActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <PublicPageShell eyebrow="Aktivasi Seller" title="Buat kata sandi akun Seller" intro="Tautan aktivasi berlaku terbatas dan hanya dapat digunakan satu kali." minimalHeader><div className="mx-auto max-w-lg"><SellerAuthForm mode="activate" token={token} /></div></PublicPageShell>;
}
