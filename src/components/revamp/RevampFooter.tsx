"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./IconSprite";

/** Footer bersama halaman revamp — brand, subscribe, kolom navigasi, kontak. */
export function RevampFooter() {
  const [state, setState] = useState<"idle" | "error" | "ok">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    setState(ok ? "ok" : "error");
    if (ok) {
      e.currentTarget.reset();
      setTimeout(() => setState("idle"), 6000);
    }
  }

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <img src="/revamp/serahin-logo.webp" alt="Serahin" width={244} height={56} loading="lazy" />
          <p>Kelola pre-order dari kampanye dibuka sampai barang diserahkan.</p>
        </div>
        <form className="subscribe" onSubmit={handleSubmit} noValidate>
          <label className="subscribe__label" htmlFor="sub-email">Subscribe</label>
          <div className="subscribe__field">
            <input id="sub-email" name="email" type="email" placeholder="Email address..." autoComplete="email" required />
            <button type="submit" className="subscribe__btn">Subscribe <Icon name="arrow-right" /></button>
          </div>
          <p className={`subscribe__note${state === "error" ? " is-error" : ""}${state === "ok" ? " is-ok" : ""}`} aria-live="polite">
            {state === "error"
              ? "Masukkan alamat email yang valid, misalnya nama@email.com."
              : state === "ok"
                ? "Terima kasih! Kabar terbaru Serahin akan dikirim ke email kamu."
                : (<>Dengan berlangganan, Anda menyetujui <a href="/privacy"><em>Kebijakan Privasi</em></a> kami.</>)}
          </p>
        </form>
      </div>

      <div className="footer__cols">
        <nav aria-labelledby="f-menu"><h2 className="footer__h" id="f-menu">Menu</h2><ul><li><Link href="/#kenapa">Kenapa Serahin</Link></li><li><Link href="/#fitur">Fitur</Link></li><li><Link href="/#cara-kerja">Cara Kerja</Link></li><li><Link href="/#testimonial">Testimonial</Link></li><li><Link href="/#faq">FAQ</Link></li></ul></nav>
        <nav aria-labelledby="f-seller"><h2 className="footer__h" id="f-seller">Untuk Seller</h2><ul><li><Link href="/seller/login">Mulai Jualan</Link></li><li><Link href="/seller">Ajukan Sebagai Seller</Link></li></ul></nav>
        <nav aria-labelledby="f-buyer"><h2 className="footer__h" id="f-buyer">Untuk Buyer</h2><ul><li><Link href="/catalog">Katalog Serahin</Link></li><li><Link href="/arsip">Arsip Katalog Serahin</Link></li><li><Link href="/account/login">Masuk Sebagai Buyer</Link></li></ul></nav>
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
  );
}
