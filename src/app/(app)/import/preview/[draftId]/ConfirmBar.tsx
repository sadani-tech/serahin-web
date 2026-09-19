"use client";

import { useState, useTransition } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { Button } from "@/components/ui";
import { confirmImport, cancelDraft } from "../../actions";
import { ToastFeedback, useToast } from "@/components/Toast";

export function ConfirmBar({
  draftId,
  pesananValid,
  pesananError,
  bisaKonfirmasi,
}: {
  draftId: string;
  pesananValid: number;
  pesananError: number;
  bisaKonfirmasi: boolean;
}) {
  const [pending, startTransition] = useTransition();
  useOverlayWhilePending(pending);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmImport(draftId);
      if (result?.error) setError(result.error);
      else toast.success("Import berhasil dikonfirmasi.");
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelDraft(draftId);
      if (result?.error) setError(result.error);
      else toast.info("Sesi import dibatalkan.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm text-sand-600">
          <span className="font-semibold text-emerald-600">
            {pesananValid} pesanan valid
          </span>
          {pesananError > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-rose-600">
                {pesananError} akan dilewati
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={handleCancel}
          >
            Batalkan sesi
          </Button>
          <Button
            type="button"
            disabled={pending || !bisaKonfirmasi}
            onClick={handleConfirm}
          >
            {pending ? "Memproses…" : `Konfirmasi Import (${pesananValid})`}
          </Button>
        </div>
      </div>

      <ToastFeedback error={error} />
    </div>
  );
}
