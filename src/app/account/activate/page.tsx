import { AuthForm } from "../AuthForm";
import { AuthShell } from "../AuthShell";
import { activateBuyerAction } from "@/lib/buyer-auth-actions";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string; callbackUrl?: string }> }) {
  const { token = "", callbackUrl = "/account" } = await searchParams;
  return <AuthShell title="Aktifkan akun" copy="Konfirmasi aktivasi untuk masuk dan melanjutkan pesanan.">
    {token ? <AuthForm action={activateBuyerAction} hidden={{ token, callbackUrl }} fields={[]} submit="Aktifkan akun" /> : <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">Token aktivasi tidak ditemukan.</p>}
  </AuthShell>;
}
