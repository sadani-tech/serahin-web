"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rollbackImportAction } from "../actions";

export function RollbackButton({ importLogId }: { importLogId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run() {
    if (!confirm("Rollback sesi import ini? Seluruh data hasil sesi ini akan dihapus.")) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const res = await rollbackImportAction(importLogId);
      if (res?.error) setError(res.error);
      else router.refresh();
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
      {error && <p className="mt-1 max-w-xs text-xs text-rose-600">{error}</p>}
    </div>
  );
}
