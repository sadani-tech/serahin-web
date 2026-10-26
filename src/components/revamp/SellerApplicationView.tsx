"use client";

import Link from "next/link";
import { useRef } from "react";
import { IconSprite, Icon } from "./IconSprite";
import { RevampHeader } from "./RevampHeader";
import { usePageLoaded, useReveal, usePinnedReveal } from "./hooks";
import { SellerApplicationForm } from "@/app/seller/SellerApplicationForm";
import { SellerPortalActions } from "@/app/seller/SellerPortalActions";
import { publicSite } from "@/lib/public-site";

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#testimonial", label: "Testimonial" },
  { href: "/#faq", label: "FAQ" },
];

const KETENTUAN = [
  "Memiliki identitas dan kontak bisnis yang dapat diverifikasi.",
  "Menjelaskan produk, varian, harga, kuota, dan estimasi dengan jujur.",
  "Memahami karakter pre-order dan siap memenuhi pesanan sesuai Batch PO.",
  "Menunjuk kontak resmi untuk komunikasi dengan Admin dan buyer.",
  "Menyetujui Syarat & Ketentuan serta Kebijakan Privasi Serahin.",
];

const TANGGUNG_JAWAB = [
  "Memastikan informasi katalog dan status Batch PO selalu diperbarui.",
  "Menindaklanjuti pesanan, pembayaran, produksi, dan pengiriman sesuai alur.",
  "Memberikan update ketika terjadi perubahan jadwal, stok, atau kualitas.",
  "Tidak menggunakan data buyer di luar kebutuhan pemenuhan pesanan.",
  "Segera melaporkan kesalahan data, akses mencurigakan, atau insiden privasi.",
];

const ALUR = [
  { icon: "ps-doc-search", text: "Kirim form pengajuan melalui tombol Ajukan Registrasi di bawah." },
  { icon: "ps-chat-gear", text: "Admin meninjau identitas, produk, dan kesiapan operasional." },
  { icon: "ps-badge", text: "Setelah disetujui, Admin membantu menyiapkan profil dan Batch PO." },
  { icon: "store", text: "Seller dapat mengelola katalog dan pesanan sesuai hak akses yang diberikan." },
];

/** Ikon id ps-* tidak berprefix "i-" — render langsung, bukan lewat <Icon>. */
function PsIcon({ name }: { name: string }) {
  return (
    <svg className="icon" aria-hidden="true">
      <use href={`#${name}`} />
    </svg>
  );
}

