import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // CI/verification dapat memakai direktori terpisah tanpa mengganggu proses
  // `next dev` yang sedang menggunakan `.next`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
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
  // Repo ini berdiri sendiri; cwd npm adalah root aplikasi dan tetap valid
  // ketika next.config dikompilasi sebagai ESM (tanpa global `__dirname`).
  turbopack: {
    root: process.cwd(),
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
