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
  // Tidak ada background di sini (dulu bg-serahin-dots) — AuthShell (dipakai
  // rute login/register/dll di grup ini) sudah bawa background hijaunya
  // sendiri secara mandiri, termasuk di belakang PublicFooter yang
  // transparan (bg-white/70) agar tidak ada "sisa" dots cream mengintip di
  // baliknya. Dashboard Buyer (Pesanan/Profil) punya background dots-nya
  // sendiri — lihat (dashboard)/layout.tsx.
  return <div className="min-h-full">{children}</div>;
}
