"use client";

import { useConfirm } from "@/components/ConfirmDialog";

export function DeleteBankAccountButton({ action }: { action: () => Promise<void> }) {
  const { confirm } = useConfirm();

  async function handleClick() {
    const ok = await confirm({
      title: "Hapus rekening ini dari pilihan transfer Seller?",
      confirmLabel: "Hapus",
    });
    if (ok) await action();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
    >
      Hapus
    </button>
  );
}
