import { ImageResponse } from "next/og";
import { publicSite } from "@/lib/public-site";

// Renderer bersama untuk kartu preview 1200x630 (Open Graph & X/Twitter) yang
// muncul saat link Serahin dibagikan ke WhatsApp / X / Facebook / LinkedIn /
// Slack / Telegram. Digambar dari kode (tanpa file gambar) memakai lambang
// Serahin. Dipakai oleh `src/app/opengraph-image.tsx` & `twitter-image.tsx`.

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageAlt = "Serahin — Sistem Manajemen Pre-Order";
export const ogImageContentType = "image/png";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#FFD600"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#F57223" stroke-width="2.6"><path d="M32 13.5V9.5"/><path d="M39.4 14.7L41.2 10.8"/><path d="M24.6 14.7L22.8 10.8"/><path d="M45.4 19.2L48.6 16.5"/><path d="M18.6 19.2L15.4 16.5"/></g><path d="M25 28.5V26a7 7 0 0 1 14 0v2.5" stroke="#3D7940" stroke-width="2.9"/><path d="M18.6 28.5h26.8q3.5 0 3 3.5l-2.5 13.5q-.5 4.4-4 4.4H21.1q-3.5 0-4-4.4L14.6 32q-.5-3.5 3-3.5Z" fill="#F1F5DC" stroke="#3D7940" stroke-width="2.9"/><g fill="#3D7940"><circle cx="25" cy="28.5" r="2.2"/><circle cx="39" cy="28.5" r="2.2"/></g><path d="M32 44.2c0 0-7.4-4.6-7.4-8.5 0-2.4 1.8-3.9 3.9-3.9 1.7 0 3 1.1 3.5 2.2.5-1.1 1.8-2.2 3.5-2.2 2 0 3.9 1.5 3.9 3.9C39.4 39.6 32 44.2 32 44.2Z" stroke="#F57223" stroke-width="2.7"/><path d="M29.9 37.1q2.1 2.3 4.2 0" stroke="#F57223" stroke-width="2.1"/></g></svg>`;

export function renderOgImage(): ImageResponse {
  const logo = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;
  const host = publicSite.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #3D7940 0%, #2C5A30 100%)",
          color: "#F1F5DC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={132} height={132} alt="" />
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Serahin
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: "#FFFFFF" }}>
            Sistem Manajemen Pre-Order
          </div>
          <div style={{ fontSize: 30, color: "#C9DEB9" }}>
            Kelola kampanye, pesanan, pembayaran, dan timeline produksi dalam satu tempat.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            color: "#FFD600",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "9999px",
              background: "#FFD600",
            }}
          />
          {host}
        </div>
      </div>
    ),
    { ...ogImageSize },
  );
}
