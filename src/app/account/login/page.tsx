import { AuthForm } from "../AuthForm";
import { AuthShell, AuthWord } from "../AuthShell";
import { buyerLoginAction } from "@/lib/buyer-auth-actions";
import { ToastFeedback } from "@/components/Toast";
import { GoogleBuyerSignIn } from "@/components/GoogleBuyerSignIn";

export default async function BuyerLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; switched?: string }> }) {
  const { callbackUrl = "/account", switched } = await searchParams;
  return <AuthShell title={<>Masuk sebagai <AuthWord>Buyer</AuthWord></>} copy="Lanjutkan pesanan dan pantau seluruh status PO Anda.">
    <ToastFeedback info={switched === "1" ? "Masuk dengan akun Buyer untuk melanjutkan checkout atau pembayaran." : undefined} />
    <AuthForm action={buyerLoginAction} hidden={{ callbackUrl }} submit="Masuk" fields={[
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "password", label: "Kata sandi", type: "password", autoComplete: "current-password" },
      { name: "rememberMe", label: "Ingat saya selama 30 hari", type: "checkbox", required: false },
    ]} secondaryAction={{ href: "/account/forgot-password", label: "Lupa kata sandi?" }} footer={{ href: `/account/register?callbackUrl=${encodeURIComponent(callbackUrl)}`, label: "Belum punya akun? Daftar" }} social={<GoogleBuyerSignIn callbackUrl={callbackUrl} />} />
  </AuthShell>;
}
