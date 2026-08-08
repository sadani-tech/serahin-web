"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ImportMode } from "@/generated/prisma";
import { parseFileToSheets, getValidationForDraft, buildCommitPlan } from "@/lib/import/context";
import { executeImport, rollbackImport } from "@/lib/import/execute";
import { MAX_BARIS_IMPORT, type ImportUploadState } from "./constants";

export async function uploadImport(
  _prev: ImportUploadState,
  formData: FormData,
): Promise<ImportUploadState> {
  const user = await requireUser();

  const mode = String(formData.get("mode")) as ImportMode;
  if (!["KAMPANYE_PENUH", "PESANAN"].includes(mode)) {
    return { error: "Mode import tidak valid." };
  }
  const targetCampaignId = String(formData.get("targetCampaignId") ?? "") || null;
  if (mode === "PESANAN" && !targetCampaignId) {
    return { error: "Kampanye tujuan wajib dipilih untuk Mode B." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File wajib diunggah." };
  }

  let draftId: string;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const sheets = parseFileToSheets(buf, mode);
    if (sheets.pesanan.length === 0) {
      return { error: "Sheet Pesanan kosong atau tidak ditemukan." };
    }
    if (sheets.pesanan.length > MAX_BARIS_IMPORT) {
      return {
        error: `Terlalu banyak baris (${sheets.pesanan.length}). Maksimal ${MAX_BARIS_IMPORT} pesanan per sesi.`,
      };
    }
    const draft = await prisma.importDraft.create({
      data: {
        mode,
        namaFile: file.name,
        targetCampaignId,
        data: sheets as unknown as object,
        createdById: user.id,
      },
    });
    draftId = draft.id;
  } catch (e) {
    return {
      error: e instanceof Error ? `Gagal membaca file: ${e.message}` : "Gagal membaca file.",
    };
  }

  redirect(`/import/preview/${draftId}`);
}

export async function confirmImport(draftId: string) {
  const user = await requireUser();
  const draft = await prisma.importDraft.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("Draft import tidak ditemukan.");

  const validation = await getValidationForDraft(draft);
  const plan = buildCommitPlan(validation, draft, user.id);

  if (plan.orders.length === 0) {
    throw new Error("Tidak ada baris valid untuk diimpor.");
  }

  const logId = await executeImport(plan);
  await prisma.importDraft.delete({ where: { id: draftId } });

  revalidatePath("/import/riwayat");
  revalidatePath("/kampanye");
  redirect(`/import/riwayat?sukses=${logId}`);
}

export async function cancelDraft(draftId: string) {
  await requireUser();
  await prisma.importDraft.deleteMany({ where: { id: draftId } });
  redirect("/import");
}

export async function rollbackImportAction(importLogId: string) {
  await requireUser();
  const res = await rollbackImport(importLogId);
  revalidatePath("/import/riwayat");
  revalidatePath("/kampanye");
  return res;
}
