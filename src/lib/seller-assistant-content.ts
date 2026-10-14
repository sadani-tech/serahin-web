/**
 * Konten Support Assistant Seller — skenario tanya-jawab murni statis
 * (BUKAN AI, BUKAN diteruskan ke Admin internal). Mengambil langsung dari
 * fitur-fitur yang sudah ada di Seller Workspace, plus bagian "Untuk Buyer"
 * supaya Seller bisa menjelaskan alur sisi Buyer ke pelanggannya sendiri.
 *
 * Tambah skenario baru dengan menambah entri `qa` di kategori terkait —
 * tidak perlu ubah komponen widget-nya (lihat SellerAssistantWidget.tsx).
 */

export type AssistantQA = { q: string; a: string };
export type AssistantCategory = {
  id: string;
  label: string;
  /** Nama ikon dari IconSprite (lihat src/components/revamp/IconSprite.tsx). */
  icon: string;
  qa: AssistantQA[];
};

export const SELLER_ASSISTANT_CATEGORIES: AssistantCategory[] = [
  {
    id: "pre-order",
    label: "Pre-Order / Batch PO",
    icon: "store",
    qa: [
      {
        q: "Bagaimana cara bikin Batch PO baru?",
        a: "Buka menu Pre-Order → tombol \"+ Buat Batch PO\". Isi nama produk, tanggal buka/tutup, skema pembayaran (Lunas atau DP + Pelunasan), lalu simpan. Batch PO baru tanpa Produk otomatis berstatus Draft — belum bisa dipesan sampai minimal satu Produk aktif ditambahkan.",
      },
      {
        q: "Kenapa Batch PO saya tidak bisa menerima pesanan?",
        a: "Batch PO hanya menerima pesanan saat statusnya Open DAN punya minimal satu Produk aktif dengan kuota tersisa. Cek tab Info & Status untuk status saat ini, dan tab Produk untuk memastikan ada Produk yang aktif dan kuotanya belum habis.",
      },
      {
        q: "Bisa duplikat Batch PO yang sudah ada?",
        a: "Bisa — buka Batch PO yang ingin diduplikat, lalu pilih \"Duplikasi\". Batch baru akan dibuat dengan data yang sama (nama, skema pembayaran, Produk) tapi riwayat timeline-nya bersih seperti Batch PO baru.",
      },
      {
        q: "Apa beda status Open, Closed, Produksi, Siap Kirim, dan Selesai?",
        a: "Open = masih menerima pesanan. Closed = pemesanan ditutup, tidak ada pesanan baru. Produksi & Siap Kirim = status produksi barang (diatur manual lewat tab Info & Status). Selesai = seluruh pesanan Batch PO ini sudah terkirim/diterima.",
      },
    ],
  },
  {
    id: "produk",
    label: "Produk Center",
    icon: "box-eye",
    qa: [
      {
        q: "Apa itu menu Produk / Produk Center?",
        a: "Katalog produk milik toko Anda sendiri, terpisah dari Batch PO manapun. Buat Produk sekali di sini, lalu tempelkan ke Batch PO mana saja yang Anda mau — tidak perlu ketik ulang nama, kategori, atau gambar tiap kali buka Batch PO baru.",
      },
      {
        q: "Bedanya \"Produk Baru\" dan \"Pilih dari Produk Center\" saat menambah Produk ke Batch PO?",
        a: "\"Produk Baru\" membuat item benar-benar baru khusus Batch PO ini. \"Pilih dari Produk Center\" menempelkan Produk yang sudah ada di katalog Anda ke Batch PO ini — Anda tinggal isi harga, kuota, dan HPP khusus untuk Batch PO ini saja; nama, SKU, kategori, dan gambar produknya tetap ikut yang di Produk Center.",
      },
      {
        q: "Kenapa Produk yang sudah dipakai tidak bisa saya hapus dari Produk Center?",
        a: "Produk yang sudah pernah ditempelkan ke Batch PO manapun tidak bisa dihapus permanen (supaya riwayat pesanan lama tetap aman) — nonaktifkan saja lewat tombol Edit Produk di halaman detailnya.",
      },
      {
        q: "Bagaimana cara lihat Batch PO mana saja yang memakai satu Produk?",
        a: "Buka Produk Center, klik nama Produknya, lalu lihat bagian \"Riwayat Pemakaian\" di halaman detail — daftar semua Batch PO yang pernah/sedang memakai Produk itu beserta harga dan kuotanya masing-masing.",
      },
    ],
  },
  {
    id: "pesanan",
    label: "Pesanan",
    icon: "truck",
    qa: [
      {
        q: "Bagaimana urutan status pesanan dari masuk sampai selesai?",
        a: "Baru Masuk → Menunggu DP / DP Diterima → Lunas → Produksi → Siap Kirim → Dikirim → Selesai. Ubah status lewat halaman detail pesanan sesuai progres aslinya.",
      },
      {
        q: "Pesanan dengan DP sudah lunas tapi statusnya belum berubah otomatis, kenapa?",
        a: "Status otomatis naik ke Lunas begitu sisa tagihan pesanan benar-benar Rp0 setelah pelunasan diverifikasi. Kalau masih ada selisih kecil atau pembayaran belum diverifikasi, status akan tetap di DP Diterima sampai itu beres.",
      },
      {
        q: "Buyer minta batalkan pesanan, bagaimana prosesnya?",
        a: "Buyer mengajukan pembatalan dari portal pesanannya. Pengajuan itu muncul di menu Verifikasi → tab Pembatalan. Anda bisa Setujui (status pesanan jadi Dibatalkan, refund ditandai Pending untuk ditindaklanjuti) atau Tolak dengan alasan.",
      },
      {
        q: "Bisa edit data pesanan (email/catatan) setelah Batch PO-nya ditutup?",
        a: "Bisa — edit data pesanan (bukan item/produknya) tetap diizinkan meski Batch PO sudah Closed, selama tidak melebihi kuota yang sudah diambil pesanan itu sendiri.",
      },
    ],
  },
  {
    id: "verifikasi",
    label: "Verifikasi Pembayaran",
    icon: "check-circle",
    qa: [
      {
        q: "Bagaimana cara verifikasi bukti transfer manual?",
        a: "Buka menu Verifikasi → tab Pembayaran, lihat daftar pembayaran menunggu verifikasi, periksa buktinya, lalu pilih Setujui atau Tolak. Menolak wajib disertai alasan supaya buyer tahu apa yang perlu diperbaiki.",
      },
      {
        q: "Saya salah menolak/menyetujui pembayaran, bisa diubah lagi?",
        a: "Keputusan verifikasi yang sudah final tidak bisa ditarik ulang dari daftar antrean (sudah keluar dari status \"Menunggu Verifikasi\"). Hubungi buyer langsung untuk koordinasi pembayaran ulang/penyesuaian bila terjadi kesalahan.",
      },
      {
        q: "Apa itu verifikasi checkout Shopee?",
        a: "Kalau Batch PO Anda mengaktifkan opsi pelunasan via Shopee checkout, buyer akan unggah bukti nomor transaksi Shopee alih-alih transfer manual — ini diverifikasi terpisah di tab yang sama, berdasarkan nominal checkout yang sudah Anda tentukan di pengaturan Batch PO.",
      },
    ],
  },
  {
    id: "keuangan",
    label: "Rekening & Keuangan",
    icon: "wallet",
    qa: [
      {
        q: "Kenapa saya diminta tambah rekening bank?",
        a: "Batch PO tidak bisa dibuka untuk umum sebelum toko Anda punya minimal satu rekening bank aktif & utama — ini jadi tujuan transfer manual buyer. Tambahkan lewat menu Rekening.",
      },
      {
        q: "Apa arti \"Laba setelah HPP\" di Dashboard?",
        a: "Estimasi laba kotor: total nilai pesanan terbayar dikurangi HPP (Harga Pokok Produksi) tiap item yang terjual. Kalau ada Produk yang HPP-nya belum diisi, pesanan itu masuk hitungan \"HPP belum lengkap\" dan tidak ikut dihitung sampai HPP-nya diisi.",
      },
      {
        q: "Bagaimana cara catat pembayaran ke Vendor?",
        a: "Buka menu Vendor, pilih vendor terkait, lalu catat pembayaran lewat form di halaman detail vendornya — otomatis mengurangi utang vendor yang ditampilkan di menu Keuangan.",
      },
    ],
  },
  {
    id: "broadcast-konten",
    label: "Broadcast & FAQ",
    icon: "mail",
    qa: [
      {
        q: "Bagaimana cara kirim pengumuman ke semua buyer di satu Batch PO?",
        a: "Buka menu Broadcast → buat broadcast baru, pilih Batch PO target, tulis subjek & pesan, lalu kirim. Broadcast dikirim lewat email ke seluruh buyer yang punya pesanan aktif di Batch PO itu.",
      },
      {
        q: "Di mana saya atur FAQ yang muncul di halaman Batch PO publik?",
        a: "Menu FAQ di sidebar — tambahkan pertanyaan & jawaban yang sering ditanyakan buyer, lalu tempelkan ke Batch PO terkait lewat pengaturan Batch PO itu sendiri.",
      },
    ],
  },
  {
    id: "import-export",
    label: "Import & Export",
    icon: "upload",
    qa: [
      {
        q: "Saya punya data pesanan lama di Excel, bisa diimpor?",
        a: "Bisa lewat menu Import. Unduh template dulu (ada 2 mode: Mode A untuk Batch PO benar-benar baru, Mode B untuk menambah pesanan ke Batch PO yang sudah ada), isi sesuai kolom template, lalu unggah — akan ada pratinjau sebelum data benar-benar disimpan.",
      },
      {
        q: "Bagaimana cara unduh laporan pesanan atau keuangan?",
        a: "Menu Export menyediakan unduhan Excel/PDF untuk data pesanan, kontak buyer, dan rekap keuangan — bisa difilter per Batch PO atau rentang tanggal.",
      },
    ],
  },
  {
    id: "untuk-buyer",
    label: "Untuk Buyer (bantu jelaskan ke pelanggan)",
    icon: "cart",
    qa: [
      {
        q: "Bagaimana cara Buyer memesan tanpa bikin akun?",
        a: "Buyer bisa isi form pesanan langsung lewat link publik Batch PO Anda (tanpa login) untuk Batch PO tertentu, ATAU membuat akun Buyer di /account/register untuk bisa memantau semua pesanannya dari satu dashboard. Jelaskan ke Buyer: membuat akun membuat histori pesanan lebih rapi dan mudah dicek ulang.",
      },
      {
        q: "Bagaimana Buyer membayar DP dan pelunasan?",
        a: "Buyer mengunggah bukti transfer manual (atau bukti checkout Shopee bila diaktifkan) lewat portal pesanannya. Pembayaran itu masuk ke antrean Verifikasi Anda — statusnya baru berubah setelah Anda menyetujui buktinya.",
      },
      {
        q: "Bagaimana Buyer melihat status pesanannya?",
        a: "Lewat halaman \"Pesanan Saya\" di akun Buyer (atau link token pribadi untuk pesanan tanpa akun) — tampil progres kampanye, status pembayaran, sisa tagihan, dan info pengiriman, update otomatis mengikuti perubahan yang Anda lakukan di sisi Seller.",
      },
      {
        q: "Buyer saya mau kasih ulasan, kapan itu bisa dilakukan?",
        a: "Form ulasan/testimoni baru muncul di halaman detail pesanan Buyer setelah pesanan itu berstatus Selesai. Ulasan yang masuk perlu Anda tinjau dulu (lewat menu terkait) sebelum tampil publik.",
      },
      {
        q: "Buyer tanya kenapa tidak bisa checkout produk tertentu?",
        a: "Kemungkinan besar kuota Produk itu sudah habis (\"Sisa 0 pcs\") atau Batch PO-nya sudah Closed. Cek kuota di tab Produk Batch PO terkait.",
      },
    ],
  },
];
