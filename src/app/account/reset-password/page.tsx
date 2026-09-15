import { AuthForm } from "../AuthForm";
import { AuthShell } from "../AuthShell";
import { resetPasswordAction } from "@/lib/buyer-auth-actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AuthShell title="Buat kata sandi baru" copy="Tautan reset hanya dapat digunakan satu kali.">
    {token ? <AuthForm action={resetPasswordAction} hidden={{ token }} submit="Simpan kata sandi" fields={[
      { name: "password", label: "Kata sandi baru", type: "password", autoComplete: "new-password" },
      { name: "confirmPassword", label: "Ulangi kata sandi", type: "password", autoComplete: "new-password" },
    ]} footer={{ href: "/account/login", label: "Masuk setelah kata sandi berubah" }} /> : <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">Token reset tidak ditemukan.</p>}
  </AuthShell>;
}
