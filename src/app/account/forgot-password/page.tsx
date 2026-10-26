import { AuthForm } from "../AuthForm";
import { AuthShell } from "../AuthShell";
import { forgotPasswordAction } from "@/lib/buyer-auth-actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return <AuthShell title="Buat atau reset kata sandi" copy="Kami akan mengirim tautan aman jika email terdaftar."><AuthForm action={forgotPasswordAction} submit="Kirim tautan reset" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email", defaultValue: email }]} footer={{ href: "/account/login", label: "Kembali ke halaman masuk" }} /></AuthShell>;
}
