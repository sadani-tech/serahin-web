import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serahin — Sistem Manajemen Pre-Order",
  description:
    "Kelola kampanye Pre-Order, pesanan, pembayaran, dan timeline produksi dalam satu tempat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-slate-900">
        {children}
      </body>
    </html>
  );
}
