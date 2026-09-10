import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";
import {
  CommunicationPreferenceForm,
  DataDeletionForm,
} from "./DataDeletionForm";

export const metadata: Metadata = {
  title: "Penghapusan Data Serahin",
  description: "Petunjuk dan formulir permintaan penghapusan data Serahin.",
  alternates: { canonical: "/data-deletion" },
};

export default function DataDeletionPage() {
  return (
    <PublicPageShell
      eyebrow="Privasi"
      title="Permintaan penghapusan data"
      intro="Anda dapat mengajukan penghapusan atau anonimisasi data Serahin tanpa memiliki akun pembeli."
    >
      <h2>Proses permintaan</h2>
      <ol>
        <li>Kirim email/WhatsApp yang pernah dipakai dan referensi pesanan bila ada.</li>
        <li>Tim memverifikasi bahwa Anda berwenang atas data tersebut.</li>
        <li>Data yang tidak wajib dipertahankan akan dihapus atau dianonimkan.</li>
        <li>Hasil penyelesaian dikirim melalui kontak yang sudah diverifikasi.</li>
      </ol>
      <p>
        Data transaksi tertentu dapat dipertahankan selama diperlukan untuk
        kewajiban hukum, akuntansi, keamanan, pencegahan fraud, refund, atau
        sengketa. Jika berlaku, kami akan menjelaskan kategori data dan alasannya.
      </p>
      <p>
        Jika formulir bermasalah, kirim permintaan ke{" "}
        <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>.
      </p>
      <DataDeletionForm />
      <section id="communication-preferences" className="scroll-mt-24">
        <h2>Preferensi komunikasi WhatsApp</h2>
        <p>
          Anda dapat menarik persetujuan update WhatsApp non-esensial untuk
          pesanan tertentu. Informasi transaksi yang wajib untuk keamanan,
          pembayaran, atau pemenuhan pesanan tetap dapat disampaikan seperlunya.
        </p>
        <CommunicationPreferenceForm />
      </section>
    </PublicPageShell>
  );
}
