import type { ReactNode } from "react";

/**
 * Layout bersama seluruh /account/*. Sengaja TIDAK merender header di sini —
 * halaman AuthShell (login/register/activate/forgot/reset-password) sudah
 * punya chrome brand sendiri (panel gelap + link "Kembali ke Beranda"), jadi
 * header lama di sini akan dobel dan tidak konsisten dengan tema revamp.
 * Header untuk dashboard Buyer (Pesanan/Profil) ada di
 * (dashboard)/layout.tsx, yang hanya membungkus rute yang butuh header itu.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <div className="bg-serahin-dots min-h-full">{children}</div>;
}
