"use client";

import { useState, useTransition } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { Button } from "@/components/ui";
import { confirmImport, cancelDraft } from "../../actions";

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

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmImport(draftId);
      if (result?.error) setError(result.error);
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelDraft(draftId);
      if (result?.error) setError(result.error);
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

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          <span className="font-medium">Gagal: </span>{error}
        </div>
      )}
    </div>
  );
}
