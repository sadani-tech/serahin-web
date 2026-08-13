import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Monorepo: tetapkan root ke akar workspace (dua level di atas apps/web) agar
  // Turbopack tidak salah menebak root & warning "multiple lockfiles" hilang.
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
  // pdfkit membaca berkas font (.afm) dari node_modules saat runtime; jangan
  // di-bundle agar berkas data tetap dapat ditemukan (v1.6 ekspor PDF).
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Server Action menerima unggahan bukti pembayaran hingga 5MB; default
    // limit 1MB terlalu kecil. Beri ruang untuk file + overhead form.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
