// Konstanta & tipe formulir PO publik (dipisah dari actions "use server").

export type PublicOrderState =
  | { error?: string; warning?: string; needsConfirm?: boolean; needsCartConfirm?: boolean }
  | undefined;
