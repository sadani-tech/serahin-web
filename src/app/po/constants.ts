// Konstanta & tipe formulir PO publik (dipisah dari actions "use server").

export const MAX_UNIT_PER_SUBMISSION = 5; // FR open Q#3

export type PublicOrderState =
  | { error?: string; warning?: string; needsConfirm?: boolean; needsCartConfirm?: boolean }
  | undefined;
