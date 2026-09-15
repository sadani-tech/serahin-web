import { getPublicFaq } from "@/lib/cms";

/**
 * Tampilan FAQ pada halaman publik (v1.6 3.3). Menggabungkan FAQ global dan
 * FAQ khusus kampanye (bila campaignId diberikan).
 */
export async function PublicFaq({ campaignId }: { campaignId?: string }) {
  const cmsFaqs = await getPublicFaq(campaignId).catch(() => []);
  const staticFaqs = [
    { id: "static-cara-kerja", pertanyaan: "Bagaimana cara kerja Serahin?", jawaban: "Pilih produk dari katalog, buka kampanye yang sesuai, pilih varian dan jumlah, lalu masuk atau buat akun Buyer untuk menyelesaikan checkout. Setelah itu Anda dapat memantau pembayaran, produksi, dan pengiriman dari portal pesanan." },
    { id: "static-po", pertanyaan: "Apa itu kampanye pre-order?", jawaban: "Kampanye pre-order adalah periode pemesanan terbatas. Produk diproses setelah kampanye ditutup sesuai jadwal produksi dan estimasi pengiriman yang tercantum di halaman kampanye." },
    { id: "static-account", pertanyaan: "Mengapa saya perlu membuat akun Buyer?", jawaban: "Akun Buyer menjaga pesanan tetap terhubung dengan Anda, memungkinkan checkout yang aman, serta menyediakan dashboard untuk melihat seluruh riwayat dan status pesanan." },
    { id: "static-payment", pertanyaan: "Bagaimana pembayaran DP dan pelunasan dilakukan?", jawaban: "Skema pembayaran mengikuti kampanye. Anda dapat membayar DP terlebih dahulu lalu melunasi sesuai instruksi, atau membayar lunas bila kampanye menggunakan skema tersebut. Pembayaran manual menunggu verifikasi Admin." },
    { id: "static-status", pertanyaan: "Di mana saya dapat melihat status pesanan?", jawaban: "Gunakan tombol Lihat Pesanan setelah checkout atau buka tautan portal yang dikirimkan. Buyer yang sudah login juga dapat melihat semua pesanan dari menu Pesanan Saya." },
    { id: "static-quota", pertanyaan: "Apa arti kuota pada kartu produk?", jawaban: "Kuota menunjukkan jumlah unit yang masih dapat dipesan pada kampanye tersebut. Kuota dapat berubah ketika pesanan lain masuk dan akan divalidasi kembali saat checkout." },
    { id: "static-multiple", pertanyaan: "Apakah saya bisa membeli dari beberapa kampanye?", jawaban: "Bisa. Setiap kampanye memiliki checkout dan pesanan terpisah agar pembayaran, kuota, dan pengiriman tetap jelas. Semua pesanan Anda tetap dirangkum dalam satu dashboard Buyer." },
    { id: "static-support", pertanyaan: "Bagaimana cara menghubungi Serahin?", jawaban: "Gunakan halaman Hubungi Kami untuk pertanyaan tentang kampanye, pembayaran, atau pesanan. Jangan pernah membagikan PIN, OTP, atau kata sandi kepada siapa pun." },
  ];
  const faqs = campaignId
    ? cmsFaqs
    : [...staticFaqs, ...cmsFaqs.filter((faq) => !staticFaqs.some((item) => item.pertanyaan.toLowerCase() === faq.pertanyaan.toLowerCase()))];
  if (faqs.length === 0) return null;

  return (
    <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
      <div className="divide-y divide-sand-100">
        {faqs.map((f) => (
          <details key={f.id} className="group px-5 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-sand-800">
              {f.pertanyaan}
              <span className="text-sand-400 transition group-open:rotate-180">
                ⌄
              </span>
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-sand-600">
              {f.jawaban}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
