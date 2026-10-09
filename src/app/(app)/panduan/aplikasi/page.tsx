import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panduan Aplikasi" };

export default function PanduanAplikasiPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Bantuan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-sand-900">Panduan Aplikasi</h1>
        <p className="mt-2 text-sm text-sand-600">
          Serahin bisa dipasang sebagai aplikasi di HP kamu langsung dari browser — tidak perlu Play Store atau
          App Store. Setelah terpasang, ikon Serahin muncul di layar utama dan terbuka tanpa bar alamat browser,
          seperti aplikasi biasa.
        </p>
      </header>

      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
          </span>
          <h2 className="text-lg font-extrabold text-sand-900">Android (Google Chrome)</h2>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-sand-700">
          <li>Buka <code className="rounded bg-sand-100 px-1.5 py-0.5 text-xs">serahin.suraise.com</code> di Chrome, lalu login seperti biasa.</li>
          <li>
            Ketuk ikon titik tiga (⋮) di pojok kanan atas Chrome.
          </li>
          <li>
            Pilih <strong>&ldquo;Instal aplikasi&rdquo;</strong> atau <strong>&ldquo;Tambahkan ke layar Utama&rdquo;</strong> (nama
            menunya sedikit beda tergantung versi Chrome).
          </li>
          <li>Ketuk <strong>&ldquo;Instal&rdquo;</strong> pada dialog konfirmasi yang muncul.</li>
          <li>Ikon Serahin akan muncul di layar utama HP kamu, siap dibuka seperti aplikasi lain.</li>
        </ol>
        <p className="mt-3 text-xs text-sand-500">
          Kalau menu &ldquo;Instal aplikasi&rdquo; tidak muncul, Chrome kamu mungkin sudah pernah menutup banner instal
          sebelumnya — opsi &ldquo;Tambahkan ke layar Utama&rdquo; di menu titik tiga tetap berfungsi sama.
        </p>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-sand-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
          </span>
          <h2 className="text-lg font-extrabold text-sand-900">iPhone/iPad (Safari)</h2>
        </div>
        <p className="mt-2 text-xs font-semibold text-amber-700">
          Harus dibuka lewat Safari — menu &ldquo;Tambah ke Layar Utama&rdquo; tidak tersedia di Chrome/browser lain di iOS.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-sand-700">
          <li>Buka <code className="rounded bg-sand-100 px-1.5 py-0.5 text-xs">serahin.suraise.com</code> di Safari, lalu login seperti biasa.</li>
          <li>
            Ketuk ikon <strong>Bagikan</strong> (kotak dengan panah ke atas) di bagian bawah layar.
          </li>
          <li>
            Scroll ke bawah pada daftar opsi, lalu ketuk <strong>&ldquo;Tambah ke Layar Utama&rdquo;</strong> (&ldquo;Add to Home
            Screen&rdquo;).
          </li>
          <li>Ketuk <strong>&ldquo;Tambah&rdquo;</strong> di pojok kanan atas.</li>
          <li>Ikon Serahin akan muncul di layar utama, siap dibuka seperti aplikasi lain.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
          </span>
          <h2 className="text-lg font-extrabold text-sand-900">Komputer/Laptop (Chrome/Edge)</h2>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-sand-700">
          <li>Buka <code className="rounded bg-sand-100 px-1.5 py-0.5 text-xs">serahin.suraise.com</code> di Chrome atau Edge.</li>
          <li>
            Cari ikon <strong>Instal</strong> (biasanya gambar layar dengan panah ke bawah) di ujung kanan bar
            alamat, lalu klik dan pilih <strong>&ldquo;Instal&rdquo;</strong>.
          </li>
          <li>Serahin akan terbuka di jendela terpisah dan muncul sebagai aplikasi di menu Start/Dock.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-cream-soft p-6">
        <h2 className="text-sm font-extrabold text-sand-900">Masih bingung atau ada kendala?</h2>
        <p className="mt-2 text-sm text-sand-600">
          Lihat juga <Link href="/panduan" className="font-bold text-brand-700 underline">Panduan Pengguna</Link>{" "}
          atau kirim pertanyaan lewat{" "}
          <Link href="/kritik-saran" className="font-bold text-brand-700 underline">Kritik &amp; Saran</Link>.
        </p>
      </section>
    </div>
  );
}
