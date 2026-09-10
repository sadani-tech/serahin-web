import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { publicSite } from "@/lib/public-site";

// Nunito — sans-serif membulat yang senada dengan lambang Serahin (v1.9).
// Di-host sendiri saat build oleh next/font, jadi tidak ada request ke
// Google saat runtime.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicSite.url),
  title: "Serahin — Sistem Manajemen Pre-Order",
  description:
    "Kelola kampanye Pre-Order, pesanan, pembayaran, dan timeline produksi dalam satu tempat.",
  applicationName: "Serahin",
  authors: [{ name: publicSite.legalName }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#3D7940",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${nunito.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-sand-50 text-sand-900">
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
