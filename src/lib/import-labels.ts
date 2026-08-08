import type { ImportMode, ImportStatus } from "@/lib/types";

export const IMPORT_MODE_LABEL: Record<ImportMode, string> = {
  KAMPANYE_PENUH: "Kampanye Penuh (Mode A)",
  PESANAN: "Pesanan ke Kampanye (Mode B)",
  LEGACY: "Format Lawas",
};

export const IMPORT_STATUS_LABEL: Record<ImportStatus, string> = {
  BERHASIL: "Berhasil",
  DIROLLBACK: "Dirollback",
};
