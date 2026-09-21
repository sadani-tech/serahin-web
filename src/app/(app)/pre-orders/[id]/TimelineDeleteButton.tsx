"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmDialog";
import { deleteTimelineEntry } from "../actions";

export function TimelineDeleteButton({
  campaignId,
  entryId,
}: {
  campaignId: string;
  entryId: string;
}) {
  const [pending, setPending] = useState(false);
  const { confirm, alert } = useConfirm();
  const router = useRouter();
  async function remove() {
    const ok = await confirm({
      title: "Hapus permanen timeline?",
      description:
        "Entri ini akan dihapus permanen dan tidak dapat dipulihkan.",
      confirmLabel: "Hapus permanen",
    });
    if (!ok) return;
    setPending(true);
    const result = await deleteTimelineEntry(campaignId, entryId);
    setPending(false);
    if (result?.error)
      return alert({
        title: "Gagal menghapus timeline",
        description: result.error,
      });
    router.refresh();
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className="ml-auto text-xs text-rose-600"
      disabled={pending}
      onClick={remove}
    >
      {pending ? "Menghapus…" : "Hapus"}
    </Button>
  );
}
