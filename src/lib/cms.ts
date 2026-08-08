import { prisma } from "@/lib/prisma";

/** Daftar halaman statis terpublikasi untuk tautan footer publik (v1.6 3.1). */
export async function getFooterPages() {
  return prisma.staticPage.findMany({
    where: { status: "PUBLISH" },
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    select: { slug: true, judul: true },
  });
}

/**
 * FAQ untuk ditampilkan publik (v1.6 3.3): FAQ global (campaignId null) plus
 * FAQ khusus kampanye bila campaignId diberikan. Diurutkan sesuai `urutan`.
 */
export async function getPublicFaq(campaignId?: string) {
  return prisma.faqEntry.findMany({
    where: {
      aktif: true,
      OR: [{ campaignId: null }, ...(campaignId ? [{ campaignId }] : [])],
    },
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    select: { id: true, pertanyaan: true, jawaban: true, campaignId: true },
  });
}
