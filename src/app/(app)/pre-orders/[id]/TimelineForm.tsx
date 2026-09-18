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
      <label className="block text-xs font-bold uppercase tracking-wide text-sand-500">
        Milestone
        <select name="milestoneCode" defaultValue="" className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-sand-800">
          <option value="">Update umum</option>
          <option value="SUPPLIER_PROCESSING">Diproses supplier</option>
          <option value="INTERNATIONAL_TRANSIT">Pengiriman internasional</option>
          <option value="ARRIVED_INDONESIA">Tiba di Indonesia</option>
          <option value="QUALITY_CHECK">Pemeriksaan kualitas</option>
          <option value="READY_TO_SHIP">Siap dikirim</option>
          <option value="SHIPPED">Sudah dikirim</option>
        </select>
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
      <div className="flex justify-end">
        <Button type="submit">Tambah update</Button>
      </div>
    </form>
  );
}