function PinnedList({ title, items }: { title: React.ReactNode; items: string[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  usePinnedReveal(sectionRef);
  return (
    <section className="ps-pin ps-rules" ref={sectionRef} style={{ "--steps": items.length } as React.CSSProperties}>
      <div className="ps-pin__sticky">
        <div className="ps-rules__inner">
          <h2 className="h2 h2--left ps-rules__title">{title}</h2>
          <ul className="ps-list">
            {items.map((item) => (
              <li key={item} className="ps-item" data-pin-item>
                <span className="ps-item__tick"><Icon name="check" /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function SellerApplicationView({
  loggedIn,
  role,
}: {
  loggedIn: boolean;
  role?: "ADMIN" | "BUYER" | "SELLER";
}) {
  const loaded = usePageLoaded();
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLElement>(null);
  useReveal(rootRef);
  usePinnedReveal(flowRef);

  return (
    <div ref={rootRef} className={`rv-scope js${loaded ? " is-loaded" : ""}`}>
      <IconSprite />
      <RevampHeader navLinks={NAV_LINKS} loggedIn={loggedIn} role={role} />

      <main id="main">
        {/* ===== Hero ===== */}
        <section className="ps-hero">
          <div className="ps-hero__card">
            <div className="ps-hero__content">
              <p className="eyebrow" data-reveal>Untuk Seller</p>
              <h1 className="ps-hero__title" data-reveal style={{ "--d": ".06s" } as React.CSSProperties}>
                <span className="ps-hero__line">Bawa produkmu ke Serahin.</span>
                <span className="ps-hero__line">Kelola PO-nya lebih rapi.</span>
              </h1>
              <p className="ps-hero__lead" data-reveal style={{ "--d": ".12s" } as React.CSSProperties}>
                Tampilkan produk, atur Batch PO, pantau pesanan, dan jaga buyer tetap mendapat informasi yang jelas, semuanya dari satu tempat.
              </p>
              <div className="btn-row ps-hero__btns" data-reveal style={{ "--d": ".18s" } as React.CSSProperties}>
                <a href="#seller-application" className="btn btn--primary"><span>Ajukan Registrasi</span><span className="btn__icon"><Icon name="arrow" /></span></a>
                <Link href="/seller/login" className="btn btn--ghost"><span>Masuk sebagai Seller</span><span className="btn__icon"><Icon name="arrow" /></span></Link>
              </div>
            </div>
            <ul className="ps-hero__perks" data-reveal style={{ "--d": ".26s" } as React.CSSProperties}>
              <li><span className="tag__check"><Icon name="check" /></span>Ditinjau Admin</li>
              <li><span className="tag__check"><Icon name="check" /></span>Dibantu siapkan profil &amp; Batch PO</li>
              <li><span className="tag__check"><Icon name="check" /></span>Data buyer terlindungi</li>
            </ul>
          </div>
        </section>

        {/* ===== Ketentuan + Tanggung jawab ===== */}
        <PinnedList title={<>Ketentuan menjadi<br /> Seller Serahin</>} items={KETENTUAN} />
        <PinnedList title={<>Tanggung jawab<br /> Seller Serahin</>} items={TANGGUNG_JAWAB} />

        {/* ===== Privasi ===== */}
        <section className="section ps-privacy">
          <h2 className="h2" data-reveal>Perhatian tentang<br /> privasi dan keamanan</h2>
          <div className="ps-privacy__grid">
            <article className="ps-note" data-reveal>
              <h3 className="ps-note__title"><span className="ps-note__icon"><PsIcon name="ps-data" /></span>Data buyer</h3>
              <p className="ps-note__text">Data buyer adalah informasi terbatas, hanya untuk memproses pesanan dan pengiriman. Seller tidak boleh menyalin, menjual, menyebarkan, atau menghubungi buyer untuk promosi di luar konteks pesanan tanpa dasar yang sah dan persetujuan yang sesuai.</p>
            </article>
            <article className="ps-note" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>
              <h3 className="ps-note__title"><span className="ps-note__icon"><PsIcon name="ps-shield" /></span>Keamanan akun</h3>
              <p className="ps-note__text">Gunakan password yang kuat. Jangan bagikan password, PIN, OTP, atau tautan akses kepada siapa pun. Jika akun atau data pesanan diduga diakses pihak lain, segera hubungi <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>.</p>
            </article>
          </div>
        </section>

        {/* ===== Alur pengajuan ===== */}
        <section className="ps-pin ps-flow" ref={flowRef} style={{ "--steps": ALUR.length } as React.CSSProperties}>
          <div className="ps-pin__sticky">
            <div className="ps-flow__inner">
              <h2 className="h2">Alur pengajuan<br /> seller Serahin</h2>
              <ol className="ps-steps">
                {ALUR.map((step, i) => (
                  <li key={step.text} className="ps-step" data-pin-item>
                    <span className="ps-step__icon">{step.icon === "store" ? <Icon name="store" /> : <PsIcon name={step.icon} />}</span>
                    <p className="ps-step__num">{String(i + 1).padStart(2, "0")}</p>
                    <p className="ps-step__text">{step.text}</p>
                    {i < ALUR.length - 1 && <span className="ps-step__link" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ===== Form (pakai SellerApplicationForm/SellerPortalActions asli — tidak ditulis ulang) ===== */}
        <section className="ps-form" id="seller-application">
          <div className="ps-form__inner">
            <aside className="ps-form__aside">
              <div className="ps-form__intro">
                <h2 className="h2 h2--left" data-reveal>Ajukan diri jadi<br /> Seller Serahin</h2>
                <p className="lead" data-reveal style={{ "--d": ".08s" } as React.CSSProperties}>
                  Isi form singkat ini. Admin akan meninjau pengajuanmu sebelum katalog dan Batch PO bisa dipublikasikan.
                </p>
              </div>
              <SellerPortalActions />
            </aside>
            <SellerApplicationForm />
          </div>
        </section>

        <div className="ps-band" aria-hidden="true" />
      </main>

      {/* ===== Footer ===== */}
      <footer className="footer">
        <div className="footer__top">
          <div className="footer__brand">
            <img src="/revamp/serahin-logo.webp" alt="Serahin" width={244} height={56} loading="lazy" />
            <p>Kelola pre-order dari kampanye dibuka sampai barang diserahkan.</p>
          </div>
        </div>
        <div className="footer__cols">
          <nav aria-labelledby="f-menu"><h2 className="footer__h" id="f-menu">Menu</h2><ul><li><Link href="/#kenapa">Kenapa Serahin</Link></li><li><Link href="/#fitur">Fitur</Link></li><li><Link href="/#cara-kerja">Cara Kerja</Link></li><li><Link href="/#faq">FAQ</Link></li></ul></nav>
          <nav aria-labelledby="f-seller"><h2 className="footer__h" id="f-seller">Untuk Seller</h2><ul><li><Link href="/seller/login">Masuk sebagai Seller</Link></li><li><a href="#seller-application">Ajukan Registrasi</a></li></ul></nav>
          <nav aria-labelledby="f-buyer"><h2 className="footer__h" id="f-buyer">Untuk Buyer</h2><ul><li><Link href="/catalog">Katalog Serahin</Link></li><li><Link href="/account/login">Masuk Sebagai Buyer</Link></li></ul></nav>
          <nav aria-labelledby="f-legal"><h2 className="footer__h" id="f-legal">Legalitas</h2><ul><li><Link href="/privacy">Kebijakan Privasi</Link></li><li><Link href="/terms">Ketentuan Penggunaan</Link></li></ul></nav>
          <div><h2 className="footer__h">Kontak</h2>
            <address><ul>
              <li><a href={`mailto:${publicSite.email}`} className="footer__contact"><Icon name="mail" />{publicSite.email}</a></li>
            </ul></address>
          </div>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} Serahin. Dibuat dengan hati di Indonesia.</p>
      </footer>
    </div>
  );
}
