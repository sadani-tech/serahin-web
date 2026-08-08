"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

export type KontenFormState = { error?: string } | undefined;

// --- Halaman statis (3.1) --------------------------------------------------

const pageSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  slug: z.string().optional(),
  konten: z.string(),
  status: z.enum(["DRAFT", "PUBLISH"]),
  urutan: z.coerce.number().int().min(0).optional(),
});

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "halaman";
  let candidate = root;
  let n = 2;
  // Cari slug yang belum dipakai halaman lain.
  while (true) {
    const existing = await prisma.staticPage.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${n++}`;
  }
}

export async function createStaticPage(
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  await requireUser();
  const parsed = pageSchema.safeParse({
    judul: formData.get("judul"),
    slug: formData.get("slug") || undefined,
    konten: formData.get("konten") ?? "",
    status: formData.get("status"),
    urutan: formData.get("urutan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  if (isRichTextEmpty(d.konten)) {
    return { error: "Konten halaman tidak boleh kosong" };
  }

  const slug = await uniqueSlug(d.slug || d.judul);
  const page = await prisma.staticPage.create({
    data: {
      judul: d.judul,
      slug,
      konten: sanitizeRichText(d.konten),
      status: d.status,
      urutan: d.urutan ?? 0,
    },
  });

  revalidatePath("/konten");
  redirect(`/konten/${page.id}`);
}

export async function updateStaticPage(
  id: string,
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  await requireUser();
  const parsed = pageSchema.safeParse({
    judul: formData.get("judul"),
    slug: formData.get("slug") || undefined,
    konten: formData.get("konten") ?? "",
    status: formData.get("status"),
    urutan: formData.get("urutan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  if (isRichTextEmpty(d.konten)) {
    return { error: "Konten halaman tidak boleh kosong" };
  }

  const existing = await prisma.staticPage.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) return { error: "Halaman tidak ditemukan" };

  const slug =
    d.slug && slugify(d.slug) !== existing.slug
      ? await uniqueSlug(d.slug, id)
      : existing.slug;

  await prisma.staticPage.update({
    where: { id },
    data: {
      judul: d.judul,
      slug,
      konten: sanitizeRichText(d.konten),
      status: d.status,
      urutan: d.urutan ?? 0,
    },
  });

  revalidatePath("/konten");
  revalidatePath(`/konten/${id}`);
  revalidatePath(`/halaman/${slug}`);
  redirect(`/konten/${id}`);
}

export async function deleteStaticPage(id: string): Promise<void> {
  await requireUser();
  await prisma.staticPage.delete({ where: { id } });
  revalidatePath("/konten");
  redirect("/konten");
}

// --- FAQ (3.3) -------------------------------------------------------------

const faqSchema = z.object({
  pertanyaan: z.string().min(1, "Pertanyaan wajib diisi"),
  jawaban: z.string().min(1, "Jawaban wajib diisi"),
  urutan: z.coerce.number().int().min(0).optional(),
  campaignId: z.string().optional(),
  aktif: z.coerce.boolean().optional(),
});

function parseFaq(formData: FormData) {
  return faqSchema.safeParse({
    pertanyaan: formData.get("pertanyaan"),
    jawaban: formData.get("jawaban"),
    urutan: formData.get("urutan") || undefined,
    campaignId: formData.get("campaignId") || undefined,
    aktif: formData.get("aktif") ? true : false,
  });
}

export async function createFaq(
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  await requireUser();
  const parsed = parseFaq(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const data: Prisma.FaqEntryCreateInput = {
    pertanyaan: d.pertanyaan,
    jawaban: d.jawaban,
    urutan: d.urutan ?? 0,
    aktif: d.aktif ?? true,
  };
  if (d.campaignId) {
    data.campaign = { connect: { id: d.campaignId } };
  }
  await prisma.faqEntry.create({ data });
  revalidatePath("/konten/faq");
  return undefined;
}

export async function updateFaq(
  id: string,
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  await requireUser();
  const parsed = parseFaq(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  await prisma.faqEntry.update({
    where: { id },
    data: {
      pertanyaan: d.pertanyaan,
      jawaban: d.jawaban,
      urutan: d.urutan ?? 0,
      aktif: d.aktif ?? true,
      campaignId: d.campaignId || null,
    },
  });
  revalidatePath("/konten/faq");
  return undefined;
}

export async function deleteFaq(id: string): Promise<void> {
  await requireUser();
  await prisma.faqEntry.delete({ where: { id } });
  revalidatePath("/konten/faq");
}
