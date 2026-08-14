import type { NextConfig } from "next";
import path from "node:path";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Teruskan berkas unggahan (/uploads/*) ke backend yang menyajikannya, agar
  // bukti pembayaran & gambar varian tampil dari origin web (mis. saat dev
  // web:3000 ↔ api:4000).
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
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
