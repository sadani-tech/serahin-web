import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { AuthShell } from "../AuthShell";
import { buyerLoginAction } from "@/lib/buyer-auth-actions";

export default async function BuyerLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl = "/account" } = await searchParams;
  return <AuthShell title="Masuk sebagai Buyer" copy="Lanjutkan pesanan dan pantau seluruh status PO Anda.">
    <AuthForm action={buyerLoginAction} hidden={{ callbackUrl }} submit="Masuk" fields={[
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "password", label: "Kata sandi", type: "password", autoComplete: "current-password" },
      { name: "rememberMe", label: "Ingat saya selama 30 hari", type: "checkbox", required: false },
    ]} footer={{ href: `/account/register?callbackUrl=${encodeURIComponent(callbackUrl)}`, label: "Belum punya akun? Daftar" }} />
    <p className="mt-3 text-center text-sm"><Link className="font-bold text-brand-700 hover:underline" href="/account/forgot-password">Lupa kata sandi?</Link></p>
  </AuthShell>;
}
