"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export type KontenFormState = { error?: string } | undefined;

// --- Halaman statis (3.1) ---

function pageBody(formData: FormData) {
  return {
    judul: String(formData.get("judul") ?? ""),
    slug: (formData.get("slug") as string) || undefined,
    konten: String(formData.get("konten") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    urutan: Number(formData.get("urutan") ?? 0),
  };
}

export async function createStaticPage(
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  let page: { id: string };
  try {
    page = await api.post<{ id: string }>("/cms/pages", pageBody(formData));
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/konten");
  redirect(`/konten/${page.id}`);
}

export async function updateStaticPage(
  id: string,
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  try {
    await api.patch(`/cms/pages/${id}`, pageBody(formData));
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/konten");
  revalidatePath(`/konten/${id}`);
  redirect(`/konten/${id}`);
}

export async function deleteStaticPage(id: string): Promise<void> {
  await api.del(`/cms/pages/${id}`);
  revalidatePath("/konten");
  redirect("/konten");
}

// --- FAQ (3.3) ---

function faqBody(formData: FormData) {
  return {
    pertanyaan: String(formData.get("pertanyaan") ?? ""),
    jawaban: String(formData.get("jawaban") ?? ""),
    urutan: Number(formData.get("urutan") ?? 0),
    campaignId: (formData.get("campaignId") as string) || null,
    aktif: !!formData.get("aktif"),
  };
}

export async function createFaq(
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  try {
    await api.post("/cms/faq", faqBody(formData));
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/konten/faq");
  return undefined;
}

export async function updateFaq(
  id: string,
  _prev: KontenFormState,
  formData: FormData,
): Promise<KontenFormState> {
  try {
    await api.patch(`/cms/faq/${id}`, faqBody(formData));
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/konten/faq");
  return undefined;
}

export async function deleteFaq(id: string): Promise<void> {
  await api.del(`/cms/faq/${id}`);
  revalidatePath("/konten/faq");
}
