import { AuthShell } from "@/app/account/AuthShell";
import { SellerAuthForm } from "../SellerAuthForm";

export default function SellerForgotPasswordPage() {
  return (
    <AuthShell title="Lupa kata sandi Seller" copy="Kami akan mengirim tautan reset jika email terdaftar sebagai akun Seller aktif.">
      <SellerAuthForm mode="forgot" />
    </AuthShell>
  );
}
