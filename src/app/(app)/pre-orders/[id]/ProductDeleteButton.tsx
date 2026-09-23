"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmDialog";
import { deletePreorderProduct } from "../actions";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function DeactivateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M7 7l10 10" />
    </svg>
  );
}

export function ProductDeleteButton({
  campaignId,
  productId,
  terisi,
}: {
  campaignId: string;
  productId: string;
  terisi: number;
}) {
  const [pending, setPending] = useState(false);
  const { confirm, alert } = useConfirm();
  const router = useRouter();
  async function remove() {
    const ok = await confirm({
      title: terisi ? "Nonaktifkan Produk?" : "Hapus Produk?",
      description: terisi
        ? "Produk sudah memiliki pesanan dan akan dinonaktifkan agar histori tetap aman."
        : "Produk belum memiliki pesanan dan akan dihapus permanen.",
      confirmLabel: terisi ? "Nonaktifkan" : "Hapus",
    });
    if (!ok) return;
    setPending(true);
    const result = await deletePreorderProduct(campaignId, productId);
    setPending(false);
    if ("error" in result)
      return alert({
        title: "Gagal memproses Produk",
        description: result.error,
      });
    router.refresh();
  }
  return (
    <IconButton
      variant="danger"
      onClick={remove}
      disabled={pending}
      title={terisi ? "Nonaktifkan Produk" : "Hapus Produk"}
    >
      {pending ? (
        <span className="text-xs">…</span>
      ) : terisi ? (
        <DeactivateIcon />
      ) : (
        <TrashIcon />
      )}
    </IconButton>
  );
}
