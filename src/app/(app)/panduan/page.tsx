import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panduan Pengguna" };

type Section = { id: string; title: string; body: React.ReactNode };

const sections: Section[] = [
  {
    id: "mulai-cepat",
    title: "1. Mulai Cepat — Hal yang Perlu Disiapkan Pertama Kali",
    body: (
      <>
        <p>Sebelum membuat Batch PO pertama, lengkapi dua hal ini dulu:</p>
        <ol>
          <li>
            <strong>Pengaturan Toko</strong> (<Link href="/seller/profile">/seller/profile</Link>) — isi nama
            bisnis, deskripsi, email &amp; nomor kontak, dan URL logo. Data ini langsung tampil di storefront
            publik toko kamu (<code>/store/&lt;slug-toko&gt;</code>) yang akan dilihat Buyer.
          </li>
          <li>
            <strong>Rekening Transfer</strong> (<Link href="/rekening">/rekening</Link>) — tambahkan minimal satu
            rekening bank/e-wallet aktif. Rekening pertama yang kamu tambahkan otomatis jadi rekening utama.
            Tanpa rekening aktif, Buyer yang transfer manual tidak akan melihat tujuan pembayaran yang jelas saat
            checkout — Batch PO akan menampilkan peringatan sampai ini dilengkapi.
          </li>
        </ol>
        <p>
          Kalau kedua hal di atas sudah diisi, kamu siap membuat Batch PO pertama.
        </p>
      </>
    ),
  },
  {
    id: "batch-po",
    title: "2. Membuat Batch PO (Pre-Order)",
    body: (
      <>
        <p>
          Buka <Link href="/pre-orders">Pre-Order</Link> → <strong>Buat Batch PO</strong>. Isi nama produk,
          deskripsi, tanggal buka &amp; tutup pemesanan, skema pembayaran (Lunas Langsung atau DP + Pelunasan),
          dan — kalau skemanya DP + Pelunasan — persentase/nominal DP default serta deadline pelunasan.
        </p>
        <p>
          <strong>Batch PO yang baru dibuat otomatis berstatus &ldquo;Draft&rdquo;</strong> — ini normal dan disengaja. Status
          Draft artinya Batch PO belum tampil di katalog publik sama sekali, jadi kamu bisa menyiapkan semuanya
          dengan tenang tanpa terburu-buru. Buyer tidak akan pernah melihat Batch PO berstatus Draft.
        </p>
        <h3>Tambah Produk/Varian</h3>
        <p>
          Di tab <strong>Produk</strong> pada halaman detail Batch PO, tambahkan tiap varian yang dijual: nama
          varian, harga jual, kuota, dan — penting — <strong>HPP (Harga Pokok Penjualan)</strong>. Isi HPP sejak
          awal kalau bisa; kalau kosong, Produk itu akan muncul di laporan Keuangan sebagai &ldquo;HPP belum lengkap&rdquo;
          dan tidak ikut dihitung ke angka laba (lihat §7).
        </p>
        <p>
          Opsional per Produk: warna/varian tambahan, vendor pengerjaan, dan DP kustom (kalau DP Produk ini mau
          beda dari DP default Batch PO — misal Produk tertentu butuh DP lebih besar). Kolom DP di tabel Produk
          menampilkan nilai efektifnya langsung (mis. &ldquo;50%&rdquo;); warna badge biru berarti DP kustom Produk ini, abu
          berarti ikut DP default Batch PO.
        </p>
        <h3>Publish — Pindah ke Status &ldquo;Open&rdquo;</h3>
        <p>
          Setelah minimal satu Produk aktif dengan kuota tersedia, buka tab <strong>Info</strong> dan ubah status
          dari dropdown &ldquo;Ubah status Batch PO&rdquo; ke <strong>Open</strong>. Begitu status Open, Batch PO langsung
          tampil di katalog publik dan Buyer bisa mulai memesan.
        </p>
        <p>
          Status berikutnya (Produksi → Siap Kirim → Selesai) kamu ubah manual sesuai progres nyata — setiap
          perubahan status otomatis tercatat sebagai entri di tab <strong>Timeline</strong>.
        </p>
      </>
    ),
  },
  {
    id: "infokan-buyer",
    title: "3. Cara Menginfokan Batch PO ke Buyer",
    body: (
      <>
        <p>Ada beberapa cara membagikan Batch PO yang sudah Open ke calon pembeli:</p>
        <ul>
          <li>
            <strong>Link storefront toko</strong> — <code>https://serahin.suraise.com/store/&lt;slug-toko&gt;</code>,
            menampilkan semua produk aktif dari semua Batch PO toko kamu dalam satu halaman. Slug toko bisa
            dilihat di halaman Pengaturan Toko.
          </li>
          <li>
            <strong>Link produk spesifik</strong> — setiap Produk punya halaman detail sendiri
            (<code>/store/&lt;slug-toko&gt;/produk/&lt;slug-produk&gt;</code>) lengkap dengan galeri foto, harga,
            sisa kuota, dan tombol Tambah ke Keranjang/Beli Sekarang. Ini link paling cocok dibagikan ke grup
            WhatsApp/Instagram karena langsung mengarah ke barang yang dipromosikan.
          </li>
          <li>
            <strong>Broadcast email</strong> (<Link href="/broadcast">/broadcast</Link>) — kirim email ke Buyer
            yang pernah memesan produk tertentu atau punya status pembayaran tertentu, misalnya mengingatkan
            Batch PO baru dibuka atau deadline pelunasan mendekat. Setelah terkirim, buka ikon detail di baris
            riwayat broadcast untuk melihat siapa saja penerimanya dan status pengirimannya (berhasil/gagal/
            dilewati).
          </li>
          <li>
            <strong>Portal pesanan Buyer</strong> — setiap kali Buyer checkout, mereka otomatis mendapat link
            portal (<code>/portal/&lt;token&gt;</code>) untuk memantau status pesanan dan melunasi pembayaran
            tanpa perlu login. Link ini juga terkirim lewat email konfirmasi pesanan.
          </li>
        </ul>
        <p>
          Catatan: Seller yang sedang login TIDAK bisa menambah ke keranjang atau checkout sebagai Buyer di
          storefront — ini sengaja dibatasi supaya tidak tertukar antara akun Seller dan akun belanja pribadi.
          Buka storefront di mode penyamaran/browser lain (atau logout dulu) kalau mau coba alur belanja sebagai
          Buyer.
        </p>
      </>
    ),
  },
  {
    id: "kelola-pesanan",
    title: "4. Mengelola Pesanan Masuk",
    body: (
      <>
        <p>
          Semua keputusan atas pesanan masuk ada di <Link href="/verifikasi">Verifikasi</Link>, terbagi tiga
          subtab:
        </p>
        <ul>
          <li>
            <strong>Pesanan baru</strong> — pesanan dari form publik yang perlu disetujui/ditolak sebelum masuk
            alur pembayaran normal.
          </li>
          <li>
            <strong>Pembayaran</strong> — bukti transfer manual (DP maupun pelunasan) yang Buyer unggah, perlu
            dicek dan diverifikasi/ditolak. Klik bukti pembayaran untuk melihat gambarnya sebelum memutuskan.
          </li>
          <li>
            <strong>Pembatalan</strong> — pengajuan batal pesanan dari Buyer sendiri (Buyer hanya bisa mengajukan
            selama pesanan belum Dikirim/Selesai/Dibatalkan/Ditolak). Setujui atau tolak dengan alasan; kalau
            disetujui dan Buyer sudah pernah bayar, tandai <strong>&ldquo;Tandai Refund Selesai&rdquo;</strong> setelah kamu
            transfer balik dananya secara manual di luar sistem — sistem tidak memproses refund otomatis.
          </li>
        </ul>
        <p>
          Untuk melihat seluruh pesanan tanpa masuk ke satu Batch PO dulu, buka{" "}
          <Link href="/pesanan">Pesanan</Link> — tabel ini menampilkan semua pesanan lintas Batch PO toko kamu,
          dengan pencarian dan filter Batch PO/status/pembayaran.
        </p>
        <p>
          Pesanan yang invalid (misalnya data uji coba atau salah input) bisa dihapus langsung dari ikon tong
          sampah di tabel pesanan dalam halaman Batch PO — pesanan tanpa histori pembayaran dihapus permanen,
          yang sudah ada pembayaran/pengiriman otomatis dibatalkan &amp; diarsipkan saja (tidak dihapus total).
        </p>
      </>
    ),
  },
  {
    id: "pengiriman",
    title: "5. Pengiriman",
    body: (
      <>
        <p>
          Buyer memilih metode pengiriman (Shopee checkout atau ekspedisi manual) saat pelunasan. Untuk
          pengiriman manual, isi nomor resi di detail pesanan setelah paket dikirim — ini otomatis mengubah
          status pengiriman dan tercatat di timeline pesanan yang bisa dilihat Buyer dari portal mereka.
        </p>
      </>
    ),
  },
  {
    id: "keuangan",
    title: "6. Keuangan &amp; Laporan",
    body: (
      <>
        <p>
          Dashboard menampilkan dua angka utama: <strong>Dana masuk</strong> (uang yang benar-benar sudah
          diterima dari DP/pelunasan terverifikasi) dan <strong>Laba setelah HPP</strong> (nilai pesanan dikurangi
          HPP, HANYA dari pesanan yang Produknya sudah diisi HPP lengkap — makanya penting mengisi HPP sejak
          awal seperti disebut di §2).
        </p>
        <p>
          Halaman <Link href="/keuangan">Keuangan</Link> punya rincian lebih lengkap: Laba Bersih Riil per Batch
          PO, daftar pesanan yang HPP-nya belum lengkap (supaya kamu tahu persis mana yang perlu dilengkapi), dan
          tab Piutang (sisa tagihan Buyer yang belum lunas). Angka laba di sini adalah laba KOTOR — belum
          dikurangi fee payment gateway, ongkir yang disubsidi, atau refund.
        </p>
        <p>
          Kalau kamu bekerja sama dengan Vendor (pihak ketiga yang memproduksi/mengerjakan barang), catat
          pembayaran ke Vendor dari halaman detail Vendor (<Link href="/vendor">/vendor</Link>) — sistem otomatis
          menghitung sisa utang ke Vendor berdasarkan HPP × unit yang sudah diproses, dan kamu bisa unduh rekap
          PDF untuk dikirim ke Vendor sebagai bukti rekonsiliasi.
        </p>
      </>
    ),
  },
  {
    id: "pembeli",
    title: "7. Mengenal Pembeli (Buyer)",
    body: (
      <>
        <p>
          Tab <Link href="/pembeli">Pembeli</Link> menampilkan satu baris per akun Buyer yang pernah memesan di
          Batch PO toko kamu — bukan satu baris per pesanan. Klik ikon riwayat di tiap baris untuk membuka modal
          berisi seluruh pesanan Buyer tsb, berguna untuk cek pelanggan repeat order atau menjawab pertanyaan
          mereka dengan cepat.
        </p>
      </>
    ),
  },
  {
    id: "konten",
    title: "8. Konten Toko (FAQ)",
    body: (
      <>
        <p>
          Halaman <Link href="/konten/faq">FAQ</Link> memungkinkan kamu menulis pertanyaan yang sering ditanya
          Buyer (ongkir, estimasi produksi, cara pembayaran, dll) yang tampil di storefront publik toko kamu —
          mengurangi chat berulang ke WhatsApp pribadi.
        </p>
      </>
    ),
  },
  {
    id: "bantuan-lanjutan",
    title: "9. Butuh Bantuan Lebih Lanjut?",
    body: (
      <>
        <p>
          Lihat juga <Link href="/panduan/aplikasi">Panduan Aplikasi</Link> untuk memasang Serahin sebagai
          aplikasi di HP kamu. Kalau ada fitur yang membingungkan, error, atau ide perbaikan, kirim lewat{" "}
          <Link href="/kritik-saran">Kritik &amp; Saran</Link> — masukan kamu langsung masuk ke tim internal
          Serahin.
        </p>
      </>
    ),
  },
];

export default function PanduanPenggunaPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-2xl border border-sand-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sand-400">Daftar isi</p>
          <ul className="space-y-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-2 py-1.5 font-semibold text-sand-600 hover:bg-brand-50 hover:text-brand-700">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="space-y-6">
        <header>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Bantuan</p>
          <h1 className="mt-1 text-3xl font-extrabold text-sand-900">Panduan Pengguna Seller</h1>
          <p className="mt-2 max-w-2xl text-sm text-sand-600">
            Panduan lengkap mengelola toko di Serahin, dari pengaturan awal sampai cara menginfokan Batch PO ke
            Buyer.
          </p>
        </header>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-6 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-sand-900">{s.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-sand-700 [&_code]:rounded [&_code]:bg-sand-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-extrabold [&_h3]:text-sand-900 [&_a]:font-bold [&_a]:text-brand-700 [&_a]:underline [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
