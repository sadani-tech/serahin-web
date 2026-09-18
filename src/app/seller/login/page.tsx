import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { SellerAuthForm } from "../SellerAuthForm";

export default function SellerLoginPage() {
  return <PublicPageShell eyebrow="Seller" title="Masuk ke akun Seller" intro="Akun Seller hanya dapat dipakai setelah aplikasi disetujui dan aktivasi selesai.">
    <div className="mx-auto max-w-lg"><SellerAuthForm mode="login" /><p className="mt-4 text-center text-sm"><Link href="/seller" className="font-bold text-brand-700 underline">Belum menjadi Seller? Ajukan aplikasi</Link></p></div>
  </PublicPageShell>;
}
