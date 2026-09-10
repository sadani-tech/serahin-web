import { getPublicFaq } from "@/lib/cms";

/**
 * Tampilan FAQ pada halaman publik (v1.6 3.3). Menggabungkan FAQ global dan
 * FAQ khusus kampanye (bila campaignId diberikan).
 */
export async function PublicFaq({ campaignId }: { campaignId?: string }) {
  const faqs = await getPublicFaq(campaignId).catch(() => []);
  if (faqs.length === 0) return null;

  return (
    <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
      <div className="border-b border-sand-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-sand-900">
          Pertanyaan yang sering diajukan
        </h2>
      </div>
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
