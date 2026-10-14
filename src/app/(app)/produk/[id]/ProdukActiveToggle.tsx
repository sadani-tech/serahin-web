"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { toggleProdukActive } from "../actions";

export function ProdukActiveToggle({ produkId, isActive }: { produkId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function handleToggle() {
    const next = !active;
    startTransition(async () => {
      const res = await toggleProdukActive(produkId, next);
      if (res?.error) {
        toast.error(res.error, { title: "Gagal mengubah status" });
        return;
      }
      setActive(next);
      toast.success(next ? "Produk diaktifkan." : "Produk dinonaktifkan.");
    });
  }

  return (
    <Button type="button" variant="secondary" onClick={handleToggle} disabled={pending}>
      {pending ? "Menyimpan…" : active ? "Nonaktifkan" : "Aktifkan"}
    </Button>
  );
}
