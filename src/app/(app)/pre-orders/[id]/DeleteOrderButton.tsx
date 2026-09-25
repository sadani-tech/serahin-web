"use client";

import { useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";

/**
 * Hapus pesanan invalid — Admin saja (dijaga juga oleh backend `@Roles("ADMIN")`
 * dan gating role di server component pemanggil). Disederhanakan dari
 * `DestructiveActionForm` (v2.3.8 FR-38.47): tidak perlu lagi mengetik ulang
 * ID/token/nama pembeli sebagai konfirmasi — `confirmation` diisi otomatis
 * dari `orderId` yang backend sudah tahu, cukup isi alasan lalu satu klik
 * konfirmasi lewat modal blur (`useConfirm`), bukan `window.confirm` native.
 */
export function DeleteOrderButton({
  action,
  orderId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { confirm } = useConfirm();

  async function submit() {
    if (reason.trim().length < 5) return;
    const ok = await confirm({
      title: "Hapus pesanan ini?",
      description:
        "Pesanan tanpa payment/shipment dihapus permanen. Pesanan dengan histori finansial hanya dibatalkan dan diarsipkan. Tindakan ini tercatat di audit log.",
      confirmLabel: "Ya, hapus",
    });
    if (!ok) return;
    setPending(true);
    formRef.current?.requestSubmit();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-10 rounded-xl border border-rose-300 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
      >
        Bersihkan pesanan
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <input type="hidden" name="confirmation" value={orderId} />
      <label className="text-xs font-bold text-rose-900">
        Alasan
        <input
          name="reason"
          required
          minLength={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 min-h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal"
          placeholder="Jelaskan alasan tindakan"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || reason.trim().length < 5}
          className="min-h-10 rounded-lg bg-rose-700 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Menghapus…" : "Hapus pesanan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-10 px-3 text-sm font-bold text-sand-600"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
