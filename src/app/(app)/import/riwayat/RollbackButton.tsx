"use client";

import { useState, useTransition } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { useRouter } from "next/navigation";
import { rollbackImportAction } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { ToastFeedback, useToast } from "@/components/Toast";

export function RollbackButton({ importLogId }: { importLogId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useOverlayWhilePending(pending);
  const [error, setError] = useState<string>();
  const { confirm } = useConfirm();
  const toast = useToast();

  async function run() {
    const ok = await confirm({
      title: "Rollback sesi import ini?",
      description: "Seluruh data hasil sesi ini akan dihapus.",
      confirmLabel: "Rollback",
    });
    if (!ok) return;
    setError(undefined);
    startTransition(async () => {
      const res = await rollbackImportAction(importLogId);
      if (res?.error) setError(res.error);
      else {
        toast.success("Rollback import berhasil.");
        router.refresh();
      }
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={run}
        disabled={pending}
        className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "Memproses…" : "Rollback"}
      </button>
      <ToastFeedback error={error} />
    </div>
  );
}
