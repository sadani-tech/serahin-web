import type { MetadataRoute } from "next";

// Web App Manifest — membuat Serahin bisa di-"Install app"/"Add to Home
// Screen" di Android (Chrome) dan menampilkan ikon+nama yang benar saat
// ditambahkan ke layar utama. Dipakai di /panduan/aplikasi (v2.3.9).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Serahin — Pre-Order Lebih Rapi",
    short_name: "Serahin",
    description: "Kelola Pre-Order/Batch PO, pembayaran, dan pesanan Buyer dalam satu tempat.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9ec",
    theme_color: "#336635",
    icons: [
      { src: "/icon.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "1254x1254", type: "image/png", purpose: "maskable" },
    ],
  };
}
