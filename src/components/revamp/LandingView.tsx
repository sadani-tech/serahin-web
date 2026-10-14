"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { IconSprite, Icon } from "./IconSprite";
import { RevampHeader } from "./RevampHeader";
import { usePageLoaded, useReveal, usePinnedSteps, usePinnedTestimonials, usePlayground } from "./hooks";

const NAV_LINKS = [
  { href: "#kenapa", label: "Kenapa Serahin" },
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#testimonial", label: "Testimonial" },
  { href: "#faq", label: "FAQ" },
];

const MODULES = [
  { icon: "/revamp/modules/mod-icon-kampanye.svg", label: "Kampanye" },
  { icon: "/revamp/modules/mod-icon-pesanan.svg", label: "Pesanan" },
  { icon: "/revamp/modules/mod-icon-pembayaran.svg", label: "Pembayaran" },
  { icon: "/revamp/modules/mod-icon-produksi.svg", label: "Produksi" },
  { icon: "/revamp/modules/mod-icon-vendor.svg", label: "Vendor" },
  { icon: "/revamp/modules/mod-icon-laporan.svg", label: "Laporan" },
];

const COMPARE = {
  pakai: {
    items: [
      "Buyer memantau status sendiri lewat satu tautan pribadi",
      "Pembayaran terverifikasi dan sisa tagihan terhitung otomatis",
      "Seluruh pesanan terkumpul di satu dashboard",
      "Kuota diperbarui real-time, risiko oversell berkurang",
    ],
  },
  tanpa: {
    items: [
      "Pelanggan terus menanyakan status pesanan",
      "Bukti transfer tercecer di banyak chat",
      "Spreadsheet dengan puluhan versi revisi",
      "Sisa kuota sulit dipastikan",
    ],
  },
};

const FEATURES_SELLER = [
  { icon: "f-kampanye", kicker: "Kampanye & Kuota", title: "Atur sekali, berjalan rapi", text: "Tentukan periode, varian, harga, warna, gambar, dan kuota dalam satu kampanye. Kuota aktif dihitung otomatis untuk membantu mencegah oversell.", img: "/revamp/fitur-seller-kampanye.webp" },
  { icon: "f-pesanan", kicker: "Pesanan Terpusat", title: "Tetap terkendali saat order ramai", text: "Kelola pesanan multi-varian, status, pembatalan, dan riwayat buyer dari satu layar. Filter dan aksi massal mempercepat pekerjaan.", img: "/revamp/fitur-seller-pesanan-terpusat.webp" },
  { icon: "f-dp", kicker: "DP & Pelunasan", title: "Skema pembayaran sesuai kebutuhanmu", text: "Pilih lunas langsung, DP persentase, atau DP nominal. Sisa tagihan mengikuti pembayaran yang sudah benar-benar terverifikasi.", img: "/revamp/fitur-seller-dp-pelunasan.webp" },
  { icon: "f-timeline", kicker: "Timeline Produksi", title: "Update tanpa harus dijelaskan", text: "Catat progres dari PO ditutup, produksi, siap kirim, hingga selesai. Riwayat status terbaca jelas oleh tim maupun buyer.", img: "/revamp/fitur-seller-timeline.webp" },
];

const FEATURES_BUYER = [
  { icon: "f-tanpa-akun", kicker: "Pesan Tanpa Akun", title: "Satu tautan, langsung pesan", text: "Pilih varian, isi data pengiriman, dan pesananmu langsung tercatat. Tidak perlu mendaftar atau mengingat kata sandi.", img: "/revamp/fitur-buyer-tanpa-akun.webp" },
  { icon: "f-portal", kicker: "Portal Pribadi", title: "Semua info pesanan di satu tempat", text: "Setiap pesanan punya tautan pribadi berisi rincian, status terbaru, dan sisa tagihan. Buka kapan saja dari ponsel.", img: "/revamp/fitur-buyer-portal-pribadi.webp" },
  { icon: "f-bukti", kicker: "Bukti Pembayaran", title: "Kirim bukti DP tanpa chat bolak-balik", text: "Unggah bukti transfer langsung dari portal. Status berubah begitu seller memverifikasi, dan sisa tagihan ikut diperbarui.", img: "/revamp/fitur-buyer-bukti-pembayaran.webp" },
  { icon: "f-progress", kicker: "Progres & Pengiriman", title: "Tahu progres tanpa harus bertanya", text: "Ikuti tahap produksi hingga pengiriman, lengkap dengan nomor resi saat paket sudah dalam perjalanan.", img: "/revamp/fitur-buyer-progress.webp" },
];

