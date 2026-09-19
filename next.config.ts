import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const SCRIPT_POLICY = process.env.NODE_ENV === "production"
  ? "script-src 'self' 'unsafe-inline' https://accounts.google.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com";

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
      {
        source: "/storage/public/:path*",
        destination: `${API_URL}/storage/public/:path*`,
      },
    ];
  },
  async headers() {
    const values = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: `default-src 'self'; img-src 'self' data: blob: https:; ${SCRIPT_POLICY}; style-src 'self' 'unsafe-inline'; connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com; frame-src https://accounts.google.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'` },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
    ];
    return [{ source: "/(.*)", headers: values }];
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
