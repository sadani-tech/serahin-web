import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit membaca berkas font (.afm) dari node_modules saat runtime; jangan
  // di-bundle agar berkas data tetap dapat ditemukan (v1.6 ekspor PDF).
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
