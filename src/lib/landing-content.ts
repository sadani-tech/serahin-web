export type IconName =
  | "campaign"
  | "orders"
  | "payment"
  | "timeline"
  | "portal"
  | "vendor"
  | "report"
  | "catalog"
  | "whatsapp"
  | "seller"
  | "owner"
  | "shield";

export type FeatureGroup = {
  id: "operasional" | "pembeli" | "data";
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  features: Array<{
    icon: IconName;
    title: string;
    description: string;
    detail: string;
  }>;
};

export const featureGroups: FeatureGroup[] = [
  {
    id: "operasional",
    label: "Operasional PO",
    eyebrow: "Semua tetap terkendali",
    title: "Dari buka PO sampai barang terkirim.",
    description:
      "Alur kerja yang menyatukan kampanye, kuota, pesanan, pembayaran, dan progres produksi—tanpa bongkar banyak spreadsheet.",
    features: [
      {
        icon: "campaign",
        title: "Kampanye & kuota",
        description: "Atur periode, varian, harga, warna, gambar, dan kuota dalam satu kampanye.",
        detail: "Kuota aktif dihitung otomatis untuk membantu mencegah oversell.",
      },
      {
        icon: "orders",
        title: "Pesanan terpusat",
        description: "Kelola pesanan multi-varian, status, pembatalan, dan riwayat pembeli.",
        detail: "Filter dan aksi massal mempercepat pekerjaan saat order ramai.",
      },
      {
        icon: "payment",
        title: "DP & pelunasan",
        description: "Pilih skema lunas langsung, DP persentase, atau DP nominal.",
        detail: "Sisa tagihan mengikuti pembayaran yang benar-benar terverifikasi.",
      },
      {
        icon: "timeline",
        title: "Timeline produksi",
        description: "Catat progres dari PO ditutup, produksi, siap kirim, hingga selesai.",
        detail: "Riwayat status tetap terbaca oleh tim dan pembeli.",
      },
    ],
  },
  {
    id: "pembeli",
    label: "Pengalaman pembeli",
    eyebrow: "Lebih jelas bagi pembeli",
    title: "Informasi lengkap, sejak pilih produk.",
    description:
      "Pembeli dapat memesan, membayar, memilih pengiriman, dan mengikuti progres melalui halaman yang nyaman digunakan di ponsel.",
    features: [
      {
        icon: "catalog",
        title: "Form PO seperti katalog",
        description: "Galeri produk, pilihan warna, metadata, kuota, dan ringkasan keranjang.",
        detail: "Pembeli memahami pilihannya sebelum mengirim pesanan.",
      },
      {
        icon: "portal",
        title: "Portal mandiri",
        description: "Satu tautan personal untuk status order, tagihan, pembayaran, dan timeline.",
        detail: "Pembeli tidak perlu terus menanyakan progres lewat chat.",
      },
      {
        icon: "payment",
        title: "Kirim bukti bayar",
        description: "Pembayaran DP maupun pelunasan dapat diajukan langsung dari portal.",
        detail: "Status pengajuan terlihat jelas sembari menunggu verifikasi.",
      },
      {
        icon: "orders",
        title: "Pilihan pengiriman",
        description: "Pilih ekspedisi manual atau checkout melalui kanal yang disediakan seller.",
        detail: "Instruksi dan alamat tersimpan bersama proses pelunasan.",
      },
    ],
  },
  {
    id: "data",
    label: "Data & pertumbuhan",
    eyebrow: "Data siap dipakai",
    title: "Bukan sekadar daftar order.",
    description:
      "Serahin menjaga data operasional tetap rapi agar seller mudah mengambil keputusan, membuat laporan, dan melanjutkan pertumbuhan bisnis.",
    features: [
      {
        icon: "report",
        title: "Dashboard ringkas",
        description: "Pantau kampanye aktif, pesanan, tagihan, dan pekerjaan yang perlu ditindaklanjuti.",
        detail: "Prioritas harian terlihat sejak membuka dashboard.",
      },
      {
        icon: "vendor",
        title: "Manajemen vendor",
        description: "Simpan vendor, relasikan ke kampanye dan varian, lalu catat evaluasinya.",
        detail: "Riwayat kerja sama tidak tercecer di catatan pribadi.",
      },
      {
        icon: "report",
        title: "Import & export",
        description: "Bawa data historis masuk dan ekspor pesanan, keuangan, atau kontak sesuai filter.",
        detail: "Mendukung kebutuhan arsip dan proses kerja di luar sistem.",
      },
      {
        icon: "shield",
        title: "Jejak data yang aman",
        description: "Validasi kuota, sanitasi konten, audit export, dan soft delete untuk histori penting.",
        detail: "Keputusan operasional punya sumber data yang dapat ditelusuri.",
      },
    ],
  },
];
export const steps = [
  {
    number: "01",
    title: "Siapkan kampanye",
    description: "Tentukan jadwal, produk, varian, kuota, harga, dan skema pembayaran.",
  },
  {
    number: "02",
    title: "Bagikan form PO",
    description: "Pembeli memilih produk dan mengirim order dari tautan publik yang praktis.",
  },
  {
    number: "03",
    title: "Kelola dari dashboard",
    description: "Verifikasi pesanan dan pembayaran, lalu pantau kuota serta tagihan.",
  },
  {
    number: "04",
    title: "Kirim dengan tenang",
    description: "Bagikan progres, catat pengiriman, dan tutup kampanye dengan histori rapi.",
  },
];
export const roadmap = [
  {
    version: "v1.0–v2.3.2",
    status: "Tersedia",
    tone: "available" as const,
    title: "Operasional PO & marketplace",
    description:
      "Kampanye, katalog lintas Seller, akun Buyer, keranjang, pesanan, pembayaran, portal pembeli, timeline, vendor, dan dashboard operasional.",
    items: ["Kelola PO end-to-end", "Katalog & akun Buyer", "Seller terisolasi"],
  },
  {
    version: "PRD v2.9",
    status: "Direncanakan",
    tone: "planned" as const,
    title: "Notifikasi WhatsApp",
    description:
      "Reminder pelunasan, update produksi, konfirmasi pembayaran, dan status pengiriman melalui WhatsApp Cloud API.",
    items: ["4 trigger otomatis", "Template pesan", "Log & retry pengiriman"],
  },
  {
    version: "PRD v2.4",
    status: "Arah berikutnya",
    tone: "future" as const,
    title: "Frontend Buyer terpisah",
    description:
      "Buyer Storefront dipisahkan dari operational console Admin dan Seller agar session, navigasi, dan konteks aplikasi lebih tegas.",
    items: ["Session boundary", "Buyer storefront", "Operational console"],
  },
];

