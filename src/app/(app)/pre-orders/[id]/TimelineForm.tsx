"use client";

import { useRef } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { addTimelineEntry } from "../actions";

export function TimelineForm({ campaignId }: { campaignId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addTimelineEntry.bind(null, campaignId);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <Input
        name="judulUpdate"
        placeholder="Judul update — mis. Produksi dimulai"
        required
      />
      <Textarea
        name="catatan"
        rows={2}
        placeholder="Catatan (opsional) — detail progres atau alasan keterlambatan."
      />
      <div className="flex justify-end">
        <Button type="submit">Tambah update</Button>
      </div>
    </form>
  );
}
