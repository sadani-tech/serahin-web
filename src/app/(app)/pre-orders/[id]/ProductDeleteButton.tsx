"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmDialog";
import { deletePreorderProduct } from "../actions";

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
    <Button
      type="button"
      variant="ghost"
      className="text-rose-600"
      onClick={remove}
      disabled={pending}
    >
      {pending ? "Memproses…" : terisi ? "Nonaktifkan" : "Hapus"}
    </Button>
  );
}
