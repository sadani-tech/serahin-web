"use client";

import { useTransition } from "react";
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="text-sm text-slate-600">
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
          onClick={() => startTransition(() => cancelDraft(draftId))}
        >
          Batalkan sesi
        </Button>
        <Button
          type="button"
          disabled={pending || !bisaKonfirmasi}
          onClick={() => startTransition(() => confirmImport(draftId))}
        >
          {pending
            ? "Memproses…"
            : `Konfirmasi Import (${pesananValid})`}
        </Button>
      </div>
    </div>
  );
}
