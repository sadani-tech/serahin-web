import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConfirmProvider } from "@/components/ConfirmDialog";

export const metadata: Metadata = {
  title: "Serahin — Sistem Manajemen Pre-Order",
  description:
    "Kelola kampanye Pre-Order, pesanan, pembayaran, dan timeline produksi dalam satu tempat.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-slate-900">
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
