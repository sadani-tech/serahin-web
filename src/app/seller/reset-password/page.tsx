import { AuthShell } from "@/app/account/AuthShell";
import { SellerAuthForm } from "../SellerAuthForm";

export default async function SellerResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <AuthShell title="Buat kata sandi baru" copy="Tautan reset hanya dapat digunakan satu kali dan berlaku 30 menit.">
      {token ? (
        <SellerAuthForm mode="reset" token={token} />
      ) : (
        <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">Token reset tidak ditemukan.</p>
      )}
    </AuthShell>
  );
}