const STEPS = [
  { title: "Buat kampanye", text: "Isi produk, varian, kuota, harga, dan skema pembayaran." },
  { title: "Bagikan link Pre-Order", text: "Sebarkan lewat Instagram, WhatsApp, atau kanal lain. Buyer bisa langsung memesan tanpa mendaftar." },
  { title: "Pantau dari dashboard", text: "Verifikasi pembayaran, cek kuota, dan lihat tagihan dalam sekali pandang." },
  { title: "Selesaikan dengan tenang", text: "Bagikan progres, catat pengiriman, dan tutup kampanye dengan riwayat yang tertata." },
];

const TESTIMONIALS = [
  { name: "Rani Pratiwi", role: "Dari Seller", buyer: false, quote: "Biasanya kelabakan mengurus form order dan pelunasan. Sekarang jauh lebih mudah dipantau." },
  { name: "Dimas Aditya", role: "Dari Buyer", buyer: true, quote: "Punyaku sudah sampai, aslinya bagus banget. Bagian dalamnya juga gemas." },
  { name: "Nadia Kusuma", role: "Dari Seller", buyer: false, quote: "Serahin sangat membantu. Dulu pakai Excel yang butuh koordinasi sana-sini, sekarang tinggal kirim link, selesai." },
  { name: "Salsabila Nurul", role: "Dari Buyer", buyer: true, quote: "Aku suka banget. Begitu datang langsung pengin dipakai ke mana-mana." },
];

const FAQS = [
  { q: "Serahin cocok untuk bisnis apa?", a: "Untuk semua penjualan berbasis pre-order, seperti fesyen, merchandise, kerajinan, atau produk batch lain yang memiliki periode, varian, dan kuota." },
  { q: "Apakah buyer harus membuat akun?", a: "Tidak. Buyer cukup membuka tautan pre-order, memilih varian, dan mengisi data pengiriman. Setelah memesan, buyer mendapat tautan pribadi untuk memantau pesanannya." },
  { q: "Apakah mendukung pembayaran DP?", a: "Ya. Kamu bisa memilih lunas langsung, DP persentase, atau DP nominal. Sisa tagihan dihitung otomatis dari pembayaran yang sudah terverifikasi." },
  { q: "Bagaimana dengan notifikasi WhatsApp?", a: "Serahin menyiapkan pesan update yang bisa langsung kamu teruskan lewat WhatsApp, misalnya saat pembayaran terverifikasi atau produksi selesai. Buyer juga selalu bisa melihat status terbaru dari tautan pribadinya." },
];

const CHIPS: { text?: string; x: number; y: number; r: number; logo?: boolean }[] = [
  { text: "Pre-order lebih rapi", x: 0.13, y: 0.28, r: -6 },
  { text: "Kuota real-time", x: 0.3, y: 0.72, r: 0 },
  { x: 0.455, y: 0.55, r: 0, logo: true },
  { text: "Bayar terverifikasi", x: 0.58, y: 0.3, r: 7 },
  { text: "DP fleksibel", x: 0.71, y: 0.72, r: 0 },
  { text: "Buyer tanpa akun", x: 0.855, y: 0.3, r: 6 },
];

