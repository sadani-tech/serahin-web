import { AuthForm } from "../AuthForm";
import { AuthShell } from "../AuthShell";
import { buyerRegisterAction } from "@/lib/buyer-auth-actions";

export default async function BuyerRegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl = "/account" } = await searchParams;
  return <AuthShell title="Daftar akun Buyer" copy="Pilihan produk Anda tetap tersimpan saat membuat akun.">
    <AuthForm action={buyerRegisterAction} hidden={{ callbackUrl }} submit="Daftar" fields={[
      { name: "name", label: "Nama lengkap", autoComplete: "name" },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "phone", label: "Nomor WhatsApp", type: "tel", autoComplete: "tel" },
      { name: "password", label: "Kata sandi (min. 8 karakter)", type: "password", autoComplete: "new-password" },
      { name: "confirmPassword", label: "Ulangi kata sandi", type: "password", autoComplete: "new-password" },
      { name: "acceptPolicies", label: "Saya menyetujui Syarat & Ketentuan, Kebijakan Privasi, dan Kebijakan Refund Serahin.", type: "checkbox", required: true },
    ]} footer={{ href: `/account/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, label: "Sudah punya akun? Masuk" }} success={{ title: "Pendaftaran berhasil", copy: "Kami sudah mengirim email aktivasi ke alamat yang Anda daftarkan. Buka email tersebut dan tekan tombol Aktifkan akun untuk menyelesaikan pendaftaran." }} />
  </AuthShell>;
}
