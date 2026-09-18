import Link from "next/link";
import { AuthShell } from "@/app/account/AuthShell";
import { SellerAuthForm } from "../SellerAuthForm";

export default function SellerLoginPage() {
  return <AuthShell title="Masuk sebagai Seller" copy="Kelola Batch PO, pesanan, pembayaran, dan progres toko Anda.">
    <SellerAuthForm mode="login" />
    <div className="mt-5 space-y-2 text-center text-sm text-sand-600">
      <p><Link href="/seller" className="font-bold text-brand-700 hover:underline">Belum menjadi Seller? Ajukan aplikasi</Link></p>
      <p><Link href="/" className="font-bold text-sand-500 hover:text-brand-700 hover:underline">← Kembali ke beranda</Link></p>
    </div>
  </AuthShell>;
}
