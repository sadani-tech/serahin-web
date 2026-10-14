const LABEL: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Dalam antrean",
  SENDING: "Mengirim",
  COMPLETED: "Selesai",
  PARTIAL_FAILED: "Sebagian gagal",
  CANCELLED: "Dibatalkan",
};

export function Status({ value }: { value: string }) {
  return <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{LABEL[value] ?? value}</span>;
}
