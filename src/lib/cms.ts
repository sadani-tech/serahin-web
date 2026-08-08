import { api } from "@/lib/api";

export type FooterPage = { slug: string; judul: string };
export type PublicFaqItem = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  campaignId: string | null;
};

/** Halaman statis terpublikasi untuk tautan footer publik (v1.6 3.1). */
export function getFooterPages(): Promise<FooterPage[]> {
  return api.get<FooterPage[]>("/cms/public/pages");
}

/** FAQ publik (global + per kampanye) (v1.6 3.3). */
export function getPublicFaq(campaignId?: string): Promise<PublicFaqItem[]> {
  return api.get<PublicFaqItem[]>("/cms/public/faq", { campaignId });
}
