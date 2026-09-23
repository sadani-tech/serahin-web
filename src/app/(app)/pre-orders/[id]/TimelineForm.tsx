"use client";

import { useRef, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { addTimelineEntry } from "../actions";

export function TimelineForm({ campaignId }: { campaignId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const action = addTimelineEntry.bind(null, campaignId);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setError("");
        const result = await action(fd);
        if (result?.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <label className="block text-xs font-bold uppercase tracking-wide text-sand-500">
        Milestone
        <Select name="milestoneCode" defaultValue="" required className="mt-1 min-h-11 w-full text-sm font-medium normal-case tracking-normal text-sand-800">
          <option value="" disabled>Pilih progres</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="PRODUCTION">Produksi</option>
          <option value="SHIPMENT">Shipment</option>
          <option value="PACKING">Packing</option>
          <option value="DELIVERED">Deliver</option>
          <option value="COMPLETED">Selesai</option>
        </Select>
      </label>
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
      <label className="flex items-start gap-2 text-sm text-sand-700">
        <input name="isBuyerVisible" type="checkbox" className="mt-1" />
        <span><strong>Tampilkan ke Buyer</strong><br /><span className="text-xs text-sand-500">Hanya update yang ditandai ini muncul di portal dan dashboard Buyer.</span></span>
      </label>
      {error && <p className="text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit">Tambah update</Button>
      </div>
    </form>
  );
}