export function LandingView({
  loggedIn,
  role,
}: {
  loggedIn: boolean;
  role?: "ADMIN" | "BUYER" | "SELLER";
}) {
  const loaded = usePageLoaded();
  const rootRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const testiRef = useRef<HTMLElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);

  useReveal(rootRef);
  usePinnedSteps(stepsRef, STEPS.length);
  usePinnedTestimonials(testiRef, TESTIMONIALS.length);
  usePlayground(arenaRef);

  const [tab, setTab] = useState<0 | 1>(0);
  const [compareActive, setCompareActive] = useState<0 | 1>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subscribeState, setSubscribeState] = useState<"idle" | "error" | "ok">("idle");

  function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    setSubscribeState(ok ? "ok" : "error");
    if (ok) {
      e.currentTarget.reset();
      setTimeout(() => setSubscribeState("idle"), 6000);
    }
  }

  const features = tab === 0 ? FEATURES_SELLER : FEATURES_BUYER;

  return (
    <div ref={rootRef} className={`rv-scope js${loaded ? " is-loaded" : ""}`}>
      <IconSprite />
      <RevampHeader navLinks={NAV_LINKS} loggedIn={loggedIn} role={role} />

      <main id="main">
        {/* ===== Hero ===== */}
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero__copy">
            <svg className="hero__decor" viewBox="0 0 529 525" fill="currentColor" aria-hidden="true">
              <path d="M396.226 499.82V525H132.297V499.82H396.226ZM420.698 480.606L445.17 486.574C439.752 508.776 420.079 524.502 397.311 524.988L396.226 525V499.82C407.839 499.82 417.946 491.883 420.698 480.606ZM503.81 279.897V277.042C503.81 265.187 494.194 255.576 482.334 255.576H46.6663C34.8061 255.576 25.1905 265.187 25.1905 277.042V282.396C25.1905 291.293 32.4071 298.507 41.3084 298.507C52.5973 298.507 62.4973 305.913 65.7363 316.634L66.0291 317.682L107.896 480.893C110.753 492.031 120.794 499.82 132.297 499.82V525C109.651 525 89.8366 509.906 83.7731 488.187L83.4951 487.149L41.6282 323.935C41.6001 323.826 41.5187 323.742 41.4167 323.706L41.3084 323.687C18.4947 323.687 0 305.2 0 282.396V277.042C0 251.683 20.245 231.049 45.4609 230.41L46.6663 230.396H482.334C508.106 230.396 529 251.281 529 277.042V279.897C529 304.081 509.387 323.686 485.192 323.687C485.031 323.687 484.889 323.798 484.85 323.955L445.17 486.571L420.698 480.606L460.378 317.987C463.169 306.552 473.418 298.507 485.192 298.507L486.149 298.482C495.986 297.984 503.81 289.854 503.81 279.897Z" />
              <path d="M88.3012 57.2252C97.8681 50.2778 111.259 52.3984 118.21 61.9611L156.707 114.925C163.657 124.488 161.536 137.873 151.969 144.821C142.402 151.769 129.013 149.648 122.062 140.085L83.5632 87.1213C76.6129 77.5584 78.7344 64.1729 88.3012 57.2252ZM410.788 61.9611C417.739 52.3984 431.13 50.278 440.697 57.2252C450.264 64.1729 452.386 77.5584 445.435 87.1213L406.939 140.085C399.988 149.648 386.597 151.769 377.03 144.821C367.463 137.873 365.341 124.488 372.292 114.925L410.788 61.9611ZM243.087 86.8705V21.4029C243.087 9.58243 252.674 6.22932e-05 264.499 0C276.325 0 285.911 9.58239 285.911 21.4029V86.8705C285.911 98.691 276.325 108.273 264.499 108.273C252.674 108.273 243.087 98.691 243.087 86.8705Z" />
              <path d="M129.613 246.763C138.251 180.692 194.784 129.676 263.239 129.676C331.693 129.676 388.227 180.692 396.865 246.763V288.309H366.298V246.763C357.917 197.444 314.965 159.892 263.239 159.892C211.512 159.892 168.56 197.444 160.179 246.763V288.309H129.613V246.763Z" />
              <path d="M264.5 436.871C250.06 436.871 237.452 428.095 230.706 415.05C227.968 409.755 232.405 404.137 238.368 404.137C242.06 404.137 245.275 406.433 247.508 409.371C251.597 414.752 257.692 418.165 264.5 418.165C271.308 418.165 277.404 414.752 281.493 409.371C283.726 406.433 286.941 404.137 290.633 404.137C296.596 404.137 301.033 409.755 298.295 415.05C291.548 428.095 278.941 436.871 264.5 436.871Z" />
              <path d="M176.334 295.863C176.334 311.16 163.928 323.561 148.624 323.561C133.321 323.561 120.915 311.16 120.915 295.863C120.915 280.566 133.321 268.166 148.624 268.166C163.928 268.166 176.334 280.566 176.334 295.863Z" />
              <path d="M409.346 295.863C409.346 311.16 396.94 323.561 381.636 323.561C366.333 323.561 353.927 311.16 353.927 295.863C353.927 280.566 366.333 268.166 381.636 268.166C396.94 268.166 409.346 280.566 409.346 295.863Z" />
              <path d="M234.272 382.734C234.272 388.992 229.197 394.065 222.936 394.065C216.676 394.065 211.6 388.992 211.6 382.734C211.6 376.476 216.676 371.403 222.936 371.403C229.197 371.403 234.272 376.476 234.272 382.734Z" />
              <path d="M314.881 382.734C314.881 388.992 309.806 394.065 303.546 394.065C297.285 394.065 292.21 388.992 292.21 382.734C292.21 376.476 297.285 371.403 303.546 371.403C309.806 371.403 314.881 376.476 314.881 382.734Z" />
              <path d="M264.498 333.233C289.642 313.045 327.304 308.573 351.599 330.076C412.519 384.225 328.017 452.791 272.03 484.507C269.909 486.291 267.256 487.229 264.498 487.229C262.43 487.229 260.614 486.484 258.796 485.522L256.965 484.507C201.416 453.038 117.796 385.293 175.997 331.347L177.396 330.076C201.797 308.573 239.46 313.045 264.498 333.233ZM248.682 352.831C230.244 337.965 206.708 337.862 194.1 348.924C183.452 358.401 181.348 366.145 181.443 372.191C181.558 379.468 185.009 389.062 193.635 400.786C208.917 421.557 235.085 441.793 259.407 456.711C262.532 458.627 266.463 458.627 269.588 456.711C293.911 441.793 320.081 421.557 335.363 400.786C343.99 389.062 347.437 379.468 347.553 372.191C347.648 366.139 345.54 358.384 334.861 348.892C322.401 337.909 298.887 337.919 280.274 352.863L270.789 360.479C267.097 363.444 261.839 363.438 258.153 360.467L248.682 352.831Z" />
            </svg>
            <span className="hero__fade" aria-hidden="true" />

            <a href="#cara-kerja" className="spin-badge spin-badge--corner" aria-label="Lihat cara kerja Serahin">
              <svg className="spin-badge__ring" viewBox="0 0 200 200" aria-hidden="true">
                <defs><path id="badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
                <text><textPath href="#badge-circle" startOffset="0">Lihat Cara Kerja • Serahin • Lihat Cara Kerja • Serahin •</textPath></text>
              </svg>
              <span className="spin-badge__core"><Image src="/revamp/serahin-icon.webp" alt="" width={56} height={54} /></span>
            </a>

            <h1 className="hero__title" id="hero-title">
              <span className="hero__line"><span>Kelola pre-order.</span></span>
              <span className="hero__line hero__line--accent">
                <span><em>Tanpa repot.</em></span>
              </span>
            </h1>
            <p className="hero__lead" data-reveal style={{ "--d": ".35s" } as React.CSSProperties}>
              Dari kampanye dibuka sampai barang terkirim, semua tersusun dalam satu alur. Kamu tidak perlu lagi membagi waktu antara spreadsheet, chat, dan bukti transfer.
            </p>

            <div className="btn-row" data-reveal style={{ "--d": ".45s" } as React.CSSProperties}>
              <Link href="/seller/login" className="btn btn--primary">
                <span>Mulai Jualan</span>
                <span className="btn__icon"><Icon name="arrow" /></span>
              </Link>
              <Link href="/catalog" className="btn btn--ghost">
                <span>Lihat Katalog<span className="hide-sm"> Serahin</span></span>
                <span className="btn__icon"><Icon name="arrow" /></span>
              </Link>
            </div>

            <ul className="hero__chips" aria-label="Keunggulan singkat">
              <li className="tag" data-reveal style={{ "--d": ".55s" } as React.CSSProperties}><span className="tag__check"><Icon name="check" /></span>Buyer tidak perlu membuat akun</li>
              <li className="tag" data-reveal style={{ "--d": ".62s" } as React.CSSProperties}><span className="tag__check"><Icon name="check" /></span>Nyaman diakses dari ponsel</li>
              <li className="tag" data-reveal style={{ "--d": ".69s" } as React.CSSProperties}><span className="tag__check"><Icon name="check" /></span>DP &amp; pelunasan fleksibel</li>
            </ul>
          </div>
        </section>

        {/* ===== Semua yang kamu butuhkan ===== */}
        <section className="modules" aria-labelledby="modules-title">
          <div className="modules__grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
          </div>
          <div className="modules__glow" aria-hidden="true" />
          <ul className="modules__fan" data-fan aria-label="Modul Serahin">
            {MODULES.map((m, i) => (
              <li key={m.label} className="mod" style={{ "--i": i } as React.CSSProperties}>
                <span className="mod__icon"><img src={m.icon} alt="" width={28} height={28} /></span>
                <span className="mod__label">{m.label}</span>
              </li>
            ))}
          </ul>
          <h2 className="modules__title" id="modules-title" data-reveal>Semua yang kamu<br /> butuhkan terpenuhi</h2>
        </section>

        {/* ===== Kenapa Serahin ===== */}
        <section className="section kenapa" id="kenapa" aria-labelledby="kenapa-title">
          <header className="section-head">
            <p className="eyebrow" data-reveal>Kenapa Serahin?</p>
            <h2 className="h2" id="kenapa-title" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>Proses pre-order yang disederhanakan.</h2>
          </header>

          <div className="compare-switch" role="group" aria-label="Pilih perbandingan" data-active={compareActive}>
            <span className="compare-switch__thumb" aria-hidden="true" />
            <button type="button" className="compare-switch__btn" aria-pressed={compareActive === 0} onClick={() => setCompareActive(0)}>Pakai Serahin</button>
            <button type="button" className="compare-switch__btn" aria-pressed={compareActive === 1} onClick={() => setCompareActive(1)}>Tanpa Serahin</button>
          </div>

          <div className="compare">
            <button type="button" className={`compare__card compare__card--pakai${compareActive === 0 ? " is-active" : ""}`} aria-pressed={compareActive === 0} onClick={() => setCompareActive(0)} data-reveal>
              <span className="compare__glow" aria-hidden="true" />
              <span className="compare__badge" aria-hidden="true">
                <img className="compare__badge-off" src="/revamp/check-unselect.svg" alt="" width={178} height={178} />
                <img className="compare__badge-on" src="/revamp/check-select.svg" alt="" width={178} height={178} />
              </span>
              <span className="compare__pill">Pakai Serahin</span>
              <span className="compare__list">
                {COMPARE.pakai.items.map((item) => (
                  <span key={item} className="compare__item"><span className="compare__tick"><Icon name="check" /></span>{item}</span>
                ))}
              </span>
            </button>

            <button type="button" className={`compare__card compare__card--tanpa${compareActive === 1 ? " is-active" : ""}`} aria-pressed={compareActive === 1} onClick={() => setCompareActive(1)} data-reveal style={{ "--d": ".1s" } as React.CSSProperties}>
              <span className="compare__glow" aria-hidden="true" />
              <span className="compare__badge" aria-hidden="true">
                <img className="compare__badge-off" src="/revamp/close-unselect.svg" alt="" width={178} height={178} />
                <img className="compare__badge-on" src="/revamp/close-select.svg" alt="" width={178} height={178} />
              </span>
              <span className="compare__pill">Tanpa Serahin</span>
              <span className="compare__list">
                {COMPARE.tanpa.items.map((item) => (
                  <span key={item} className="compare__item"><span className="compare__tick"><Icon name="check" /></span>{item}</span>
                ))}
              </span>
            </button>
          </div>
        </section>

        {/* ===== Fitur ===== */}
        <section className="panel fitur" id="fitur" aria-labelledby="fitur-title">
          <header className="section-head">
            <p className="eyebrow" data-reveal>Fitur Serahin</p>
            <h2 className="h2" id="fitur-title" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>Satu platform, dua sisi yang<br /> sama-sama terbantu</h2>
          </header>

          <div className="tabs" role="tablist" aria-label="Fitur berdasarkan pengguna" data-active={tab} data-reveal style={{ "--d": ".14s" } as React.CSSProperties}>
            <span className="tabs__indicator" aria-hidden="true" />
            <button className="tabs__btn" role="tab" aria-selected={tab === 0} type="button" onClick={() => setTab(0)}>Untuk Seller</button>
            <button className="tabs__btn" role="tab" aria-selected={tab === 1} type="button" onClick={() => setTab(1)}>Untuk Buyer</button>
          </div>

          <div className="feature-grid" id={tab === 0 ? "panel-seller" : "panel-buyer"} role="tabpanel">
            {features.map((f) => (
              <article key={f.title} className="feature">
                <div className="feature__body">
                  <span className="feature__icon"><Icon name={f.icon} raw /></span>
                  <p className="feature__kicker">{f.kicker}</p>
                  <h3 className="feature__title">{f.title}</h3>
                  <p className="feature__text">{f.text}</p>
                </div>
                <div className="feature__media">
                  <img className="feature__img" src={f.img} alt="" loading="lazy" width={280} height={280} />
                  <span className="feature__frost" aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ===== Cara Kerja ===== */}
        <section className="cara" id="cara-kerja" aria-labelledby="cara-title" ref={stepsRef}>
          <div className="cara__sticky">
            <div className="cara__inner">
              <div className="cara__intro">
                <p className="eyebrow eyebrow--left" data-reveal>Cara Kerja Serahin</p>
                <h2 className="h2 h2--left" id="cara-title" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>Empat langkah dari kampanye hingga pesanan sampai</h2>
                <p className="lead" data-reveal style={{ "--d": ".14s" } as React.CSSProperties}>Serahin mengikuti cara kerja PO yang sudah kamu kenal, lalu merapikannya.</p>
                <Link href="/seller/login" className="btn btn--ghost" data-reveal style={{ "--d": ".2s" } as React.CSSProperties}>
                  <span>Buat Kampanye Pertamamu</span>
                  <span className="btn__icon"><Icon name="arrow" /></span>
                </Link>
              </div>

              <ol className="steps">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="step" data-step>
                    <span className="step__num">{String(i + 1).padStart(2, "0")}</span>
                    <div><h3 className="step__title">{s.title}</h3><p className="step__text">{s.text}</p></div>
                    {i < STEPS.length - 1 && <span className="step__link" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ===== Pengalaman Buyer ===== */}
        <section className="panel panel--green buyer" id="etalase" aria-labelledby="buyer-title">
          <div className="buyer__inner">
            <div className="buyer__visual">
              <img className="buyer__shot" src="/revamp/etalase-katalog.webp" alt="Tampilan Katalog Serahin: kartu produk lengkap dengan harga, sisa stok, dan tanggal tutup PO" width={600} height={600} loading="lazy" data-reveal />

              <div className="float-card float-card--top" data-reveal style={{ "--d": ".15s" } as React.CSSProperties}>
                <div className="float-card__head">
                  <span className="float-card__icon"><img src="/revamp/kuota-transparan-icon.svg" alt="" width={24} height={24} /></span>
                  <p className="float-card__title">Kuota transparan</p>
                </div>
                <p className="float-card__text">Sisa stok selalu terlihat</p>
              </div>

              <div className="float-card float-card--bottom" data-reveal style={{ "--d": ".25s" } as React.CSSProperties}>
                <div className="float-card__head">
                  <span className="float-card__icon"><img src="/revamp/checkout-lebih-jelas-icon.svg" alt="" width={24} height={24} /></span>
                  <p className="float-card__title">Checkout lebih jelas</p>
                </div>
                <p className="float-card__text">Bayar dan pantau dari satu tempat</p>
              </div>

              <div className="buyer__cta" data-reveal style={{ "--d": ".3s" } as React.CSSProperties}>
                <span className="buyer__cta-icon"><Icon name="info" /></span>
                <p>Penasaran seperti apa tampilannya dari sisi buyer?</p>
                <Link href="/catalog" className="btn btn--ghost btn--sm"><span>Jelajahi Katalog</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
              </div>
            </div>

            <div className="buyer__copy">
              <p className="eyebrow eyebrow--left" data-reveal>Etalase Untuk Produkmu</p>
              <h2 className="h2 h2--left" id="buyer-title" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>Produkmu punya etalase sendiri</h2>
              <p className="lead" data-reveal style={{ "--d": ".14s" } as React.CSSProperties}>Setiap kampanye yang kamu buat bisa muncul di Katalog Serahin lengkap dengan harga, kuota, dan periode PO, sehingga buyer dapat memilih dengan yakin sebelum melanjutkan ke pembayaran.</p>

              <ul className="points">
                <li className="point" data-reveal style={{ "--d": ".18s" } as React.CSSProperties}>
                  <p className="point__kicker">Katalog Lintas Seller</p>
                  <h3 className="point__title"><Icon name="check-circle" />Tampil di satu etalase bersama</h3>
                  <p className="point__text">Produk PO-mu hadir di katalog yang mudah dijelajahi buyer, bukan hanya lewat satu tautan.</p>
                </li>
                <li className="point" data-reveal style={{ "--d": ".24s" } as React.CSSProperties}>
                  <p className="point__kicker">Harga &amp; Kuota Jelas</p>
                  <h3 className="point__title"><Icon name="check-circle" />Informasi penting terlihat sejak awal</h3>
                  <p className="point__text">Harga, sisa kuota, dan periode PO tersaji lengkap, jadi buyer tidak perlu bertanya lagi sebelum memesan.</p>
                </li>
                <li className="point" data-reveal style={{ "--d": ".3s" } as React.CSSProperties}>
                  <p className="point__kicker">Kategori &amp; Pencarian</p>
                  <h3 className="point__title"><Icon name="check-circle" />Mudah ditemukan oleh buyer yang tepat</h3>
                  <p className="point__text">Produkmu muncul di kategori seperti Fashion, Aksesori, dan Merchandise, dan bisa dicari langsung lewat kolom pencarian.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===== Testimonial ===== */}
        <section className="testi" id="testimonial" aria-labelledby="testi-title" ref={testiRef}>
          <div className="testi__sticky">
            <div className="testi__inner">
              <div className="testi__stage">
                <div className="testi__stack" data-testi-track>
                  <div className="testi__glow" aria-hidden="true" data-testi-glow />
                  {TESTIMONIALS.map((t) => (
                    <figure key={t.name} className="tcard" data-tcard>
                      <div className="tcard__quote">
                        <svg className="tcard__mark" aria-hidden="true"><use href="#i-quote" /></svg>
                        <blockquote><p>{t.quote}</p></blockquote>
                      </div>
                      <figcaption className="tcard__foot">
                        <span className="tcard__name">{t.name}</span>
                        <span className={`tcard__role${t.buyer ? " tcard__role--buyer" : ""}`}><Icon name="sparkle" />{t.role}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>

              <div className="testi__copy">
                <p className="eyebrow eyebrow--left" data-reveal>Testimonial</p>
                <h2 className="h2 h2--left" id="testi-title" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>Cerita dari<br /> Pengguna Serahin</h2>
                <p className="lead" data-reveal style={{ "--d": ".14s" } as React.CSSProperties}>Pengalaman kecil yang terasa berarti, baik saat mengelola pesanan maupun saat menunggu barang tiba.</p>
                <p className="testi__counter" aria-live="polite"><strong data-testi-current>01</strong> / {String(TESTIMONIALS.length).padStart(2, "0")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="panel faq" id="faq" aria-labelledby="faq-title">
          <h2 className="h2" id="faq-title" data-reveal>Yang mungkin ingin<br /> kamu tanyakan</h2>
          <div className="accordion">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`acc${openFaq === i ? " is-open" : ""}`} data-reveal style={{ "--d": `${i * 0.05}s` } as React.CSSProperties}>
                <h3 className="acc__h">
                  <button className="acc__btn" type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq((cur) => (cur === i ? null : i))}>
                    {f.q}
                    <Icon name="chevron" className="icon acc__chev" />
                  </button>
                </h3>
                <div className="acc__panel" role="region">
                  <div className="acc__inner"><p>{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="cta" aria-labelledby="cta-title">
          <div>
            <h2 className="h2 h2--left cta__title" id="cta-title" data-reveal>PO berikutnya, jalankan dengan lebih tenang.</h2>
            <p className="lead" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>Buka kampanye pertamamu hari ini dan rasakan bedanya mengelola pre-order yang rapi.</p>
          </div>
          <div className="btn-row" data-reveal style={{ "--d": ".14s" } as React.CSSProperties}>
            <Link href="/seller/login" className="btn btn--primary"><span>Mulai Jualan</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
            <Link href="/catalog" className="btn btn--ghost">
              <span>Lihat Katalog<span className="hide-sm"> Serahin</span></span>
              <span className="btn__icon"><Icon name="arrow" /></span>
            </Link>
          </div>
        </section>

        {/* ===== Playground ===== */}
        <section className="play" aria-label="Keunggulan Serahin — geser atau seret">
          <img className="play__word" src="/revamp/serahin-wordmark-blur.webp" alt="" width={2000} height={496} loading="lazy" />
          <div className="play__arena" ref={arenaRef}>
            {CHIPS.map((c, i) => (
              <span
                key={i}
                className={`chip${c.logo ? " chip--logo" : ""}`}
                data-chip
                data-x={c.x}
                data-y={c.y}
                data-r={c.r}
              >
                {c.logo ? <img src="/revamp/serahin-icon.webp" alt="" width={44} height={43} draggable={false} /> : c.text}
              </span>
            ))}
          </div>
          <p className="sr-only">Pre-order lebih rapi, kuota real-time, bayar terverifikasi, DP fleksibel, buyer tanpa akun.</p>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="footer">
        <div className="footer__top">
          <div className="footer__brand">
            <img src="/revamp/serahin-logo.webp" alt="Serahin" width={244} height={56} loading="lazy" />
            <p>Kelola pre-order dari kampanye dibuka sampai barang diserahkan.</p>
          </div>
          <form className="subscribe" onSubmit={handleSubscribe} noValidate>
            <label className="subscribe__label" htmlFor="sub-email">Subscribe</label>
            <div className="subscribe__field">
              <input id="sub-email" name="email" type="email" placeholder="Email address..." autoComplete="email" required />
              <button type="submit" className="subscribe__btn">Subscribe <Icon name="arrow-right" /></button>
            </div>
            <p className={`subscribe__note${subscribeState === "error" ? " is-error" : ""}${subscribeState === "ok" ? " is-ok" : ""}`} aria-live="polite">
              {subscribeState === "error"
                ? "Masukkan alamat email yang valid, misalnya nama@email.com."
                : subscribeState === "ok"
                  ? "Terima kasih! Kabar terbaru Serahin akan dikirim ke email kamu."
                  : (<>Dengan berlangganan, Anda menyetujui <a href="/privacy"><em>Kebijakan Privasi</em></a> kami.</>)}
            </p>
          </form>
        </div>

        <div className="footer__cols">
          <nav aria-labelledby="f-menu"><h2 className="footer__h" id="f-menu">Menu</h2><ul><li><a href="#kenapa">Kenapa Serahin</a></li><li><a href="#fitur">Fitur</a></li><li><a href="#cara-kerja">Cara Kerja</a></li><li><a href="#testimonial">Testimonial</a></li><li><a href="#faq">FAQ</a></li></ul></nav>
          <nav aria-labelledby="f-seller"><h2 className="footer__h" id="f-seller">Untuk Seller</h2><ul><li><Link href="/seller/login">Mulai Jualan</Link></li><li><Link href="/seller">Ajukan Sebagai Seller</Link></li></ul></nav>
          <nav aria-labelledby="f-buyer"><h2 className="footer__h" id="f-buyer">Untuk Buyer</h2><ul><li><Link href="/catalog">Katalog Serahin</Link></li><li><Link href="/account/login">Masuk Sebagai Buyer</Link></li></ul></nav>
          <nav aria-labelledby="f-legal"><h2 className="footer__h" id="f-legal">Legalitas</h2><ul><li><Link href="/privacy">Kebijakan Privasi</Link></li><li><Link href="/terms">Ketentuan Penggunaan</Link></li></ul></nav>
          <div><h2 className="footer__h">Kontak</h2>
            <address><ul>
              <li><a href="tel:+6285111510038" className="footer__contact"><Icon name="phone" />(+62) 851 1151 0038</a></li>
              <li><a href="mailto:suryadanikmah@gmail.com" className="footer__contact"><Icon name="mail" />suryadanikmah@gmail.com</a></li>
            </ul></address>
          </div>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} Serahin. Dibuat dengan hati di Indonesia.</p>
      </footer>
    </div>
  );
}