export const faqs = [
  {
    question: "Serahin cocok untuk bisnis apa?",
    answer:
      "Serahin dirancang untuk seller yang menjalankan penjualan berbasis pre-order—mulai dari produk fesyen, merchandise, kerajinan, hingga produk batch lain yang punya periode, varian, kuota, dan tahap produksi.",
  },
  {
    question: "Apakah pembeli harus membuat akun?",
    answer:
      "Tidak. Pembeli memesan melalui form publik dan menerima tautan portal personal untuk melihat status serta mengirim pembayaran. Alur ini menjaga pengalaman pembeli tetap ringan.",
  },
  {
    question: "Apakah Serahin mendukung DP?",
    answer:
      "Ya. Seller dapat memilih lunas langsung atau DP + pelunasan. DP dapat berupa persentase maupun nominal tetap, dan sisa tagihan dihitung dari pembayaran yang sudah diverifikasi.",
  },
  {
    question: "Apakah notifikasi WhatsApp dan marketplace sudah tersedia?",
    answer:
      "Fondasi marketplace multi-seller sudah tersedia pada v2.3. Notifikasi WhatsApp tetap berada pada roadmap v2.9 dan ditampilkan terpisah dari kemampuan yang sudah aktif.",
  },
  {
    question: "Bagaimana landing page mengikuti PRD baru?",
    answer:
      "Konten fitur dan roadmap disimpan dalam satu registry terpusat. Saat PRD baru disetujui atau fitur berpindah status, copy dan label fase dapat diperbarui tanpa merombak struktur halaman.",
  },
];
