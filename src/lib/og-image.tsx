import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { publicSite } from "@/lib/public-site";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageAlt = "Serahin — Pre-Order Lebih Rapi";
export const ogImageContentType = "image/png";

function brandAsset(fileName: string) {
  const buffer = readFileSync(join(process.cwd(), "public", "brand", fileName));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export function renderOgImage() {
  const mark = brandAsset("serahin-mark-yellow.png");
  const wordmark = brandAsset("serahin-wordmark.png");
  const hostname = new URL(publicSite.url).hostname;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#f7f8ee",
          color: "#234426",
          fontFamily: "Arial, sans-serif",
          padding: "58px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 999,
            background: "#ffd600",
            opacity: 0.22,
            right: -80,
            top: -120,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: 999,
            background: "#f57223",
            opacity: 0.09,
            left: -130,
            bottom: -150,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 690,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", height: 55 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wordmark}
              alt=""
              width={205}
              height={48}
              style={{ objectFit: "contain", objectPosition: "left center" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              marginTop: 30,
              padding: "9px 16px",
              borderRadius: 999,
              background: "#fff0df",
              color: "#c94f08",
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 1.3,
            }}
          >
            UNTUK SELLER &amp; BUYER
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              maxWidth: 680,
              fontSize: 53,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: -1.7,
            }}
          >
            Pre-order lebih rapi, dari katalog hingga pengiriman.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 18,
              maxWidth: 625,
              color: "#5a6c58",
              fontSize: 22,
              lineHeight: 1.42,
            }}
          >
            Satu ruang untuk membuka Batch PO, menerima pesanan, memantau pembayaran, dan menjaga Buyer tetap terinformasi.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "auto",
              gap: 11,
              color: "#3d7940",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex", padding: "9px 13px", border: "2px solid #dce6ca", borderRadius: 10, background: "#ffffff" }}>Katalog Buyer</span>
            <span style={{ display: "flex", padding: "9px 13px", border: "2px solid #dce6ca", borderRadius: 10, background: "#ffffff" }}>Kelola Batch PO</span>
            <span style={{ display: "flex", padding: "9px 13px", border: "2px solid #dce6ca", borderRadius: 10, background: "#ffffff" }}>Status transparan</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 340,
            height: 430,
            marginLeft: "auto",
            marginTop: 34,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              width: 300,
              height: 370,
              borderRadius: 42,
              background: "#f57223",
              transform: "rotate(7deg)",
              opacity: 0.9,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              width: 300,
              height: 370,
              borderRadius: 42,
              background: "#fff7c9",
              border: "4px solid #3d7940",
              boxShadow: "0 24px 50px rgba(42, 77, 45, 0.18)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} alt="" width={225} height={225} style={{ objectFit: "contain" }} />
            <div style={{ display: "flex", marginTop: 24, color: "#3d7940", fontSize: 18, fontWeight: 800, letterSpacing: 0.4 }}>
              {hostname}
            </div>
          </div>
        </div>
      </div>
    ),
    ogImageSize,
  );
}
