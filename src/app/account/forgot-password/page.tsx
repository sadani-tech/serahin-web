import { AuthForm } from "../AuthForm";
import { AuthShell } from "../AuthShell";
import { forgotPasswordAction } from "@/lib/buyer-auth-actions";

export default function ForgotPasswordPage() {
  return <AuthShell title="Lupa kata sandi" copy="Kami akan mengirim tautan reset jika email terdaftar."><AuthForm action={forgotPasswordAction} submit="Kirim tautan reset" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]} footer={{ href: "/account/login", label: "Kembali ke halaman masuk" }} /></AuthShell>;
}
