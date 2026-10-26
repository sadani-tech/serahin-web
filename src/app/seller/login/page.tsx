import Link from "next/link";
import { AuthShell } from "@/app/account/AuthShell";
import { SellerAuthForm } from "../SellerAuthForm";

export default function SellerLoginPage() {
  return <AuthShell title="Masuk sebagai Seller" copy="Kelola Batch PO, pesanan, pembayaran, dan progres toko Anda.">
    <SellerAuthForm mode="login" />
    <div className="mt-5 space-y-2 text-center text-sm text-sand-600">
      <p><Link href="/seller/forgot-password" className="font-bold text-brand-700 hover:underline">Lupa kata sandi?</Link></p>
      <p><Link href="/seller" className="font-bold text-brand-700 hover:underline">Belum menjadi Seller? Ajukan aplikasi</Link></p>
    </div>
  </AuthShell>;
}
